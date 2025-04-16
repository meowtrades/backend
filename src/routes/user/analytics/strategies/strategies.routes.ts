import { Router } from 'express';
import * as strategiesController from './strategies.controllers';

const router = Router();

// Get User's strategies
router.use('/', strategiesController.getUserStrategies);

// Get User's active strategies
router.get('/active', strategiesController.getActiveStrategies);

// Get one strategy by ID
router.get('/:strategyId', strategiesController.getStrategyById);

export default router;
