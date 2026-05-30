const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
    filename: { type: String, required: true },
    url: { type: String, required: true },
    thumbnail: { type: String, required: true },
    width: Number,
    height: Number,
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Image', imageSchema);
