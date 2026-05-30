const Image = require('../models/image.model');
const Product = require('../models/product.model');
const Event = require('../models/event.model');
const ContentBlock = require('../models/contentBlock.model');
const { deleteObject } = require('../config/s3');

exports.listImages = async (req, res) => {
  try {
    const images = await Image.find().sort({ createdAt: -1 });
    const imageIds = images.map((img) => img._id);

    const [products, events, blocks] = await Promise.all([
      Product.find({ images: { $in: imageIds } }).select('name images'),
      Event.find({ images: { $in: imageIds } }).select('name images'),
      ContentBlock.find({ 'value.images': { $in: imageIds } }).select('name value'),
    ]);

    const usedInMap = {};
    for (const product of products) {
      for (const imgId of product.images) {
        const key = imgId.toString();
        if (!usedInMap[key]) usedInMap[key] = [];
        usedInMap[key].push({ type: 'product', name: product.name, id: product._id });
      }
    }
    for (const event of events) {
      for (const imgId of event.images) {
        const key = imgId.toString();
        if (!usedInMap[key]) usedInMap[key] = [];
        usedInMap[key].push({ type: 'event', name: event.name, id: event._id });
      }
    }
    for (const block of blocks) {
      for (const imgId of block.value?.images || []) {
        const key = imgId.toString();
        if (!usedInMap[key]) usedInMap[key] = [];
        usedInMap[key].push({ type: 'content', name: block.name, id: block._id });
      }
    }

    res.json(images.map((img) => ({
      _id: img._id,
      url: img.url,
      thumbnail: img.thumbnail,
      width: img.width,
      height: img.height,
      createdAt: img.createdAt,
      usedIn: usedInMap[img._id.toString()] || [],
    })));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteImageById = async (req, res) => {
  try {
    const image = await Image.findByIdAndDelete(req.params.id);
    if (!image) return res.status(404).json({ message: 'Image not found' });
    await Promise.all([deleteObject(image.url), deleteObject(image.thumbnail)]);
    res.json({ message: 'Image deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
