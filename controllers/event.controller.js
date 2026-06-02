const Event = require('../models/event.model');
const Image = require('../models/image.model');
const { eventViews } = require('../lib/metrics');
const { artistFilter } = require('../lib/artist');

const parseTags = (tags) => {
  if (!tags) return [];
  if (Array.isArray(tags)) return tags;
  return tags.split(',').map((t) => t.trim()).filter((t) => t.length);
};

exports.getDistinctCategories = async (req, res) => {
  try {
    const categories = await Event.distinct("category", artistFilter(req));
    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAllEvents = async (req, res) => {
  try {
    const events = await Event.find(artistFilter(req)).populate('images');
    res.json(events);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate('images');
    if (!event) return res.status(404).send('Event not found');
    eventViews.inc({ event_id: event._id.toString(), event_name: event.name });
    res.json(event);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.searchEvents = async (req, res) => {
  try {
    const { query, category, sort, limit, page } = req.query;

    const searchQuery = { ...artistFilter(req) };

    if (query) {
      searchQuery.$or = [
        { name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { category: { $regex: query, $options: 'i' } },
        { location: { $regex: query, $options: 'i' } },
        { tags: { $regex: query, $options: 'i' } },
      ];
    }

    if (category === '') {
      searchQuery.category = { $in: [null, ''] };
    } else if (category) {
      searchQuery.category = category;
    }

    const sortOptions = {};
    if (sort === 'recent') sortOptions.createdAt = -1;

    const itemsPerPage = parseInt(limit) || 10;
    const currentPage = parseInt(page) || 1;
    const skip = (currentPage - 1) * itemsPerPage;

    const events = await Event.find(searchQuery)
      .populate('images')
      .sort(sortOptions)
      .skip(skip)
      .limit(itemsPerPage);

    const totalCount = await Event.countDocuments(searchQuery);

    res.json({
      data: events,
      pagination: { total: totalCount, page: currentPage, itemsPerPage },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.addNewEvent = async (req, res) => {
  const event = new Event({
    name: req.body.name,
    description: req.body.description,
    category: req.body.category,
    tags: parseTags(req.body.tags),
    images: req.processedImages || [],
    location: req.body.location || '',
    date: req.body.date ? new Date(req.body.date) : new Date(),
    artist: req.body.artist || 'archive',
    createdBy: req.user._id,
  });

  try {
    const newEvent = await event.save();
    await newEvent.populate('images');
    res.status(201).json(newEvent);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.updateEventById = async (req, res) => {
  try {
    const existingEvent = await Event.findById(req.params.id);
    if (!existingEvent) return res.status(404).json({ message: 'Event not found' });

    const updateData = {
      name: req.body.name || existingEvent.name,
      description: req.body.description || existingEvent.description,
      category: req.body.category || existingEvent.category,
      tags: req.body.tags !== undefined ? parseTags(req.body.tags) : existingEvent.tags,
      images: req.processedImages || existingEvent.images,
      location: req.body.location || existingEvent.location,
      date: req.body.date ? new Date(req.body.date) : existingEvent.date,
      artist: req.body.artist || existingEvent.artist,
    };

    const updatedEvent = await Event.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('images');

    res.json(updatedEvent);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteEventById = async (req, res) => {
  try {
    const deletedEvent = await Event.findByIdAndDelete(req.params.id);
    if (!deletedEvent) return res.status(404).json({ message: 'Event not found' });
    await Image.deleteMany({ _id: { $in: deletedEvent.images } });
    res.json({ message: 'Event deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
