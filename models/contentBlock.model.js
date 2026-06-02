const mongoose = require('mongoose');

const contentBlockSchema = new mongoose.Schema({
  name: { type: String, required: true },
  artist: { type: String, enum: ['elena', 'alexey', 'archive'], default: 'archive' },
  value: { type: mongoose.Schema.Types.Mixed, required: true }
}, { timestamps: true });

contentBlockSchema.index({ name: 1, artist: 1 }, { unique: true });

module.exports = mongoose.model('ContentBlock', contentBlockSchema);
