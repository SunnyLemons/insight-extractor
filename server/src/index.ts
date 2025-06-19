import express from 'express';
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
  : ['http://localhost:3011'];

app.use(cors({
  origin: (origin, callback) => {
    // If no origin (like server-to-server calls), allow
    if (!origin) return callback(null, true);
    
    // Check if the origin is in the allowed list
    if (CORS_ORIGIN.indexOf(origin) !== -1 || CORS_ORIGIN.includes('*')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
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

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

export default app; 