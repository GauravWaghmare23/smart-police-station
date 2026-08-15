import Patrol from '../models/Patrol.js';
import PoliceOfficer from '../models/PoliceOfficer.js';
import PoliceStation from '../models/PoliceStation.js';
import ApiError from '../utils/ApiError.js';
import { generateUniqueId } from '../utils/generateId.js';
import { PATROL_STATUS, DUTY_STATUS } from '../utils/constants.js';
import { calculateHotspots } from './hotspot.service.js';
import { generatePatrolPlanAI } from './ai.service.js';
import { getRouteDirections } from './maps.service.js';
import { createNotificationRecord } from './notification.service.js';
import { sendRealtimeEvent } from '../sockets/socket.js';
import { calculateDistance } from '../utils/distance.js';

export const PATROL_RADIUS_KM = 3;

export const generatePatrolPlan = async (stationId, createdByUserId) => {
  // 1. Get Station
  const station = await PoliceStation.findById(stationId);
  if (!station) {
    throw new ApiError(404, 'Station not found');
  }
  
  // 2. Fetch available or on-duty officers belonging specifically to this station
  let officers = await PoliceOfficer.find({
    stationId,
    dutyStatus: { $in: [DUTY_STATUS.AVAILABLE, DUTY_STATUS.ON_DUTY] }
  }).populate('userId', 'name');
  
  // Fallback: if all officers busy/off-duty, fetch any officer from this station
  if (officers.length === 0) {
    officers = await PoliceOfficer.find({ stationId }).populate('userId', 'name');
  }

  if (officers.length === 0) {
    throw new ApiError(400, `No registered officers found in ${station.name} to plan patrol`);
  }
  
  // Sort officers by distance to station if location is available
  officers.sort((a, b) => {
    const locA = a.currentLocation?.latitude ? a.currentLocation : station.location;
    const locB = b.currentLocation?.latitude ? b.currentLocation : station.location;
    const distA = calculateDistance(station.location.latitude, station.location.longitude, locA.latitude, locA.longitude);
    const distB = calculateDistance(station.location.latitude, station.location.longitude, locB.latitude, locB.longitude);
    return distA - distB;
  });

  // 3. Get hotspots in this station's jurisdiction radius (e.g. 3 km)
  const hotspots = await calculateHotspots(station.location, PATROL_RADIUS_KM);
  
  // 4. Call AI Generator with station context
  const plan = await generatePatrolPlanAI(station, hotspots, officers, PATROL_RADIUS_KM);
  
  // 5. Construct waypoints list starting from Station Location
  const waypoints = [
    {
      name: station.name,
      latitude: station.location.latitude,
      longitude: station.location.longitude
    }
  ];

  plan.priorityAreas.forEach((areaName) => {
    const matched = hotspots.find(h => h.name === areaName);
    if (matched) {
      waypoints.push({
        name: matched.name,
        latitude: matched.latitude,
        longitude: matched.longitude
      });
    }
  });
  
  // Fallback sector waypoints around station if no matching hotspots found in radius
  if (waypoints.length === 1) {
    waypoints.push({
      name: `${station.name} Sector North`,
      latitude: Number((station.location.latitude + 0.005).toFixed(4)),
      longitude: Number((station.location.longitude + 0.005).toFixed(4))
    });
    waypoints.push({
      name: `${station.name} Market Area`,
      latitude: Number((station.location.latitude - 0.004).toFixed(4)),
      longitude: Number((station.location.longitude + 0.003).toFixed(4))
    });
  }
  
  // 6. Get real road route directions from Maps service
  const routeDetails = await getRouteDirections(station.location, waypoints);
  
  const patrolId = generateUniqueId('PTR');
  
  // Resolve assigned officer user IDs
  const assignedOfficerUserIds = plan.assignedOfficers.map((id) => {
    const foundOff = officers.find(o => o._id.toString() === id.toString() || o.userId?._id?.toString() === id.toString());
    return foundOff ? foundOff.userId._id : id;
  });
  
  const patrol = await Patrol.create({
    patrolId,
    stationId,
    officerIds: assignedOfficerUserIds,
    route: {
      waypoints,
      distance: routeDetails.distance,
      duration: routeDetails.duration,
      encodedPolyline: routeDetails.encodedPolyline
    },
    priority: 'HIGH',
    status: PATROL_STATUS.PLANNED,
    aiGenerated: true,
    reason: plan.reason,
    createdBy: createdByUserId
  });
  
  // 7. Notify assigned officers & mark as BUSY
  for (const officerUserId of assignedOfficerUserIds) {
    await createNotificationRecord({
      recipientId: officerUserId,
      type: 'PATROL',
      title: `Patrol Assigned: ${station.name}`,
      message: `You have been assigned to AI patrol route ${patrolId}. Reason: ${plan.reason}`,
      referenceType: 'PATROL',
      referenceId: patrol._id
    });
    
    await PoliceOfficer.updateOne(
      { userId: officerUserId },
      { $set: { dutyStatus: DUTY_STATUS.BUSY } }
    );
  }
  
  sendRealtimeEvent(`station:${stationId}`, 'notification:new', {
    message: `New AI Patrol Plan generated for ${station.name}: ${patrolId}`
  });
  
  return patrol;
};

export const updatePatrolStatus = async (id, status) => {
  const patrol = await Patrol.findById(id);
  if (!patrol) {
    throw new ApiError(404, 'Patrol not found');
  }
  
  patrol.status = status;
  await patrol.save();
  
  if (status === PATROL_STATUS.COMPLETED || status === PATROL_STATUS.CANCELLED) {
    await PoliceOfficer.updateMany(
      { userId: { $in: patrol.officerIds } },
      { $set: { dutyStatus: DUTY_STATUS.AVAILABLE } }
    );
  }
  
  return patrol;
};
