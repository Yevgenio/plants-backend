const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
    timestamp: { type: Date, default: Date.now, index: true, expires: '30d' },
    method: String,
    url: String,
    ip: String,
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    status: Number,
    responseTime: String,
    userAgent: String,
    referer: String,
    contentLength: Number,
});

module.exports = mongoose.model('Log', logSchema);
