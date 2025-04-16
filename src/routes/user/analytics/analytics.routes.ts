import { Router } from 'express';
import * as analyticsController from './analytics.controllers';
import { getSession } from '../../../middleware/auth';

const router = Router();

router.use(getSession);

// Route to get user's historical performance data across all trades/strategies
router.get('/performance/history', analyticsController.getUserPerformanceHistory);

// Route to get historical performance data for a specific strategy
router.get('/performance/strategy/:strategyId', analyticsController.getStrategyPerformanceHistory);

// Route to get user-specific statistics (aggregated data)
router.get('/statistics/user', analyticsController.getUserStatistics);

// Route to get platform-wide statistics (available to users)
router.get('/statistics/platform', analyticsController.getPlatformStatistics);

// Get User's strategies
router.use('/strategies', analyticsController.getUserStrategies);

// Get User's active strategies
router.get('/strategies/active', analyticsController.getActiveStrategies);

export default router;
