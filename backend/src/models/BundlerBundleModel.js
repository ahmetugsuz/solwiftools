const mongoose = require('mongoose');

const bundlerBundleSchema = new mongoose.Schema({
  token: { type: mongoose.Schema.Types.ObjectId, ref: 'BundlerToken', required: true },
  wallets: [{ type: mongoose.Schema.Types.ObjectId, ref: 'BundlerWallet' }],
  status: { type: String, enum: ['pending', 'executed', 'failed'], default: 'pending' },
  transactionHash: { type: String, trim: true },
  buyAmountSol: { type: Number, min: 0 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  error: { type: String, trim: true },
  executedAt: { type: Date }
}, {
  timestamps: true
});

const BundlerBundle = mongoose.model('BundlerBundle', bundlerBundleSchema);

module.exports = BundlerBundle; 