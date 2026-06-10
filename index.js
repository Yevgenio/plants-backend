const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const { CORS_ORIGINS } = require('./config/env');
const path = require('path');
const cookieParser = require('cookie-parser');

dotenv.config({ path: '/vault/secrets/mongo-config', override: true });
dotenv.config();

const app = express();

app.use(cors({
  origin: CORS_ORIGINS,
  credentials: true,
}));

// Parse cookies
app.use(cookieParser());

// app.use(express.json());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Apply logging middleware
app.set('trust proxy', true); // Trust AWS proxy to get real IP address

const { register } = require('./lib/metrics');
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

//const { verifyToken } = require('./middleware/auth.middleware');
// app.use(verifyToken); // Ensure the user is authenticated first

// const logRequest = require('./middleware/log.middleware');
// app.use(logRequest); // suspended — see MongoDB Logging Analysis & Decision.md

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.log(err));

// Root Route
app.get('/api', async (req, res) => {
  const uptimeSec = Math.floor(process.uptime());
  const h = Math.floor(uptimeSec / 3600);
  const m = Math.floor((uptimeSec % 3600) / 60);
  const s = uptimeSec % 60;

  const stateMap = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
  const dbState = stateMap[mongoose.connection.readyState] || 'unknown';

  let dbPing = null;
  let pingMs = null;
  if (mongoose.connection.readyState === 1) {
    try {
      const t = Date.now();
      await mongoose.connection.db.admin().ping();
      pingMs = Date.now() - t;
      dbPing = 'ok';
    } catch {
      dbPing = 'failed';
    }
  }

  const mem = process.memoryUsage();
  const mb = (b) => Math.round(b / 1024 / 1024);

  res.json({
    status: 'ok',
    uptime: `${h}h ${m}m ${s}s`,
    environment: process.env.NODE_ENV || 'development',
    node: process.version,
    database: { state: dbState, ping: dbPing, ping_ms: pingMs },
    memory: { heap_used_mb: mb(mem.heapUsed), heap_total_mb: mb(mem.heapTotal), rss_mb: mb(mem.rss) },
  });
});

// Kubernetes health probe — not logged
app.get('/healthz', (req, res) => {
  res.sendStatus(200);
});

// Log Routes
const logRoutes = require('./routes/log.routes');
app.use('/logs', logRoutes);

// Authentication Routes
const authRoutes = require('./routes/auth.routes');
app.use('/auth', authRoutes);

// User Routes
const userRoutes = require('./routes/user.routes');
app.use('/user', userRoutes);

// Event Routes
const eventRoutes = require('./routes/event.routes');
app.use('/events', eventRoutes);

// Product Routes
const productRoutes = require('./routes/product.routes');
app.use('/products', productRoutes);

// Content Routes
const contentRoutes = require('./routes/content.routes');
app.use('/content', contentRoutes);

// Search Routes
const searchRoutes = require('./routes/search.routes');
app.use('/search', searchRoutes);

// Image Management Routes
const imageRoutes = require('./routes/image.routes');
app.use('/images', imageRoutes);

// Admin Routes (staging-only endpoints like clone-from-prod)
const adminRoutes = require('./routes/admin.routes');
app.use('/admin', adminRoutes);

const passport = require('passport');
require('./config/google.strategy'); // Load the Google strategy
app.use(passport.initialize());

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
