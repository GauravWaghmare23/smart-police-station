import User from '../models/User.js';
import PoliceOfficer from '../models/PoliceOfficer.js';
import PoliceStation from '../models/PoliceStation.js';
import ApiError from '../utils/ApiError.js';
import { USER_STATUS } from '../utils/constants.js';

export const createOfficerProfile = async (officerData) => {
  const { name, email, phone, password, stationId, badgeNumber, rank, role } = officerData;
  
  // 1. Validate station
  if (stationId) {
    const station = await PoliceStation.findById(stationId);
    if (!station) {
      throw new ApiError(404, 'Police station not found');
    }
  }
  
  // Check if user exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(400, 'User with this email already exists');
  }
  
  // Check if badge exists
  const existingBadge = await PoliceOfficer.findOne({ badgeNumber });
  if (existingBadge) {
    throw new ApiError(400, 'Badge number already assigned');
  }
  
  // 2. Create User
  const user = await User.create({
    name,
    email,
    phone,
    password,
    role, // STATION_HEAD, INVESTIGATING_OFFICER, FIELD_OFFICER
    status: USER_STATUS.ACTIVE
  });
  
  // 3. Create Police Officer details
  const officer = await PoliceOfficer.create({
    userId: user._id,
    stationId: stationId || null,
    badgeNumber,
    rank,
    role
  });
  
  const userObj = user.toObject();
  delete userObj.password;
  
  return {
    user: userObj,
    officerDetails: officer
  };
};

export const getOfficersList = async (filter = {}) => {
  return await PoliceOfficer.find(filter)
    .populate({
      path: 'userId',
      select: 'name email phone status avatar'
    })
    .populate('stationId', 'name stationCode');
};

export const getOfficerDetails = async (officerId) => {
  const officer = await PoliceOfficer.findById(officerId)
    .populate({
      path: 'userId',
      select: 'name email phone status avatar'
    })
    .populate('stationId', 'name stationCode');
  
  if (!officer) {
    throw new ApiError(404, 'Officer profile not found');
  }
  return officer;
};

export const transferOfficer = async (officerId, destinationStationId) => {
  const officer = await PoliceOfficer.findById(officerId);
  if (!officer) {
    throw new ApiError(404, 'Officer not found');
  }
  
  const station = await PoliceStation.findById(destinationStationId);
  if (!station) {
    throw new ApiError(404, 'Destination police station not found');
  }
  
  officer.stationId = destinationStationId;
  await officer.save();
  return officer;
};

export const updateOfficerLocation = async (officerUserId, latitude, longitude) => {
  const officer = await PoliceOfficer.findOne({ userId: officerUserId });
  if (!officer) {
    throw new ApiError(404, 'Officer profile not found');
  }
  
  officer.currentLocation = { latitude, longitude };
  officer.lastLocationUpdate = new Date();
  await officer.save();
  
  return officer;
};

export const updateOfficerStatus = async (officerUserId, dutyStatus) => {
  const officer = await PoliceOfficer.findOne({ userId: officerUserId });
  if (!officer) {
    throw new ApiError(404, 'Officer profile not found');
  }
  
  officer.dutyStatus = dutyStatus;
  await officer.save();
  return officer;
};
