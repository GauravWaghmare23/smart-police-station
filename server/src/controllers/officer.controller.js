import * as officerService from '../services/officer.service.js';
import { ApiResponse } from '../utils/response.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { sendRealtimeEvent } from '../sockets/socket.js';

export const createOfficer = asyncHandler(async (req, res) => {
  const result = await officerService.createOfficerProfile(req.body);
  return ApiResponse(res, 201, 'Police officer created successfully', result);
});

export const getOfficers = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.stationId) filter.stationId = req.query.stationId;
  if (req.query.role) filter.role = req.query.role;
  if (req.query.dutyStatus) filter.dutyStatus = req.query.dutyStatus;
  
  const officers = await officerService.getOfficersList(filter);
  return ApiResponse(res, 200, 'Officers retrieved successfully', { officers });
});

export const getOfficerById = asyncHandler(async (req, res) => {
  const officer = await officerService.getOfficerDetails(req.params.id);
  return ApiResponse(res, 200, 'Officer profile retrieved successfully', { officer });
});

export const updateOfficer = asyncHandler(async (req, res) => {
  // Can modify rank, role, status
  const officer = await officerService.getOfficerDetails(req.params.id);
  const user = officer.userId;
  
  if (req.body.name) user.name = req.body.name;
  if (req.body.phone) user.phone = req.body.phone;
  if (req.body.status) user.status = req.body.status;
  await user.save();
  
  if (req.body.rank) officer.rank = req.body.rank;
  if (req.body.role) officer.role = req.body.role;
  if (req.body.dutyStatus) officer.dutyStatus = req.body.dutyStatus;
  await officer.save();
  
  return ApiResponse(res, 200, 'Officer profile updated successfully', { officer });
});

export const transferOfficer = asyncHandler(async (req, res) => {
  const { stationId } = req.body;
  if (!stationId) {
    throw new ApiError(400, 'stationId is required for transfer');
  }
  const officer = await officerService.transferOfficer(req.params.id, stationId);
  return ApiResponse(res, 200, 'Officer transferred successfully', { officer });
});

export const updateStatus = asyncHandler(async (req, res) => {
  const { dutyStatus } = req.body;
  if (!dutyStatus) {
    throw new ApiError(400, 'dutyStatus is required');
  }
  
  // Use officer userId to lookup and update
  const officerUserId = req.params.id; // Either profile ID or User ID. Let's lookup via userId
  const officer = await officerService.updateOfficerStatus(officerUserId, dutyStatus);
  return ApiResponse(res, 200, 'Officer duty status updated successfully', { officer });
});

export const updateLocation = asyncHandler(async (req, res) => {
  const { latitude, longitude } = req.body;
  if (latitude === undefined || longitude === undefined) {
    throw new ApiError(400, 'latitude and longitude are required');
  }
  
  const officerUserId = req.params.id;
  const officer = await officerService.updateOfficerLocation(officerUserId, latitude, longitude);
  
  // Emit realtime location
  sendRealtimeEvent('control-room', 'officer:location', {
    officerId: officer._id,
    userId: officerUserId,
    currentLocation: { latitude, longitude },
    lastLocationUpdate: officer.lastLocationUpdate
  });
  if (officer.stationId) {
    sendRealtimeEvent(`station:${officer.stationId}`, 'officer:location', {
      officerId: officer._id,
      userId: officerUserId,
      currentLocation: { latitude, longitude },
      lastLocationUpdate: officer.lastLocationUpdate
    });
  }
  
  return ApiResponse(res, 200, 'Officer location updated successfully', { officer });
});
