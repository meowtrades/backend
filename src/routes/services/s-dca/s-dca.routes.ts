import express from 'express';
import {
  createPlan,
  stopPlan,
  getUserPlans,
  getUserTotalInvestment,
  stopAllUserPlans,
  getUserCurrentPositions,
} from './s-dca.controllers';

const router = express.Router();

// Create a new DCA plan
router.post('/create-plan', createPlan);

// Stop a DCA plan and withdraw all invested tokens
router.post('/stop-plan/:planId', stopPlan);

// Stop all plans for a user
router.post('/stop-all-plans', stopAllUserPlans);

// Get user's DCA plans
router.get('/plans', getUserPlans);

// Get user's total investment
router.get('/total-investment', getUserTotalInvestment);

// Get user's current positions in native tokens
router.get('/current-positions', getUserCurrentPositions);

export default router;
