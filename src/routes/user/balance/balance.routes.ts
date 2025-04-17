import { Router } from 'express';
import * as balanceController from './balance.controllers';

const router = Router();

// Get user's balance across all chains
router.get('/', balanceController.getUserBalances);

router.get('/tokens', balanceController.getAllChainTokens);

// Allocate funds to a wallet
router.post('/allocate/wallet', balanceController.allocateFundsToWallet);

// Get user's balance for a specific chain
router.get('/:chainId', balanceController.getChainBalance);

// Get available tokens for a specific chain
router.get('/:chainId/tokens', balanceController.getChainTokens);

// Get balance for a specific token on a chain
router.get('/:chainId/token/:tokenSymbol', balanceController.getTokenBalance);

// Deposit funds to user's balance
router.post('/deposit', balanceController.depositFunds);

// Withdraw funds from user's balance
router.post('/withdraw', balanceController.withdrawFunds);

// Allocate funds to a strategy
router.post('/allocate', balanceController.allocateFundsToStrategy);

// Get all chain tokens

export default router;
