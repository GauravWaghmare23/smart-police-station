import Suspect from '../models/Suspect.js';
import FIR from '../models/FIR.js';
import Complaint from '../models/Complaint.js';
import PoliceOfficer from '../models/PoliceOfficer.js';
import { ApiResponse } from '../utils/response.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { generateUniqueId } from '../utils/generateId.js';
import { logAudit } from '../middleware/auditLog.middleware.js';

export const createSuspect = asyncHandler(async (req, res) => {
  const { name, alias, gender, age, phone, idProof, address, status, charges, firId, complaintId, arrestStatus } = req.body;

  if (!name || !name.trim()) {
    throw new ApiError(400, 'Suspect name is required');
  }

  // Validate referenced FIR if provided
  if (firId) {
    const existingFir = await FIR.findById(firId);
    if (!existingFir) {
      throw new ApiError(404, `Referenced FIR not found with ID: ${firId}`);
    }
  }

  // Validate referenced Complaint if provided
  if (complaintId) {
    const existingComplaint = await Complaint.findById(complaintId);
    if (!existingComplaint) {
      throw new ApiError(404, `Referenced Complaint not found with ID: ${complaintId}`);
    }
  }

  let stationId = null;
  const officer = await PoliceOfficer.findOne({ userId: req.user._id });
  if (officer) {
    stationId = officer.stationId;
  }

  const suspectId = generateUniqueId('SUS');

  const suspect = await Suspect.create({
    suspectId,
    name: name.trim(),
    alias: alias || '',
    gender: gender || 'UNKNOWN',
    age: age ? Number(age) : null,
    phone: phone || '',
    idProof: idProof || '',
    address: address || '',
    status: status || 'SUSPECT',
    charges: charges || [],
    arrestStatus: arrestStatus ? {
      isArrested: Boolean(arrestStatus.isArrested),
      arrestDate: arrestStatus.arrestDate || null,
      arrestingOfficerId: arrestStatus.arrestingOfficerId || req.user._id,
      custodyLocation: arrestStatus.custodyLocation || ''
    } : undefined,
    createdOfficerId: req.user._id,
    stationId,
    linkedFirIds: firId ? [firId] : [],
    linkedComplaintIds: complaintId ? [complaintId] : []
  });

  // Automatically update FIR's suspectIds array using $addToSet to prevent duplicates
  if (firId) {
    await FIR.findByIdAndUpdate(firId, { $addToSet: { suspectIds: suspect._id } });
  }

  // Emit realtime updates to control room and assigned officers
  const { sendRealtimeEvent } = await import('../sockets/socket.js');
  sendRealtimeEvent('control-room', 'suspect:created', { message: `New suspect added: ${name}`, suspect });
  if (firId) {
    sendRealtimeEvent(`fir:${firId}`, 'suspect:updated', { message: `Suspect ${name} linked to FIR`, suspect });
  }

  await logAudit({
    userId: req.user._id,
    userName: req.user.name,
    userRole: req.user.role,
    action: 'CREATE_SUSPECT',
    resourceType: 'Suspect',
    resourceId: suspect.suspectId,
    details: `Created suspect record for ${name} (${suspect.status})`
  });

  return ApiResponse(res, 201, 'Suspect record created successfully', { suspect });
});

export const getSuspects = asyncHandler(async (req, res) => {
  const { search, status, firId } = req.query;
  const query = {};

  if (status) {
    query.status = status;
  }
  if (firId) {
    query.linkedFirIds = firId;
  }
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { alias: { $regex: search, $options: 'i' } },
      { suspectId: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } }
    ];
  }

  // Jurisdiction filter for Station Head
  if (req.user.role === 'STATION_HEAD') {
    const officer = await PoliceOfficer.findOne({ userId: req.user._id });
    if (officer && officer.stationId) {
      query.stationId = officer.stationId;
    }
  }

  const suspects = await Suspect.find(query)
    .populate({
      path: 'linkedFirIds',
      select: 'firNumber crimeType status policeStationId investigatingOfficerId complaintId description',
      populate: [
        { path: 'policeStationId', select: 'name stationCode address' },
        { path: 'investigatingOfficerId', select: 'name email phone' },
        { path: 'complaintId', select: 'complaintId title location' }
      ]
    })
    .populate('linkedComplaintIds', 'complaintId title status location')
    .populate('stationId', 'name stationCode address')
    .populate('arrestStatus.arrestingOfficerId', 'name badgeNumber email')
    .sort({ createdAt: -1 });

  await logAudit({
    userId: req.user._id,
    userName: req.user.name,
    userRole: req.user.role,
    action: 'SEARCH_SUSPECTS',
    resourceType: 'Suspect',
    details: `Queried suspect directory (Count: ${suspects.length})`
  });

  return ApiResponse(res, 200, 'Suspects retrieved successfully', { suspects });
});

