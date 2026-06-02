const Marquee = require('../models/marquee.model');
const Product = require('../models/product.model');
const { getArtist } = require('../lib/artist');

const DEFAULT_NAME = 'home';

exports.getMarqueeProductIds = async (req, res) => {
  try {
    const artist = getArtist(req) || 'alexey';
    const marquee = await Marquee.findOne({ name: DEFAULT_NAME, artist });
    if (!marquee) return res.json([]);
    res.json(marquee.productIds.map(id => id.toString()));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateMarqueeProductIds = async (req, res) => {
  try {
    if (!Array.isArray(req.body)) return res.status(400).json({ message: 'Invalid data' });
    const artist = getArtist(req) || 'alexey';
    const marquee = await Marquee.findOneAndUpdate(
      { name: DEFAULT_NAME, artist },
      { productIds: req.body, artist },
      { new: true, upsert: true }
    );
    res.json(marquee.productIds.map(id => id.toString()));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getMarqueeProducts = async (req, res) => {
  try {
    const artist = getArtist(req) || 'alexey';
    const marquee = await Marquee.findOne({ name: DEFAULT_NAME, artist });
    if (!marquee) return res.json([]);
    const ids = marquee.productIds;
    const products = await Product.find({ _id: { $in: ids } }).populate('images');
    const map = {};
    products.forEach(p => { map[p._id.toString()] = p; });
    const ordered = ids.map(id => map[id.toString()]).filter(Boolean);
    res.json(ordered);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.addProductToMarquee = async (req, res) => {
  try {
    const artist = getArtist(req) || 'alexey';
    const { id } = req.params;
    const marquee = await Marquee.findOneAndUpdate(
      { name: DEFAULT_NAME, artist },
      { $addToSet: { productIds: id }, artist },
      { new: true, upsert: true }
    );
    res.json(marquee.productIds.map(i => i.toString()));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.removeProductFromMarquee = async (req, res) => {
  try {
    const artist = getArtist(req) || 'alexey';
    const { id } = req.params;
    const marquee = await Marquee.findOneAndUpdate(
      { name: DEFAULT_NAME, artist },
      { $pull: { productIds: id } },
      { new: true }
    );
    if (!marquee) return res.status(404).json({ message: 'Marquee list not found' });
    res.json(marquee.productIds.map(i => i.toString()));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
