import serverless from 'serverless-http';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import routes from './routes';
import dotenv from 'dotenv';

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

// Preflight request handler
app.options('*', cors());

app.use(cors({
  origin: (origin, callback) => {
    // If no origin (like server-to-server calls), allow
    if (!origin) return callback(null, true);
    
    // Check if the origin is in the allowed list or is a wildcard
    if (CORS_ORIGIN.includes('*') || CORS_ORIGIN.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
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
  ]
}));

app.use(express.json());

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/InsightExtractor';

// Connect to MongoDB
mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((error) => console.error('MongoDB connection error:', error));

// Routes
app.use('/api', routes);

// Wrap the Express app with serverless-http
export const handler = serverless(app, {
  binary: ['*/*'] // Handle all content types
}); 