export const getSuspectById = asyncHandler(async (req, res) => {
  const suspect = await Suspect.findById(req.params.id)
    .populate({
      path: 'linkedFirIds',
      populate: [
        { path: 'policeStationId', select: 'name stationCode address' },
        { path: 'investigatingOfficerId', select: 'name email phone' },
        { path: 'complaintId', select: 'complaintId title location' }
      ]
    })
    .populate('linkedComplaintIds')
    .populate('stationId')
    .populate('createdOfficerId', 'name email phone')
    .populate('arrestStatus.arrestingOfficerId', 'name badgeNumber email');

  if (!suspect) {
    throw new ApiError(404, 'Suspect record not found');
  }

  await logAudit({
    userId: req.user._id,
    userName: req.user.name,
    userRole: req.user.role,
    action: 'VIEW_SUSPECT_DETAILS',
    resourceType: 'Suspect',
    resourceId: suspect.suspectId,
    details: `Accessed full dossier for ${suspect.name}`
  });

  return ApiResponse(res, 200, 'Suspect details retrieved successfully', { suspect });
});

export const updateSuspect = asyncHandler(async (req, res) => {
  const { status, arrestStatus, courtOutcome, charges, address, phone, firId, complaintId } = req.body;

  const suspect = await Suspect.findById(req.params.id);
  if (!suspect) {
    throw new ApiError(404, 'Suspect record not found');
  }

  if (status) suspect.status = status;
  if (address) suspect.address = address;
  if (phone) suspect.phone = phone;
  if (charges) suspect.charges = charges;

  // Use arrestStatus consistently (NOT arrestDetails)
  if (arrestStatus) {
    suspect.arrestStatus = {
      isArrested: arrestStatus.isArrested !== undefined ? Boolean(arrestStatus.isArrested) : suspect.arrestStatus.isArrested,
      arrestDate: arrestStatus.arrestDate || suspect.arrestStatus.arrestDate,
      arrestingOfficerId: arrestStatus.arrestingOfficerId || suspect.arrestStatus.arrestingOfficerId || req.user._id,
      custodyLocation: arrestStatus.custodyLocation !== undefined ? arrestStatus.custodyLocation : suspect.arrestStatus.custodyLocation
    };
  }

  if (courtOutcome) {
    suspect.courtOutcome = { ...suspect.courtOutcome, ...courtOutcome };
  }

  // Prevent duplicate FIR relationships using $addToSet logic / unique push
  if (firId) {
    const existingFir = await FIR.findById(firId);
    if (!existingFir) {
      throw new ApiError(404, `Referenced FIR not found with ID: ${firId}`);
    }
    if (!suspect.linkedFirIds.includes(firId)) {
      suspect.linkedFirIds.push(firId);
    }
    await FIR.findByIdAndUpdate(firId, { $addToSet: { suspectIds: suspect._id } });
  }

  // Prevent duplicate Complaint relationships
  if (complaintId) {
    const existingComplaint = await Complaint.findById(complaintId);
    if (!existingComplaint) {
      throw new ApiError(404, `Referenced Complaint not found with ID: ${complaintId}`);
    }
    if (!suspect.linkedComplaintIds.includes(complaintId)) {
      suspect.linkedComplaintIds.push(complaintId);
    }
  }

  await suspect.save();

  const { sendRealtimeEvent } = await import('../sockets/socket.js');
  sendRealtimeEvent('control-room', 'suspect:updated', { message: `Suspect updated: ${suspect.name}`, suspect });
  if (firId) {
    sendRealtimeEvent(`fir:${firId}`, 'suspect:updated', { message: `Suspect ${suspect.name} updated`, suspect });
  }

  await logAudit({
    userId: req.user._id,
    userName: req.user.name,
    userRole: req.user.role,
    action: 'UPDATE_SUSPECT',
    resourceType: 'Suspect',
    resourceId: suspect.suspectId,
    details: `Updated suspect ${suspect.name} (Status: ${suspect.status})`
  });

  return ApiResponse(res, 200, 'Suspect updated successfully', { suspect });
});
