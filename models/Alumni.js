import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

const alumniSchema = new Schema({
  firstName: { type: String, required: false },
  lastName: { type: String, required: false },
  matNo: {type: String },
  password: { type: String, required: true },
  graduationYear: { type: Date, required: false },
  degree: { type: String, required: false },
  department: { type: String, required: false },
  currentPosition: { type: String },
  company: { type: String },
  location: { type: String },
  email: { type: String, unique: false },
  image: { type: String },  // URL or path to stored image
  imageFeatures: {
    type: [Number], // Array of numbers for feature vector
    default: []
  },
  imageHash: {
    type: String, // Perceptual hash for quick comparison
    default: ''
  },
  imageMetadata: {
    dominantColors: [String],
    imageType: String,
    size: Number,
    dimensions: {
      width: Number,
      height: Number
    }
  },
  socialMedia: {
    linkedIn: String,
    facebook: String,
    x: String
  },
  achievements: [String], 
  dateRegistered: {
    type: Date,
    default: Date.now
  },
  verified: {
    type: Boolean,
    default: false
  },
  verificationDate: {
    type: Date,
    default: null
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    default: null
  },
}, { timestamps: true });

alumniSchema.index({
  firstName: 'text',
  lastName: 'text',
  department: 'text',
  location: 'text'
});

// Hash password before saving
alumniSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Method to compare passwords
alumniSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const alumni = mongoose.model('Alumni', alumniSchema);
export default alumni;

//module.exports = mongoose.model('Alumni', alumniSchema);
