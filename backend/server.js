const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const eventRoutes = require('./routes/eventRoutes');
const ticketRoutes = require('./routes/ticketRoutes');
const { errorHandler, notFound } = require('./middleware/errorMiddleware');

// Connect to database in standalone mode
if (!process.env.VERCEL) {
  connectDB();
}

const app = express();

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// ─── Root & /api Index Routes ─────────────────────────────────────────────────
const apiIndex = (req, res) => {
  res.status(200).json({
    success: true,
    name: 'Event Booking System API',
    version: '1.0.0',
    description: 'SLIIT SE2020 - Full Stack Event Booking REST API',
    author: 'Diluka Bandara',
    github: 'https://github.com/DilukaB/event-booking-system',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
    endpoints: {
      health:  'GET  /api/health',
      auth: {
        register: 'POST /api/auth/register',
        login:    'POST /api/auth/login',
        profile:  'GET  /api/auth/me  [Protected]',
      },
      events: {
        list:   'GET    /api/events',
        get:    'GET    /api/events/:id',
        create: 'POST   /api/events  [Protected]',
        update: 'PUT    /api/events/:id  [Protected]',
        delete: 'DELETE /api/events/:id  [Protected]',
      },
      tickets: {
        book:   'POST   /api/tickets/book  [Protected]',
        mine:   'GET    /api/tickets/my-tickets  [Protected]',
        get:    'GET    /api/tickets/:id  [Protected]',
        cancel: 'PATCH  /api/tickets/:id/cancel  [Protected]',
      },
    },
  });
};

app.get('/', apiIndex);
app.get('/api', apiIndex);

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/api/health', async (req, res) => {
  const mongoose = require('mongoose');
  let dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  if (dbStatus !== 'connected') {
    try {
      await connectDB();
      dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'connecting';
    } catch (e) {
      dbStatus = `error: ${e.message}`;
    }
  }
  res.status(200).json({
    success: true,
    message: '🎉 Event Booking API is running',
    environment: process.env.NODE_ENV,
    mongoConfigured: !!process.env.MONGO_URI,
    database: dbStatus,
    timestamp: new Date().toISOString(),
  });
});

// ─── Ensure DB Connected Before Handling Requests ───────────────────────────
app.use(async (req, res, next) => {
  if (req.path === '/api/health') return next();
  try {
    await connectDB();
    next();
  } catch (err) {
    res.status(500).json({ success: false, message: 'Database connection failed', error: err.message });
  }
});

// ─── Static Files (Image uploads) ────────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/tickets', ticketRoutes);

// ─── Error Handling ───────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ─── Start Server (Only in local / standalone mode, not on Vercel) ────────────
const PORT = process.env.PORT || 5000;
if (!process.env.VERCEL) {
  const server = app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
    console.log(`📡 API URL: http://localhost:${PORT}/api`);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (err) => {
    console.error(`💥 Unhandled Rejection: ${err.message}`);
    server.close(() => process.exit(1));
  });
}

module.exports = app;
