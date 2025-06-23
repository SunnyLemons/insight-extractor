import express, { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import routes from './routes';

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// Middleware
const CORS_ORIGIN = process.env.CORS_ORIGIN 
  ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
  : [
    'http://localhost:3000', 
    'http://localhost:3011', 
    'https://insight-extractor.netlify.app',
    'https://insight-extractor-api.onrender.com'
  ];

console.log('🌐 Allowed CORS Origins:', CORS_ORIGIN);

// Preflight request handler
app.options('*', cors()); // Enable preflight requests for all routes

app.use((req, res, next) => {
  console.log('🔍 Incoming Request:', {
    method: req.method,
    path: req.path,
    headers: req.headers,
    origin: req.get('origin'),
    referrer: req.get('referrer')
  });
  next();
});

app.use(cors({
  origin: (origin, callback) => {
    console.log('🔍 Incoming Origin:', origin);
    
    // If no origin (like server-to-server calls), allow
    if (!origin) return callback(null, true);
    
    // Check if the origin is in the allowed list or is a wildcard
    if (CORS_ORIGIN.includes('*') || CORS_ORIGIN.indexOf(origin) !== -1) {
      console.log('✅ Origin Allowed:', origin);
      callback(null, true);
    } else {
      console.warn('❌ Origin Not Allowed:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With', 
    'Accept', 
    'Origin'
  ],
  exposedHeaders: ['Content-Length', 'X-Foo', 'X-Bar'],
  maxAge: 600 // Cache preflight requests for 10 minutes
}));
app.use(express.json());

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/InsightExtractor';
const PORT = process.env.PORT || 5011;

// Connect to MongoDB with more detailed logging
mongoose.set('debug', true); // Enable Mongoose debug mode
mongoose.connect(MONGODB_URI, {
  // Additional connection options for better reliability
  serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds
  socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
})
  .then(() => {
    console.log('✅ Connected to MongoDB successfully');
    console.log('📍 Connection URI:', MONGODB_URI.replace(/:[^:]*@/, ':****@')); // Mask password
  })
  .catch((error) => {
    console.error('❌ MongoDB connection error:', error);
    console.error('🔍 Connection details:', {
      uri: MONGODB_URI.replace(/:[^:]*@/, ':****@'),
      error: error.message
    });
    process.exit(1);
  });

// Routes
app.use('/api', routes);

// Debugging route to verify route mounting
app.get('/api', (req, res) => {
  console.log('🔍 Direct /api Route Accessed');
  res.json({
    message: 'InsightExtractor API Root',
    routes: [
      '/api/projects',
      '/api/insights',
      '/api/actions'
    ]
  });
});

// Add a catch-all route for debugging
app.use((req, res, next) => {
  console.error('🚨 Unhandled Route:', {
    method: req.method,
    path: req.path,
    headers: req.headers,
    body: req.body
  });
  
  res.status(404).json({
    error: 'Route Not Found',
    method: req.method,
    path: req.path
  });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📍 Base URL: http://localhost:${PORT}`);
  console.log(`🔗 Full API Routes:`);
  console.log('  - /api/projects');
  console.log('  - /api/insights');
  console.log('  - /api/actions');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received. Shutting down gracefully');
  server.close(() => {
    console.log('💤 Server closed');
    process.exit(0);
  });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Add a catch-all error handler
const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  console.error('🚨 Unhandled Error:', {
    message: err.message,
    stack: err.stack,
    method: req.method,
    path: req.path,
    headers: req.headers
  });
  
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message
  });
};

app.use(errorHandler);

export default app; 