import mongoose from 'mongoose';
import { STATION_STATUS } from '../utils/constants.js';

const policeStationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Station name is required'],
      trim: true
    },
    stationCode: {
      type: String,
      required: [true, 'Station code is required'],
      unique: true,
      trim: true
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required']
    },
    location: {
      latitude: {
        type: Number,
        required: [true, 'Latitude is required']
      },
      longitude: {
        type: Number,
        required: [true, 'Longitude is required']
      }
    },
    stationHeadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    status: {
      type: String,
      enum: Object.values(STATION_STATUS),
      default: STATION_STATUS.ACTIVE
    }
  },
  {
    timestamps: true
  }
);

const PoliceStation = mongoose.model('PoliceStation', policeStationSchema);
export default PoliceStation;
