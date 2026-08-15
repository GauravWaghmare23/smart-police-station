import SOS from '../models/SOS.js';
import PoliceStation from '../models/PoliceStation.js';
import PoliceOfficer from '../models/PoliceOfficer.js';
import ApiError from '../utils/ApiError.js';
import { generateUniqueId } from '../utils/generateId.js';
import { calculateDistance } from '../utils/distance.js';
import { SOS_STATUS, DUTY_STATUS, ROLES } from '../utils/constants.js';
import { sendRealtimeEvent } from '../sockets/socket.js';
import { createNotificationRecord } from './notification.service.js';

export const triggerSOS = async (citizenId, locationData) => {
  const { latitude, longitude, address } = locationData;
  
  // 1. Find all active police stations and rank by geographic distance
  const stations = await PoliceStation.find({ status: 'ACTIVE' });
  let nearestStation = null;
  let minStationDistance = Infinity;
  
  stations.forEach((station) => {
    const dist = calculateDistance(
      latitude,
      longitude,
      station.location.latitude,
      station.location.longitude
    );
    if (dist < minStationDistance) {
      minStationDistance = dist;
      nearestStation = station;
    }
  });
  
  // 2. Find nearest available/on-duty officer belonging to nearest station or nearby area
  let nearestOfficer = null;
  let minOfficerDistance = Infinity;

  if (nearestStation) {
    const officers = await PoliceOfficer.find({
      stationId: nearestStation._id,
      dutyStatus: { $in: [DUTY_STATUS.AVAILABLE, DUTY_STATUS.ON_DUTY] }
    }).populate('userId', 'name email phone');

    officers.forEach((off) => {
      const loc = off.currentLocation?.latitude ? off.currentLocation : nearestStation.location;
      const dist = calculateDistance(latitude, longitude, loc.latitude, loc.longitude);
      if (dist < minOfficerDistance) {
        minOfficerDistance = dist;
        nearestOfficer = off;
      }
    });

    if (nearestOfficer) {
      nearestOfficer.dutyStatus = DUTY_STATUS.BUSY;
      await nearestOfficer.save();
    }
  }
  
  const sosId = generateUniqueId('SOS');
  
  const sos = await SOS.create({
    sosId,
    citizenId: citizenId || null,
    location: {
      latitude,
      longitude,
      address: address || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
    },
    nearestStationId: nearestStation ? nearestStation._id : null,
    assignedOfficerId: nearestOfficer ? nearestOfficer.userId._id || nearestOfficer.userId : null,
    status: SOS_STATUS.ACTIVE
  });

  // Populate references for rich response
  const populatedSOS = await SOS.findById(sos._id)
    .populate('citizenId', 'name email phone')
    .populate('nearestStationId', 'name stationCode address location phone')
    .populate('assignedOfficerId', 'name email phone');
  
  // Construct enhanced payload with distance metrics
  const sosPayload = {
    ...populatedSOS.toObject(),
    stationDistanceKm: minStationDistance !== Infinity ? Number(minStationDistance.toFixed(2)) : null,
    officerDistanceKm: minOfficerDistance !== Infinity ? Number(minOfficerDistance.toFixed(2)) : null
  };

  // 3. Emit Realtime Events to Control Room & Nearest Station
  const payload = {
    message: `🚨 EMERGENCY SOS ACTIVE: Near ${address || 'coordinates'} (${sosPayload.stationDistanceKm || 0} km from ${nearestStation?.name || 'station'})`,
    sos: sosPayload
  };
  
  sendRealtimeEvent('control-room', 'sos:new', payload);
  
  if (nearestStation) {
    sendRealtimeEvent(`station:${nearestStation._id}`, 'sos:new', payload);
  }
  
  if (nearestOfficer) {
    const officerUserId = nearestOfficer.userId._id || nearestOfficer.userId;
    sendRealtimeEvent(`officer:${officerUserId}`, 'sos:new', payload);
    
    await createNotificationRecord({
      recipientId: officerUserId,
      type: 'SOS',
      title: '🚨 EMERGENCY: SOS Dispatched',
      message: `Immediate dispatch to SOS alert at ${address || 'live location'}. Distance: ${sosPayload.officerDistanceKm || 0} km.`,
      referenceType: 'SOS',
      referenceId: sos._id
    });
  }
  
  return sosPayload;
};

