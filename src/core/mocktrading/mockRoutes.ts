import { Router } from 'express';
import { startMockPlan, getMockPlan, getUserMockPlans } from '../../routes/mocktrading/mocktrading.controller';

const router = Router();

// Start a new mock plan
router.post('/start', startMockPlan);

// Get a specific mock plan
router.get('/:planId', getMockPlan);

// Get all mock plans for a user
router.get('/user/:userId', getUserMockPlans);

export default router; 