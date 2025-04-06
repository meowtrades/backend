import express from 'express';
import { stopAllPlans } from './admin.controller';
import { authenticateAdmin } from '../../middleware/auth';

const router = express.Router();

// Apply admin authentication middleware to all admin routes
router.use(authenticateAdmin);

// Stop all DCA plans
router.post('/stop-all-plans', stopAllPlans);

export default router; 