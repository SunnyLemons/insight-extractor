import express from 'express';
import projectRoutes from './projectRoutes';
import insightRoutes from './insightRoutes';
import actionRoutes from './actionRoutes';

const router = express.Router();

// Mount project routes
router.use('/projects', projectRoutes);

// Mount insight routes
router.use('/insights', insightRoutes);

// Mount action routes
router.use('/actions', actionRoutes);

export default router; 