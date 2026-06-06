const express = require('express');
const router = express.Router();
const { verifyToken, verifyAdmin } = require('../middleware/auth.middleware');
const searchController = require('../controllers/search.controller');

// GET global search
router.get('/', searchController.globalSearch);

// GET search log by ID
router.get('/log/id/:id', searchController.getSearchLogById);

// GET search log history
router.get('/log', searchController.getSearchLogHistory);

module.exports = router;
