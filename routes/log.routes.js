const express = require('express');
const router = express.Router();
const Log = require('../models/log.model');

router.get('/', async (req, res) => {
    try {
        const logs = await Log.find().sort({ timestamp: -1 }).limit(500);
        res.json(logs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.get('/by-ip/:ip', async (req, res) => {
    try {
        const logs = await Log.find({ ip: req.params.ip }).sort({ timestamp: -1 }).limit(500);
        res.json(logs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
