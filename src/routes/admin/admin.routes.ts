import express from 'express';
import { stopAllPlans, getAllActivePlans } from './admin.controllers';
import { authenticateAdmin } from '../../middleware/auth';

const router = express.Router();

// Apply admin authentication middleware to all admin routes
router.use(authenticateAdmin);

// Get all active plans
router.get('/active-plans', getAllActivePlans);

// Stop all DCA plans
router.post('/stop-all-plans', stopAllPlans);

export default router;
