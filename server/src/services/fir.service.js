import FIR from '../models/FIR.js';
import Complaint from '../models/Complaint.js';
import ApiError from '../utils/ApiError.js';
import { generateUniqueId } from '../utils/generateId.js';
import { COMPLAINT_STATUS, FIR_STATUS } from '../utils/constants.js';
import { createNotificationRecord } from './notification.service.js';
import { sendRealtimeEvent } from '../sockets/socket.js';

export const registerFIR = async (complaintId, investigatingOfficerId) => {
  const complaint = await Complaint.findById(complaintId);
  if (!complaint) {
    throw new ApiError(404, 'Complaint not found');
  }
  
  // Check if FIR already exists for this complaint
  const existingFIR = await FIR.findOne({ complaintId });
  if (existingFIR) {
    throw new ApiError(400, `An FIR has already been registered for this complaint: ${existingFIR.firNumber}`);
  }
  
  const firNumber = generateUniqueId('FIR');
  
  const fir = await FIR.create({
    firNumber,
    complaintId,
    citizenId: complaint.citizenId,
    policeStationId: complaint.policeStationId,
    investigatingOfficerId: investigatingOfficerId,
    crimeType: complaint.crimeType,
    description: complaint.description,
    status: FIR_STATUS.REGISTERED
  });
  
  // Update complaint status to FIR_REGISTERED
  complaint.status = COMPLAINT_STATUS.FIR_REGISTERED;
  await complaint.save();
  
  // Notify citizen
  await createNotificationRecord({
    recipientId: complaint.citizenId,
    type: 'FIR',
    title: 'FIR Registered',
    message: `A formal First Information Report (FIR) has been registered for your complaint. FIR Number: ${firNumber}`,
    referenceType: 'FIR',
    referenceId: fir._id
  });
  
  sendRealtimeEvent(`citizen:${complaint.citizenId}`, 'notification:new', {
    message: `FIR ${firNumber} registered for your complaint`
  });
  
  return fir;
};

export const getFIRsList = async (filter = {}) => {
  return await FIR.find(filter)
    .populate('complaintId')
    .populate('citizenId', 'name email phone')
    .populate('policeStationId', 'name stationCode')
    .populate('investigatingOfficerId', 'name email phone');
};

export const getFIRDetails = async (id) => {
  const fir = await FIR.findById(id)
    .populate('complaintId')
    .populate('citizenId', 'name email phone')
    .populate('policeStationId', 'name stationCode')
    .populate('investigatingOfficerId', 'name email phone');
    
  if (!fir) {
    throw new ApiError(404, 'FIR record not found');
  }
  return fir;
};

export const updateFIRStatus = async (firId, status) => {
  const fir = await FIR.findById(firId);
  if (!fir) {
    throw new ApiError(404, 'FIR record not found');
  }
  
  fir.status = status;
  await fir.save();
  
  // Notify citizen
  await createNotificationRecord({
    recipientId: fir.citizenId,
    type: 'FIR',
    title: 'FIR Status Updated',
    message: `FIR ${fir.firNumber} status has been updated to ${status}`,
    referenceType: 'FIR',
    referenceId: fir._id
  });
  
  return fir;
};
