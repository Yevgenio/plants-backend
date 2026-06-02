const ContentBlock = require('../models/contentBlock.model');
const { getArtist, combinedFilter } = require('../lib/artist');

const populateImages = { path: 'value.images', model: 'Image' };

exports.getContentByName = async (req, res) => {
  try {
    const artist = getArtist(req);
    // For combined/apex view, fall back to 'alexey' for content (each site has its own)
    const artistForContent = artist || 'alexey';
    const block = await ContentBlock
      .findOne({ name: req.params.name, artist: artistForContent })
      .populate(populateImages);
    if (!block) return res.status(404).json({ message: 'Not found' });
    res.json(block.value);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.setContentByName = async (req, res) => {
  try {
    const artist = getArtist(req) || 'alexey';
    const value = { ...req.body };
    if (Array.isArray(req.processedImages)) value.images = req.processedImages;

    const updated = await ContentBlock.findOneAndUpdate(
      { name: req.params.name, artist },
      { value, artist },
      { upsert: true, new: true }
    ).populate(populateImages);

    res.json(updated.value);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getAllContent = async (req, res) => {
  try {
    const artist = getArtist(req) || 'alexey';
    const blocks = await ContentBlock.find({ artist }).populate(populateImages);
    res.json(blocks.map((b) => ({ name: b.name, value: b.value })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
