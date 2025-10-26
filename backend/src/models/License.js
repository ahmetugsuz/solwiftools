const mongoose = require('mongoose');

const licenseSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  licenseId: {
    type: String,
    required: true,
    unique: true
  },
  type: {
    type: String,
    enum: ['RENTAL', 'LIFETIME'],
    required: true
  },
  startDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  expiryDate: {
    type: Date,
    // Only required for RENTAL licenses
    required: function() { return this.type === 'RENTAL'; }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  walletAddress: {
    type: String,
    required: true
  },
  transactionHash: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: false
  }
});

// Add method to check if license is valid
licenseSchema.methods.isValid = function() {
  if (!this.isActive) return false;
  if (this.type === 'LIFETIME') return true;
  if (new Date() < this.expiryDate) {
    return true;
  } else {
    // If expired, set isActive to false and save
    this.isActive = false;
    this.save().catch(() => {}); // Save in background, ignore errors
    return false;
  }
};

module.exports = mongoose.model('License', licenseSchema); 