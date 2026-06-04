const express = require('express');
const mongoose = require('mongoose');
const { verifyToken, verifyAdmin } = require('../middleware/auth.middleware');

const router = express.Router();

const CLONEABLE_COLLECTIONS = ['products', 'events', 'contentblocks', 'marquees', 'images', 'users'];

router.post('/clone-from-prod', verifyToken, verifyAdmin, async (req, res) => {
  if (!process.env.MONGO_PROD_URI) {
    return res.status(400).json({ message: 'MONGO_PROD_URI not set — this endpoint is staging-only' });
  }

  let prodConn;
  try {
    prodConn = await mongoose.createConnection(process.env.MONGO_PROD_URI).asPromise();
    const stagingDb = mongoose.connection.db;
    const results = {};

    for (const col of CLONEABLE_COLLECTIONS) {
      const docs = await prodConn.db.collection(col).find({}).toArray();
      await stagingDb.collection(col).deleteMany({});
      if (docs.length > 0) {
        await stagingDb.collection(col).insertMany(docs);
      }
      results[col] = docs.length;
    }

    return res.json({ cloned: results });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  } finally {
    if (prodConn) await prodConn.close();
  }
});

module.exports = router;
