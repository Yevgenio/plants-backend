const express = require('express');
const router = express.Router();
const { verifyToken, verifyAdmin } = require('../middleware/auth.middleware');
const controller = require('../controllers/image.controller');

router.get('/', verifyToken, verifyAdmin, controller.listImages);
router.delete('/id/:id', verifyToken, verifyAdmin, controller.deleteImageById);

module.exports = router;
