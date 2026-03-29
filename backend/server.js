require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const connectDB = require('./config/db');

const app = express();

// Connect DB
connectDB();

// ✅ SIMPLIFIED CORS - allows both localhost and production
const allowedOrigins = [
  'http://localhost:3000',
  'https://hotel-star-view.onrender.com',
  'https://hotel-star-view-api.onrender.com',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps, curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Handle preflight requests
app.options('*', cors());

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(express.json({ limit: '10mb' }));
app.use(morgan('dev'));

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/rooms', require('./routes/rooms'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/expenses', require('./routes/expenses'));
app.use('/api/sir-payments', require('./routes/sirPayments'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/logs', require('./routes/logs'));
app.use('/api/pricing', require('./routes/pricing'));
app.use('/api/public', require('./routes/public'));

// Health check
app.get('/health', (req, res) => res.json({ status: 'OK', time: new Date() }));

// Test endpoint to check if backend is reachable
app.get('/api/test', (req, res) => res.json({ message: 'Backend is working!' }));

// ✅ SERVE FRONTEND IN PRODUCTION
if (process.env.NODE_ENV === 'production') {
  // Serve static files from the React frontend build
  app.use(express.static(path.join(__dirname, '../frontend/build')));
  
  // Handle React routing - return all requests to React app
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
  });
}

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: err.message || 'Internal Server Error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Hotel Star View Server running on port ${PORT}`));

module.exports = app;