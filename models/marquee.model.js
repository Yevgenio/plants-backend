const mongoose = require('mongoose');

const marqueeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  artist: { type: String, enum: ['elena', 'alexey', 'archive'], default: 'archive' },
  productIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
});

marqueeSchema.index({ name: 1, artist: 1 }, { unique: true });

module.exports = mongoose.model('Marquee', marqueeSchema);
