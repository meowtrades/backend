import { Router } from 'express';
import * as analyticsController from '../../../controllers/analytics.controller';

const router = Router();

// Route to get user's historical performance data across all trades/strategies
router.get('/performance/history', analyticsController.getUserPerformanceHistory);

// Route to get historical performance data for a specific strategy
router.get('/performance/strategy/:strategyId', analyticsController.getStrategyPerformanceHistory);

// Route to compare performance of multiple strategies
router.post('/performance/compare', analyticsController.compareStrategiesPerformance);

// Route to get user-specific statistics (aggregated data)
router.get('/statistics/user', analyticsController.getUserStatistics);

// Route to get platform-wide statistics (available to users)
router.get('/statistics/platform', analyticsController.getPlatformStatistics);

export default router; 