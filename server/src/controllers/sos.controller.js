import * as sosService from '../services/sos.service.js';
import { ApiResponse } from '../utils/response.js';
import asyncHandler from '../utils/asyncHandler.js';

export const triggerSOS = asyncHandler(async (req, res) => {
  // If authenticated, pass citizen ID, otherwise null (anonymous/guest)
  const citizenId = req.user ? req.user._id : null;
  const sos = await sosService.triggerSOS(citizenId, req.body);
  return ApiResponse(res, 201, 'SOS Alert triggered successfully', { sos });
});

export const getSOS = asyncHandler(async (req, res) => {
  const filter = {};
  
  if (req.user && req.user.role === 'CITIZEN') {
    filter.citizenId = req.user._id;
  } else if (req.user && req.user.role === 'STATION_HEAD') {
    const PoliceOfficer = await import('../models/PoliceOfficer.js');
    const officer = await PoliceOfficer.default.findOne({ userId: req.user._id });
    if (officer && officer.stationId) {
      filter.nearestStationId = officer.stationId;
    } else {
      filter.nearestStationId = null;
    }
  } else if (req.user && req.user.role === 'FIELD_OFFICER') {
    filter.assignedOfficerId = req.user._id;
  }
  
  const sosList = await sosService.getSOSList(filter);
  return ApiResponse(res, 200, 'SOS alerts retrieved successfully', { sosList });
});

export const getSOSById = asyncHandler(async (req, res) => {
  const sos = await sosService.getSOSDetails(req.params.id);
  return ApiResponse(res, 200, 'SOS alert retrieved successfully', { sos });
});

export const acknowledge = asyncHandler(async (req, res) => {
  // Acknowledge SOS
  const sos = await sosService.acknowledgeSOS(req.params.id, req.user._id);
  return ApiResponse(res, 200, 'SOS alert acknowledged successfully', { sos });
});

export const dispatch = asyncHandler(async (req, res) => {
  const { officerUserId } = req.body;
  const sos = await sosService.dispatchSOS(req.params.id, officerUserId, req.user);
  return ApiResponse(res, 200, 'Officer dispatched to SOS successfully', { sos });
});

export const resolve = asyncHandler(async (req, res) => {
  const sos = await sosService.resolveSOS(req.params.id);
  return ApiResponse(res, 200, 'SOS alert resolved successfully', { sos });
});

export const escalate = asyncHandler(async (req, res) => {
  const sos = await sosService.escalateSOS(req.params.id);
  return ApiResponse(res, 200, 'SOS alert escalated successfully', { sos });
});
