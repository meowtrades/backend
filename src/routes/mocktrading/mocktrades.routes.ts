import { Router } from 'express';
import * as mockTradeController from './mockTrade.controllers';
import { getSession } from '../../middleware/auth';

const router = Router();

router.get('/batches/file/:id/content', mockTradeController.getBatchFileContent);
router.get('/batches', mockTradeController.listBatches);
router.get('/chart/:id', mockTradeController.getMockChart);
router.get('/batches/:id/cancel', mockTradeController.cancelBatch);

router.use(getSession);

// Route to create a new mock trade
router.post('/', mockTradeController.createMockTrade);

// Route to get all active mock trades for the logged-in user
router.get('/', mockTradeController.getActiveMockTrades);

// Route to get details and performance history of a specific mock trade
router.get('/:id', mockTradeController.getMockTradeDetails);

// Route to stop an active mock trade
router.patch('/:id/stop', mockTradeController.stopMockTrade);

// Route to get chart data for a specific mock trade

export default router;
