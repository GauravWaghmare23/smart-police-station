import mongoose from 'mongoose';

const suspectSchema = new mongoose.Schema(
  {
    suspectId: {
      type: String,
      required: true,
      unique: true
    },
    name: {
      type: String,
      required: [true, 'Suspect name is required'],
      trim: true
    },
    alias: {
      type: String,
      trim: true,
      default: ''
    },
    gender: {
      type: String,
      enum: ['MALE', 'FEMALE', 'OTHER', 'UNKNOWN'],
      default: 'UNKNOWN'
    },
    age: {
      type: Number,
      default: null
    },
    phone: {
      type: String,
      default: ''
    },
    idProof: {
      type: String, // Aadhaar/PAN/VoterID if known
      default: ''
    },
    address: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      enum: ['SUSPECT', 'ACCUSED', 'CONVICTED', 'DISCHARGED'],
      default: 'SUSPECT',
      required: true
    },
    linkedComplaintIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Complaint'
      }
    ],
    linkedFirIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FIR'
      }
    ],
    charges: [
      {
        section: String,
        act: String, // e.g. BNS / IPC / IT Act
        description: String
      }
    ],
    arrestStatus: {
      isArrested: { type: Boolean, default: false },
      arrestDate: { type: Date, default: null },
      arrestingOfficerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      custodyLocation: { type: String, default: '' }
    },
    courtOutcome: {
      status: { type: String, enum: ['PENDING_TRIAL', 'BAIL', 'CONVICTED', 'ACQUITTED', 'DISCHARGED', 'NOT_SUBMITTED'], default: 'NOT_SUBMITTED' },
      caseNumber: String,
      courtName: String,
      verdictDate: Date,
      notes: String
    },
    createdOfficerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    stationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PoliceStation',
      default: null
    }
  },
  {
    timestamps: true
  }
);

const Suspect = mongoose.model('Suspect', suspectSchema);
export default Suspect;