export const getSOSList = async (filter = {}) => {
  const sosList = await SOS.find(filter)
    .populate('citizenId', 'name email phone')
    .populate('nearestStationId', 'name stationCode address location phone')
    .populate('assignedOfficerId', 'name email phone');

  // Enrich each record with distance calculations
  return sosList.map((sosDoc) => {
    const sos = sosDoc.toObject();
    let stationDistanceKm = null;
    let officerDistanceKm = null;

    if (sos.location && sos.nearestStationId?.location) {
      stationDistanceKm = calculateDistance(
        sos.location.latitude,
        sos.location.longitude,
        sos.nearestStationId.location.latitude,
        sos.nearestStationId.location.longitude
      );
    }

    return {
      ...sos,
      stationDistanceKm: stationDistanceKm !== null ? Number(stationDistanceKm.toFixed(2)) : null,
      officerDistanceKm
    };
  });
};

export const getSOSDetails = async (id) => {
  const sosDoc = await SOS.findById(id)
    .populate('citizenId', 'name email phone')
    .populate('nearestStationId', 'name stationCode address location phone')
    .populate('assignedOfficerId', 'name email phone');
    
  if (!sosDoc) {
    throw new ApiError(404, 'SOS details not found');
  }

  const sos = sosDoc.toObject();
  let stationDistanceKm = null;
  if (sos.location && sos.nearestStationId?.location) {
    stationDistanceKm = calculateDistance(
      sos.location.latitude,
      sos.location.longitude,
      sos.nearestStationId.location.latitude,
      sos.nearestStationId.location.longitude
    );
  }

  return {
    ...sos,
    stationDistanceKm: stationDistanceKm !== null ? Number(stationDistanceKm.toFixed(2)) : null
  };
};

export const acknowledgeSOS = async (sosId, officerUserId) => {
  const sos = await SOS.findById(sosId);
  if (!sos) {
    throw new ApiError(404, 'SOS not found');
  }
  
  sos.status = SOS_STATUS.ACKNOWLEDGED;
  sos.acknowledgedAt = new Date();
  if (!sos.assignedOfficerId && officerUserId) {
    sos.assignedOfficerId = officerUserId;
  }
  await sos.save();
  
  const updatedSOS = await getSOSDetails(sos._id);
  const payload = { message: 'SOS Acknowledged', sos: updatedSOS };
  sendRealtimeEvent('control-room', 'sos:updated', payload);
  if (sos.nearestStationId) {
    sendRealtimeEvent(`station:${sos.nearestStationId}`, 'sos:updated', payload);
  }
  
  return updatedSOS;
};

