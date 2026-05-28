const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const { verifyToken , verifyAdmin } = require('../middleware/auth.middleware');
const productController = require('../controllers/product.controller');
const { upload , processUploadedImages , manageImages  } = require('../middleware/file.middleware');
const marqueeController = require('../controllers/marquee.controller');

// GET all products
router.get('/', productController.getAllProducts);

// GET products ordered by rank
router.get('/ranked', productController.getProductsByRank);

// GET featured products
router.get('/featured', productController.getFeaturedProducts);

// GET product by ID
router.get('/id/:id', productController.getProductById); 
 
// GET products by query
router.get('/search', productController.searchProducts);

// GET distinct categories
router.get('/categories', productController.getDistinctCategories);

// GET distinct series
router.get('/series', productController.getDistinctSeries);

// POST new product
router.post(
    '/', 
    verifyToken, // Verify user token
    verifyAdmin, // Verify admin access
    upload, // Upload images
    processUploadedImages, // Process uploaded images
    manageImages,
    productController.addNewProduct // Add new product
);

// PUT update product by ID
router.put(
    '/id/:id',
    verifyToken, // Verify user token
    verifyAdmin, // Verify admin access
    upload, // Upload images
    processUploadedImages, // Process uploaded images
    manageImages,
    productController.updateProductById // Update product by ID
  );

// DELETE product by ID
router.delete(
    '/id/:id',
    verifyToken,
    verifyAdmin,
    productController.deleteProductById
  ); 

  // Marquee routes
router.get('/marquee', marqueeController.getMarqueeProducts);
router.get('/marquee/ids', marqueeController.getMarqueeProductIds);
router.put(
  '/marquee/ids',
  verifyToken,
  verifyAdmin,
  marqueeController.updateMarqueeProductIds
);
router.post(
  '/marquee/:id',
  verifyToken,
  verifyAdmin,
  marqueeController.addProductToMarquee
);
router.delete(
  '/marquee/:id',
  verifyToken,
  verifyAdmin,
  marqueeController.removeProductFromMarquee
);
  
module.exports = router;
