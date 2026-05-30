const multer = require('multer');
const path = require('path');
const sharp = require('sharp');
const Image = require('../models/image.model');
const { putObject, deleteObject } = require('../config/s3');

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const allowed = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    if (file.mimetype.startsWith('image/') && allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only supported image formats are allowed'));
    }
  },
  limits: { fileSize: 50 * 1024 * 1024 },
}).fields([{ name: 'images', maxCount: 30 }]);

const processUploadedImages = async (req, res, next) => {
  if (!req.files?.images) return next();

  try {
    req.processedImages = await Promise.all(
      req.files.images.map(async (file) => {
        const ext = path.extname(file.originalname);
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const shortName = path.basename(file.originalname, ext).slice(0, 10).replace(/\s+/g, '-');
        const base = `${uniqueSuffix}-${shortName}${ext}`;
        const thumbnailFilename = `${base.slice(0, -ext.length)}-th${ext}`;

        const { data: thumbBuffer, info } = await sharp(file.buffer)
          .resize({ width: 400 })
          .toBuffer({ resolveWithObject: true });

        await Promise.all([
          putObject(base, file.buffer, file.mimetype),
          putObject(thumbnailFilename, thumbBuffer, file.mimetype),
        ]);

        return {
          filename: file.originalname,
          url: base,
          thumbnail: thumbnailFilename,
          width: info.width,
          height: info.height,
        };
      })
    );

    next();
  } catch (err) {
    console.error('Image processing failed:', err.message);
    return res.status(500).json({ message: 'Image processing failed', error: err.message });
  }
};

const manageImages = async (req, res, next) => {
  try {
    let newDocs = [];
    if (Array.isArray(req.processedImages) && req.processedImages.length) {
      newDocs = await Image.insertMany(req.processedImages);
    }

    const filenameMap = {};
    (req.files?.images || []).forEach((file, idx) => {
      if (newDocs[idx]) filenameMap[file.originalname] = newDocs[idx]._id.toString();
    });

    let sorted = [];
    if (req.body.sortedImages) {
      try { sorted = JSON.parse(req.body.sortedImages); } catch (_) {}
    }

    const finalIds = [];
    sorted.forEach((img) => {
      if (img.new) {
        const id = filenameMap[img.filename];
        if (id) finalIds.push(id);
      } else if (img.id) {
        finalIds.push(img.id);
      }
    });

    const unusedDocs = newDocs.filter((d) => !finalIds.includes(d._id.toString()));
    if (unusedDocs.length) {
      await Image.deleteMany({ _id: { $in: unusedDocs.map((d) => d._id) } });
      await Promise.all(unusedDocs.flatMap((d) => [deleteObject(d.url), deleteObject(d.thumbnail)]));
    }

    req.processedImages = finalIds;
    next();
  } catch (err) {
    console.error('manageImages failed:', err.message);
    res.status(500).json({ message: 'Image update failed', error: err.message });
  }
};

module.exports = { upload, processUploadedImages, manageImages };
