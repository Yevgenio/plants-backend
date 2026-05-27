const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, default: "-"},
  description: { type: String, default: "-" },
  category: { type: String, default: "General" },
  rank: { type: Number, default: 0 },
  featured: { type: Number, default: 0 },
  tags: [{ type: String }],
  dimensions: [{ type: Number }],
  dimensionUnit: { type: String, default: 'cm' },
  year: { type: Number, default: 0 },
  forSale: { type: Boolean, default: false },
  specs: [{ key: { type: String }, value: { type: String } }],
  price: { type: Number, default: 0 },
  salePercent: { type: Number, default: 0 },
  images: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Image' }],
  createdAt: { type: Date, default: Date.now },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
});

// Add a text index to enable full-text search
productSchema.index({
  name: 'text',
  description: 'text',
  category: 'text',
  tags: 'text',
});

module.exports = mongoose.model('Product', productSchema);
