const mongoose = require('mongoose');

const bundlerWalletSchema = new mongoose.Schema({
  publicKey: { type: String, required: true, unique: true, trim: true },
  balance: { type: Number, default: 0 },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  label: { type: String, trim: true },
  isSelected: { type: Boolean, default: false },
  lastUsed: { type: Date }
}, {
  timestamps: true
});

const BundlerWallet = mongoose.model('BundlerWallet', bundlerWalletSchema);

module.exports = BundlerWallet; 