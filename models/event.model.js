const mongoose = require('mongoose');

//event alternative can be exhibition, sale, showcase, 
const eventSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  category: String,
  tags: [{ type: String }], // Array of tags for full-text search
  images: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Image' }],
  date: { type: Date, required: true }, // Date of the event
  location: String,
  artist: { type: String, enum: ['elena', 'alexey', 'archive'], default: 'archive' },
  createdAt: { type: Date, default: Date.now },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
});

// Add a text index to enable full-text search
eventSchema.index({
  name: 'text',
  description: 'text',
  category: 'text',
  tags: 'text',
  location: 'text'
});

module.exports = mongoose.model('Event', eventSchema);