const mongoose = require('mongoose');

const bundlerTokenSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  symbol: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  imageUrl: { type: String, trim: true },
  sendingMode: { type: String, enum: ['jito', 'rpc', 'hybrid', 'bloxroute'], default: 'jito' },
  website: { type: String, trim: true },
  telegram: { type: String, trim: true },
  twitter: { type: String, trim: true },
  vanityTokenMint: { type: Boolean, default: false },
  vanityPattern: { type: String, trim: true },
  status: { type: String, enum: ['draft', 'pending', 'active', 'completed', 'failed'], default: 'draft' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  price: { type: Number, default: 0 },
  volume24h: { type: Number, default: 0 },
  liquidity: { type: Number, default: 0 },
  marketCap: { type: Number, default: 0 },
  change24h: { type: Number, default: 0 }
}, {
  timestamps: true
});

bundlerTokenSchema.index({ createdBy: 1, status: 1 });

const BundlerToken = mongoose.model('BundlerToken', bundlerTokenSchema);

module.exports = BundlerToken; 