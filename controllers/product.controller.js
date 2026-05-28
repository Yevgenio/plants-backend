const Product = require('../models/product.model');
const Image = require('../models/image.model');

// Helper to normalize tags/dimensions input (string or array)
const parseTags = (tags) => {
  if (!tags) return [];
  if (Array.isArray(tags)) return tags;
  return tags.split(',').map((t) => t.trim()).filter((t) => t.length);
};

const parseDimensions = (dims) => {
  if (!dims) return [];
  const arr = Array.isArray(dims) ? dims : dims.split(',').map(d => d.trim()).filter(Boolean);
  return arr.map(Number).filter(n => !isNaN(n) && n > 0);
};

const parseSpecs = (specs) => {
  if (!specs) return [];
  if (Array.isArray(specs)) return specs;
  try { return JSON.parse(specs); } catch { return []; }
};

const parseBool = (val, fallback = false) => {
  if (val === undefined || val === null) return fallback;
  return val === true || val === 'true';
};

exports.getDistinctCategories = async (req, res) => {
  try {
    const categories = await Product.distinct("category");
    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getDistinctSeries = async (req, res) => {
  try {
    const series = (await Product.distinct("series")).filter(s => s && s.trim());
    res.json(series);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAllProducts = async (req, res) => {
  try {
    const products = await Product.find().populate('images');
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getProductsByRank = async (req, res) => {
  try {
    const products = await Product.find()
      .populate('images')
      .sort({ rank: -1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getFeaturedProducts = async (req, res) => {
  try {
    const products = await Product.find({ featured: { $ne: 0 } })
      .populate('images')
      .sort({ featured: -1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// Get a product by ID
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('images');
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get all products with optional search, filter, and sort
exports.searchProducts = async (req, res) => {
  try {
    const { query, category, series, forSale, exclude, sort, limit, page } = req.query;

    // Build query object
    const searchQuery = {};
    if (query) {
      searchQuery.$or = [
        { name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { category: { $regex: query, $options: 'i' } },
        { tags: { $regex: query, $options: 'i' } },
      ];
    }

    if (category === '') {
      searchQuery.category = { $in: [null, ''] };
    } else if (category) {
      searchQuery.category = category;
    }

    if (series) searchQuery.series = series;
    if (forSale === 'true') searchQuery.forSale = true;

    if (exclude) {
      const excludeIds = exclude.split(',').filter(Boolean);
      if (excludeIds.length) searchQuery._id = { $nin: excludeIds };
    }

    const sortOptions = {};
    if (sort === 'recent') {
      sortOptions.createdAt = -1;
    }

    const itemsPerPage = parseInt(limit) || 100;
    const currentPage = parseInt(page) || 1;
    const skip = (currentPage - 1) * itemsPerPage;

    const products = await Product.find(searchQuery)
      .populate('images')
      .sort(sortOptions)
      .skip(skip)
      .limit(itemsPerPage);

    const totalCount = await Product.countDocuments(searchQuery);

    res.json({
      data: products,
      pagination: {
        total: totalCount,
        page: currentPage,
        itemsPerPage,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.addNewProduct = async (req, res) => {
  try {
  const product = new Product({
    name: req.body.name,
    description: req.body.description,
    category: req.body.category,
    rank: req.body.rank ?? 0,
    featured: req.body.featured ?? 0,
    tags: parseTags(req.body.tags),
    series: req.body.series || '',
    dimensions: parseDimensions(req.body.dimensions),
    dimensionUnit: req.body.dimensionUnit || 'cm',
    year: req.body.year || 0,
    forSale: parseBool(req.body.forSale),
    specs: parseSpecs(req.body.specs),
    price: req.body.price ?? 0,
    salePercent: req.body.salePercent ?? 0,
    stock: req.body.stock ?? 1,
    images: req.processedImages || [],
    createdBy: req.user._id,
  });

    const newProduct = await product.save();
    await newProduct.populate('images');
    res.status(201).json(newProduct);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};


exports.updateProductById = async (req, res) => {
  try {
    const product = req.currentProduct || await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const updateData = {
      name: req.body.name || product.name,
      description: req.body.description || product.description,
      category: req.body.category || product.category,
      rank: req.body.rank ?? product.rank,
      featured: req.body.featured ?? product.featured,
      tags: req.body.tags !== undefined ? parseTags(req.body.tags) : product.tags,
      series: req.body.series !== undefined ? req.body.series : product.series,
      dimensions: req.body.dimensions !== undefined ? parseDimensions(req.body.dimensions) : product.dimensions,
      dimensionUnit: req.body.dimensionUnit || product.dimensionUnit || 'cm',
      year: req.body.year || product.year,
      forSale: req.body.forSale !== undefined ? parseBool(req.body.forSale) : product.forSale,
      specs: req.body.specs !== undefined ? parseSpecs(req.body.specs) : product.specs,
      price: req.body.price ?? product.price,
      salePercent: req.body.salePercent ?? product.salePercent,
      stock: req.body.stock ?? product.stock,
      startsAt: req.body.startsAt || product.startsAt,
      endsAt: req.body.endsAt || product.endsAt,
      images: req.processedImages || product.images,
    };

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('images');

    res.json(updatedProduct);
  } catch (err) {
    console.error('Update failed:', err);
    res.status(400).json({ message: err.message });
  }
};

// Delete a product by ID
exports.deleteProductById = async (req, res) => {
  try {
    const deletedProduct = await Product.findByIdAndDelete(req.params.id);
    if (!deletedProduct) return res.status(404).json({ message: 'Product not found' });
    await Image.deleteMany({ _id: { $in: deletedProduct.images } });
    res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};