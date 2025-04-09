import { Router } from 'express';
import * as mockTradeController from './mockTrade.controllers';

const router = Router();

// Route to create a new mock trade
router.post('/', mockTradeController.createMockTrade);

// Route to get all active mock trades for the logged-in user
router.get('/', mockTradeController.getActiveMockTrades);

// Route to get details and performance history of a specific mock trade
// Query params: ?granularity=daily|hourly|etc.
router.get('/:id', mockTradeController.getMockTradeDetails);

// Route to stop an active mock trade
router.patch('/:id/stop', mockTradeController.stopMockTrade);

export default router; 