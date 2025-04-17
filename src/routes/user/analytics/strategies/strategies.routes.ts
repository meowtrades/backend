import { Router } from 'express';
import * as strategiesController from './strategies.controllers';
import { getSession } from '../../../../middleware/auth';

const router = Router();

// router.use(getSession);
// Get User's strategies
router.get('/', strategiesController.getUserStrategies);

// Get User's active strategies
router.get('/active', strategiesController.getActiveStrategies);

// Get one strategy by ID
router.get('/:id', strategiesController.getStrategyById);

export default router;
