import { Router } from 'express';
import * as strategiesController from './strategies.controllers';
import { getSession } from '../../../../middleware/auth';
const router = Router();

// router.use(getSession);
// Get User's strategies
router.get('/', strategiesController.getUserStrategies);

router.get('/chart/:id', strategiesController.getStrategiesChart);

// Get User's active strategies
router.get('/active', strategiesController.getActiveStrategies);

router.get('/active/separated', strategiesController.getActiveStrategiesSeparated);

router.get('/active/analytics', strategiesController.getActiveStrategiesAnalytics);

// Get one strategy by ID
router.get('/:id', strategiesController.getStrategyById);

// Get strategies' transactions
router.get('/:id/transactions', strategiesController.getStrategyTransactions);
export default router;
