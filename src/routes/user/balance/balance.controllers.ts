import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import * as balanceService from '../../../core/services/balance.service';
import {
  getSupportedChains,
  getTokensForChain,
  isTokenSupportedOnChain,
  getNativeTokenForChain,
} from '../../../constants';

// Extend Request type to include user
interface AuthenticatedRequest extends Request {}

/**
 * Deposit funds to user's balance on a specific chain
 */
export const depositFunds = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const { chainId, amount, txHash, tokenSymbol } = req.body;

    if (!chainId || !amount || !txHash) {
      return res
        .status(400)
        .json({ message: 'Chain ID, amount, and transaction hash are required' });
    }

    // Validate chain ID
    if (!getSupportedChains().includes(chainId)) {
      return res.status(400).json({ message: `Chain ${chainId} is not supported` });
    }

    // If token symbol is provided, validate it
    if (tokenSymbol && !isTokenSupportedOnChain(chainId, tokenSymbol)) {
      return res
        .status(400)
        .json({ message: `Token ${tokenSymbol} is not supported on chain ${chainId}` });
    }

    // Process the deposit
    const updatedBalance = await balanceService.processDeposit(
      userId,
      chainId,
      amount,
      txHash,
      tokenSymbol
    );

    // Determine the token used (native token if not specified)
    const token = tokenSymbol ? { symbol: tokenSymbol } : getNativeTokenForChain(chainId);

    res.status(200).json({
      message: 'Deposit successful',
      data: {
        chainId,
        amount,
        txHash,
        tokenSymbol: token?.symbol,
        status: 'pending', // Should be updated when transaction is confirmed
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user's balance across all chains
 */
export const getUserBalances = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Retrieve balances from the balance service
    const balances = await balanceService.getAllBalances(userId);

    res.status(200).json({ data: balances });
  } catch (error) {
    next(error);
  }
};

/**
 * Get balance for a specific chain
 */
export const getChainBalance = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const { chainId } = req.params;

    // Validate chain ID
    if (!getSupportedChains().includes(chainId)) {
      return res.status(400).json({ message: `Chain ${chainId} is not supported` });
    }

    // Retrieve balance for specific chain
    const balance = await balanceService.getChainBalance(userId, chainId);

    res.status(200).json({ data: balance });
  } catch (error) {
    next(error);
  }
};

/**
 * Get tokens available on a specific chain
 */
export const getChainTokens = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { chainId } = req.params;

    // Validate chain ID
    if (!getSupportedChains().includes(chainId)) {
      return res.status(400).json({ message: `Chain ${chainId} is not supported` });
    }

    // Get tokens for the specified chain
    const tokens = getTokensForChain(chainId);

    res.status(200).json({ data: tokens });
  } catch (error) {
    next(error);
  }
};

/**
 * Withdraw funds from user's balance
 */
export const withdrawFunds = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const { chainId, amount, destinationAddress, tokenSymbol } = req.body;

    if (!chainId || !amount || !destinationAddress) {
      return res
        .status(400)
        .json({ message: 'Chain ID, amount, and destination address are required' });
    }

    // Validate chain ID
    if (!getSupportedChains().includes(chainId)) {
      return res.status(400).json({ message: `Chain ${chainId} is not supported` });
    }

    // If token symbol is provided, validate it
    if (tokenSymbol && !isTokenSupportedOnChain(chainId, tokenSymbol)) {
      return res
        .status(400)
        .json({ message: `Token ${tokenSymbol} is not supported on chain ${chainId}` });
    }

    // Process the withdrawal
    const withdrawalResult = await balanceService.processWithdrawal(
      userId,
      chainId,
      amount,
      destinationAddress,
      tokenSymbol
    );

    if (!withdrawalResult.success) {
      return res.status(400).json({ message: withdrawalResult.error });
    }

    // Determine the token used (native token if not specified)
    const token = tokenSymbol ? { symbol: tokenSymbol } : getNativeTokenForChain(chainId);

    res.status(200).json({
      message: 'Withdrawal initiated',
      data: {
        chainId,
        amount,
        destinationAddress,
        tokenSymbol: token?.symbol,
        status: 'pending',
        txHash: withdrawalResult.txHash,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Allocate funds from user's balance to a strategy
 */
export const allocateFundsToStrategy = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const { chainId, amount, strategyId, tokenSymbol } = req.body;

    if (!chainId || !amount || !strategyId) {
      return res.status(400).json({ message: 'Chain ID, amount, and strategy ID are required' });
    }

    // Validate chain ID
    if (!getSupportedChains().includes(chainId)) {
      return res.status(400).json({ message: `Chain ${chainId} is not supported` });
    }

    // If token symbol is provided, validate it
    if (tokenSymbol && !isTokenSupportedOnChain(chainId, tokenSymbol)) {
      return res
        .status(400)
        .json({ message: `Token ${tokenSymbol} is not supported on chain ${chainId}` });
    }

    // Process the allocation
    const allocationResult = await balanceService.allocateToStrategy(
      userId,
      chainId,
      amount,
      strategyId,
      tokenSymbol
    );

    if (!allocationResult.success) {
      return res.status(400).json({ message: allocationResult.error });
    }

    // Determine the token used (native token if not specified)
    const token = tokenSymbol ? { symbol: tokenSymbol } : getNativeTokenForChain(chainId);

    res.status(200).json({
      message: 'Funds allocated to strategy',
      data: {
        chainId,
        amount,
        strategyId,
        tokenSymbol: token?.symbol,
        status: 'active',
      },
    });
  } catch (error) {
    next(error);
  }
};
