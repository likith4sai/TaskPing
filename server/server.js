const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

// Import services
const recurringService = require('./services/recurringService');
const priorityService = require('./services/priorityService');

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/reminders', require('./routes/reminders'));
app.use('/auth', require('./routes/googleAuth'));

// Basic routes
app.get('/api', (req, res) => {
  res.json({
    message: 'TaskPing API is running! 🚀',
    version: '2.1.0',
    features: [
      'Authentication',
      'Multi-user',
      'Categories & Tags',
      'Smart Priority Inbox',
      'Automated Recurring Reminders',
      'AI-Powered Scheduling'
    ],
    endpoints: {
      'POST /api/auth/register': 'Register new user',
      'POST /api/auth/login': 'Login user',
      'GET /api/auth/me': 'Get current user (requires token)',
      'GET /api/health': 'Server health check'
    }
  });
});

// Health check route
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'TaskPing Server is running!',
    timestamp: new Date().toISOString()
  });
});

// Test route
app.get('/api/auth/test', (req, res) => {
  res.json({ message: 'Auth routes are working! 🎉' });
});

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://likithsai:likithsai007@taskping.ftrzeyw.mongodb.net/taskping?retryWrites=true&w=majority')
  .then(() => {
    console.log('✅ Connected to MongoDB');
    
    // Start background services after DB connection
    recurringService.start();
    priorityService.start();
  })
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server Error:', error);
  res.status(500).json({
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong!'
  });
});

// Handle 404
app.use('*', (req, res) => {
  res.status(404).json({ message: 'API route not found' });
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('🛑 Shutting down gracefully...');
  recurringService.stop();
  priorityService.stop();
  mongoose.connection.close();
  process.exit(0);
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 TaskPing server running on port ${PORT}`);
  console.log(`📋 Available at http://localhost:${PORT}`);
  console.log(`🔐 Auth endpoints: http://localhost:${PORT}/api/auth/`);
  console.log(`🧠 Smart features: Recurring Events + Priority Inbox`);
});
