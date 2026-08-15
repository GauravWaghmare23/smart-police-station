import mongoose from 'mongoose';
import { OFFICER_RANKS, ROLES, DUTY_STATUS } from '../utils/constants.js';

const policeOfficerSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID reference is required'],
      unique: true
    },
    stationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PoliceStation',
      default: null
    },
    badgeNumber: {
      type: String,
      required: [true, 'Badge number is required'],
      unique: true,
      trim: true
    },
    rank: {
      type: String,
      enum: Object.values(OFFICER_RANKS),
      required: [true, 'Officer rank is required']
    },
    role: {
      type: String,
      enum: [ROLES.STATION_HEAD, ROLES.INVESTIGATING_OFFICER, ROLES.FIELD_OFFICER],
      required: [true, 'Officer application role is required']
    },
    dutyStatus: {
      type: String,
      enum: Object.values(DUTY_STATUS),
      default: DUTY_STATUS.AVAILABLE
    },
    currentLocation: {
      latitude: {
        type: Number,
        default: null
      },
      longitude: {
        type: Number,
        default: null
      }
    },
    lastLocationUpdate: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

const PoliceOfficer = mongoose.model('PoliceOfficer', policeOfficerSchema);
export default PoliceOfficer;
