import express from 'express';
import projectRoutes from './projectRoutes';
import insightRoutes from './insightRoutes';
import actionRoutes from './actionRoutes';

const router = express.Router();

// Logging middleware for routes
router.use((req, res, next) => {
  console.log('🔍 Route Request:', {
    method: req.method,
    path: req.path,
    baseUrl: req.baseUrl,
    originalUrl: req.originalUrl,
    headers: req.headers
  });
  next();
});

// Root route for debugging
router.get('/', (req, res) => {
  console.log('🌐 Root API Route Accessed');
  res.json({
    message: 'InsightExtractor API is running',
    routes: [
      '/projects',
      '/insights',
      '/actions'
    ]
  });
});

// Mount project routes
router.use('/projects', (req, res, next) => {
  console.log('🚀 Accessing Projects Route');
  next();
}, projectRoutes);

// Mount insight routes
router.use('/insights', (req, res, next) => {
  console.log('🚀 Accessing Insights Route');
  next();
}, insightRoutes);

// Mount action routes
router.use('/actions', (req, res, next) => {
  console.log('🚀 Accessing Actions Route');
  next();
}, actionRoutes);

// Catch-all route handler
router.use((req, res, next) => {
  console.error('❌ Unhandled API Route:', {
    method: req.method,
    path: req.path,
    baseUrl: req.baseUrl,
    originalUrl: req.originalUrl
  });
  
  res.status(404).json({
    error: 'API Route Not Found',
    method: req.method,
    path: req.path
  });
});

export default router; 