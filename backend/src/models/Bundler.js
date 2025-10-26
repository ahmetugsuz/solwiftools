// src/models/Bundler.js
const mongoose = require('mongoose');

const BundlerSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  isPremium: { type: Boolean, default: false },
  lifetimeAccess: { type: Boolean, default: false },
  volumeBoosted: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Bundler', BundlerSchema);