export const dispatchSOS = async (sosId, officerUserId, dispatcherUser = null) => {
  const sos = await SOS.findById(sosId);
  if (!sos) {
    throw new ApiError(404, 'SOS not found');
  }

  // Permission Checks:
  // 1. FIELD_OFFICER / INVESTIGATING_OFFICER cannot dispatch or assign themselves/others unless CONTROL_ROOM_ADMIN or STATION_HEAD
  if (dispatcherUser) {
    if (dispatcherUser.role !== ROLES.CONTROL_ROOM_ADMIN && dispatcherUser.role !== ROLES.STATION_HEAD) {
      throw new ApiError(403, 'Only Police Station Heads (Inspectors) or Control Room Admins can dispatch officers');
    }

    // 2. STATION_HEAD can only dispatch within their own station jurisdiction
    if (dispatcherUser.role === ROLES.STATION_HEAD) {
      const stationHeadOfficer = await PoliceOfficer.findOne({ userId: dispatcherUser._id });
      if (!stationHeadOfficer || !stationHeadOfficer.stationId) {
        throw new ApiError(403, 'Station Head has no assigned station');
      }
      
      // If target SOS is outside their station jurisdiction
      if (sos.nearestStationId && sos.nearestStationId.toString() !== stationHeadOfficer.stationId.toString()) {
        throw new ApiError(403, 'Station Heads can only dispatch SOS alerts within their own station jurisdiction');
      }

      // If specific officer is selected, ensure that officer belongs to the SAME station
      if (officerUserId) {
        const targetOfficer = await PoliceOfficer.findOne({ userId: officerUserId });
        if (!targetOfficer || !targetOfficer.stationId || targetOfficer.stationId.toString() !== stationHeadOfficer.stationId.toString()) {
          throw new ApiError(403, 'Station Heads can only dispatch officers from their own police station');
        }
      }
    }
  }

  // Target officer status update
  if (officerUserId) {
    const officer = await PoliceOfficer.findOne({ userId: officerUserId });
    if (officer) {
      officer.dutyStatus = DUTY_STATUS.BUSY;
      await officer.save();
    }
  }

  sos.status = SOS_STATUS.DISPATCHED;
  sos.dispatchedAt = new Date();
  if (officerUserId) {
    sos.assignedOfficerId = officerUserId;
  }
  await sos.save();

  const updatedSOS = await getSOSDetails(sos._id);
  const payload = { message: 'SOS Dispatched', sos: updatedSOS };
  sendRealtimeEvent('control-room', 'sos:updated', payload);
  if (sos.nearestStationId) {
    sendRealtimeEvent(`station:${sos.nearestStationId}`, 'sos:updated', payload);
  }
  if (officerUserId || sos.assignedOfficerId) {
    const targetId = officerUserId || sos.assignedOfficerId._id || sos.assignedOfficerId;
    sendRealtimeEvent(`officer:${targetId}`, 'sos:updated', payload);
    sendRealtimeEvent(`officer:${targetId}`, 'sos:dispatched', payload);

    await createNotificationRecord({
      recipientId: targetId,
      type: 'SOS',
      title: '🚨 EMERGENCY DISPATCH ASSIGNED',
      message: `You have been dispatched to SOS #${updatedSOS.sosId} at ${updatedSOS.location?.address || 'coordinates'}. Open map for turn-by-turn route.`,
      referenceType: 'SOS',
      referenceId: sos._id
    });
  }

  return updatedSOS;
};

export const resolveSOS = async (sosId) => {
  const sos = await SOS.findById(sosId);
  if (!sos) {
    throw new ApiError(404, 'SOS not found');
  }
  
  if (sos.assignedOfficerId) {
    const officer = await PoliceOfficer.findOne({ userId: sos.assignedOfficerId });
    if (officer) {
      officer.dutyStatus = DUTY_STATUS.AVAILABLE;
      await officer.save();
    }
  }
  
  sos.status = SOS_STATUS.RESOLVED;
  sos.resolvedAt = new Date();
  await sos.save();
  
  const updatedSOS = await getSOSDetails(sos._id);
  const payload = { message: 'SOS Resolved', sos: updatedSOS };
  sendRealtimeEvent('control-room', 'sos:updated', payload);
  if (sos.nearestStationId) {
    sendRealtimeEvent(`station:${sos.nearestStationId}`, 'sos:updated', payload);
  }
  
  return updatedSOS;
};

export const escalateSOS = async (sosId) => {
  const sos = await SOS.findById(sosId);
  if (!sos) {
    throw new ApiError(404, 'SOS not found');
  }
  
  sos.status = SOS_STATUS.ESCALATED;
  await sos.save();
  
  const otherStations = await PoliceStation.find({
    status: 'ACTIVE',
    _id: { $ne: sos.nearestStationId }
  });
  
  const updatedSOS = await getSOSDetails(sos._id);
  const payload = {
    message: `CRITICAL ALERT: SOS ID ${sos.sosId} has been ESCALATED!`,
    sos: updatedSOS
  };
  
  sendRealtimeEvent('control-room', 'sos:updated', payload);
  otherStations.forEach((station) => {
    sendRealtimeEvent(`station:${station._id}`, 'sos:updated', payload);
  });
  
  return updatedSOS;
};
