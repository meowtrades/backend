import { Router } from 'express';
import * as balanceController from './balance.controller';

const router = Router();

// Get user's balance across all chains
router.get('/', balanceController.getUserBalances);

// Get user's balance for a specific chain
router.get('/:chainId', balanceController.getChainBalance);

// Get available tokens for a specific chain
router.get('/:chainId/tokens', balanceController.getChainTokens);

// Deposit funds to user's balance
router.post('/deposit', balanceController.depositFunds);

// Withdraw funds from user's balance
router.post('/withdraw', balanceController.withdrawFunds);

// Allocate funds to a strategy
router.post('/allocate', balanceController.allocateFundsToStrategy);

export default router; 