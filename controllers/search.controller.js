const Product = require('../models/product.model');
const Event = require('../models/event.model');
const Search = require('../models/search.model');
const { artistFilter } = require('../lib/artist');

exports.globalSearch = async (req, res) => {
  const { query, limit, page } = req.query;
  const baseFilter = artistFilter(req);
  const searchQuery = { ...baseFilter };

  if (query) {
    searchQuery.$or = [
      { name: { $regex: query, $options: 'i' } },
      { description: { $regex: query, $options: 'i' } },
      { category: { $regex: query, $options: 'i' } },
      { tags: { $regex: query, $options: 'i' } },
    ];
  }

  const itemsPerPage = parseInt(limit) || 30;
  const currentPage = parseInt(page) || 1;
  const skip = (currentPage - 1) * itemsPerPage;

  try {
    const [products, events, productsCount, eventsCount] = await Promise.all([
      Product.find(searchQuery).skip(skip).limit(itemsPerPage),
      Event.find(searchQuery).skip(skip).limit(itemsPerPage),
      Product.countDocuments(searchQuery),
      Event.countDocuments(searchQuery),
    ]);

    // Total results across collections
    const totalResults = productsCount + eventsCount;

    res.json({
      products,
      events,
      pagination: {
        totalResults,
        page: currentPage,
        itemsPerPage,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
  
exports.getSearchLogHistory = async (req, res) => {
  try {
    const searches = await Search.find();
    res.json(searches);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

exports.getSearchLogById = async (req, res) => {
  try {
    const search = await Search.findById(req.params.id);
    if (!search) {
      return res.status(404).send('Search not found');
    }
    res.json(search);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


  