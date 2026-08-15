import mongoose from 'mongoose';
import { SOS_STATUS } from '../utils/constants.js';

const sosSchema = new mongoose.Schema(
  {
    sosId: {
      type: String,
      unique: true,
      required: true
    },
    citizenId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null // Can be null if triggered anonymously or guest
    },
    location: {
      latitude: {
        type: Number,
        required: [true, 'Latitude is required']
      },
      longitude: {
        type: Number,
        required: [true, 'Longitude is required']
      },
      address: {
        type: String,
        default: 'Location description unavailable'
      }
    },
    nearestStationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PoliceStation',
      default: null
    },
    assignedOfficerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    status: {
      type: String,
      enum: Object.values(SOS_STATUS),
      default: SOS_STATUS.ACTIVE
    },
    acknowledgedAt: {
      type: Date,
      default: null
    },
    dispatchedAt: {
      type: Date,
      default: null
    },
    resolvedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

const SOS = mongoose.model('SOS', sosSchema);
export default SOS;
