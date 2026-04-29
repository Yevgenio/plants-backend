const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const cookieParser = require('cookie-parser');

dotenv.config();

const app = express();

app.use(cors({
  origin: ['http://localhost:3000', 'https://boukingolts.art'],
  credentials: true,
}));

// Parse cookies
app.use(cookieParser());

// app.use(express.json());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Apply logging middleware
app.set('trust proxy', true); // Trust AWS proxy to get real IP address

//const { verifyToken } = require('./middleware/auth.middleware');
// app.use(verifyToken); // Ensure the user is authenticated first

const logRequest = require('./middleware/log.middleware');
app.use(logRequest); 

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.log(err));

// Root Route
app.get('/api', (req, res) => {
  res.send('System API active!');
});

// Log Routes
const logRoutes = require('./routes/log.routes');
app.use('/api/logs', logRoutes);

// Authentication Routes
const authRoutes = require('./routes/auth.routes');
app.use('/api/auth', authRoutes);

// User Routes
const userRoutes = require('./routes/user.routes');
app.use('/api/user', userRoutes);

// Event Routes
const eventRoutes = require('./routes/event.routes');
app.use('/api/events', eventRoutes);

// Product Routes
const productRoutes = require('./routes/product.routes');
app.use('/api/products', productRoutes);

// // Memo Routes
// const memoRoutes = require('./routes/memo.routes');
// app.use('/api/memos', memoRoutes);

// Content Routes
const contentRoutes = require('./routes/content.routes');
app.use('/api/content', contentRoutes);

// Search Routes
const searchRoutes = require('./routes/search.routes');
app.use('/api/search', searchRoutes);

// Image file Routes
const fileRoutes = require('./routes/file.routes');
app.use('/api/uploads', fileRoutes);

// Image Management Routes
const imageRoutes = require('./routes/image.routes');
app.use('/api/images', imageRoutes);

const passport = require('passport');
require('./config/google.strategy'); // Load the Google strategy
app.use(passport.initialize());

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
