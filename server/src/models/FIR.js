import mongoose from 'mongoose';
import { CRIME_TYPES, FIR_STATUS } from '../utils/constants.js';

const firSchema = new mongoose.Schema(
  {
    firNumber: {
      type: String,
      unique: true,
      required: true
    },
    complaintId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Complaint',
      required: [true, 'Complaint reference is required']
    },
    citizenId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Citizen reference is required']
    },
    policeStationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PoliceStation',
      required: [true, 'Police Station reference is required']
    },
    investigatingOfficerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Investigating officer reference is required']
    },
    crimeType: {
      type: String,
      enum: Object.values(CRIME_TYPES),
      required: [true, 'Crime type is required']
    },
    description: {
      type: String,
      required: [true, 'Description is required']
    },
    status: {
      type: String,
      enum: Object.values(FIR_STATUS),
      default: FIR_STATUS.REGISTERED
    },
    registeredAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

const FIR = mongoose.model('FIR', firSchema);
export default FIR;
