import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import * as balanceService from '../../../core/services/balance.service';
import {
  getSupportedChains,
  getTokensForChain,
  isTokenSupportedOnChain,
  getNativeTokenForChain,
} from '../../../constants';
import { getUserBalanceRecord } from '../../../core/services/balance.service';
import { UserBalance } from '../../../models/UserBalance';
import { User } from '../../../models/User';

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

    // Retrieve all balances for the specific chain
    const balances = await balanceService.getChainBalances(userId, chainId);

    res.status(200).json({ data: balances });
  } catch (error) {
    next(error);
  }
};

/**
 * Get balance for a specific token on a chain
 */
export const getTokenBalance = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const { chainId, tokenSymbol } = req.params;

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

    // Retrieve balance for specific token on the chain
    const balance = await balanceService.getTokenBalance(userId, chainId, tokenSymbol);

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

export const getAllChainTokens = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tokens = await balanceService.getAllChainTokens();
    res.status(200).json({ data: tokens });
  } catch (error) {
    next(error);
  }
};

const adminEmails = ['kunalranarj2005@gmail.com'];

export const allocateFundsToWallet = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Check if the user is an admin
    const userEmail = req.user?.email;

    if (!userEmail || !adminEmails.includes(userEmail)) {
      return res.status(403).json({ message: 'Access denied. Admins only.' });
    }

    const { email, amount, tokenSymbol } = req.body;

    if (!email || !amount || !tokenSymbol) {
      return res.status(400).json({ message: 'Email, amount, and token symbol are required' });
    }

    // Default chainId to Injective
    const chainId = 'injective';

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Fetch and update user balance record in one operation
    const userBalance = await UserBalance.findOneAndUpdate(
      { userId: user._id },
      { $inc: { 'balances.$[elem].balance': amount } },
      {
        new: true,
        arrayFilters: [
          {
            'elem.chainId': chainId,
            'elem.tokenSymbol': tokenSymbol,
          },
        ],
      }
    );

    if (!userBalance) {
      return res.status(404).json({ message: 'User or balance record not found' });
    }

    // Find the updated token balance
    const tokenBalance = userBalance.balances.find(
      balance => balance.chainId === chainId && balance.tokenSymbol === tokenSymbol
    );

    res.status(200).json({
      message: 'Funds allocated successfully',
      data: {
        email,
        chainId,
        tokenSymbol,
        newBalance: tokenBalance?.balance,
      },
    });
  } catch (error) {
    next(error);
  }
};
