import { logger } from 'ethers';
import { InvestmentPlan } from '../../../../models/InvestmentPlan';
import { Request, Response } from 'express';
import { parse } from 'path';
import { TransactionAttempt } from '../../../../models/TransactionAttempt';

interface AuthenticatedRequest extends Request {}

export const getUserStrategies = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Fetch user's strategies from the database
    const userStrategies = await InvestmentPlan.find({ userId });

    res.status(200).json({ data: userStrategies });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
};

export const getActiveStrategies = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Fetch user's strategies from the database
    const userStrategies = await InvestmentPlan.find({ userId, isActive: true });

    res.status(200).json({ data: userStrategies });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
};

export const getStrategyById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const strategyId = req.params.id;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    if (!strategyId) {
      return res.status(400).json({ message: 'Strategy ID is required' });
    }

    // Fetch the strategy by userId and strategyId
    const strategy = await InvestmentPlan.findById(strategyId).where({ userId });

    if (!strategy) {
      return res.status(404).json({ message: 'Strategy not found' });
    }

    // Perform calculations for UserStrategy fields
    const totalInvested = parseFloat((strategy.initialAmount + strategy.amount).toFixed(2));
    const invested = parseFloat(strategy.amount.toFixed(2));
    const currentValue = parseFloat((strategy.totalInvested + strategy.amount).toFixed(2));
    const profit = parseFloat((currentValue - totalInvested).toFixed(2));
    const profitPercentage = parseFloat(((profit / strategy.initialAmount) * 100).toFixed(2));

    const userStrategy: UserStrategy = {
      _id: strategy._id.toString(),
      currentValue,
      totalInvested,
      invested,
      profit,
      profitPercentage,
      initialAmount: parseFloat(strategy.initialAmount.toFixed(2)),
      frequency: strategy.frequency,
      amount: parseFloat(strategy.amount.toFixed(2)),
      createdAt: strategy.createdAt.toISOString(),
      active: strategy.isActive,
    };

    res.status(200).json({ data: userStrategy });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
};

export const getStrategyTransactions = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const planId = req.params.id;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    if (!planId) {
      return res.status(400).json({ message: 'Strategy Id is required' });
    }

    // Extract pagination parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    // Fetch transactions for the specified strategy with pagination
    const transactions = await TransactionAttempt.find({ userId, planId }).skip(skip).limit(limit);

    const totalTransactions = await TransactionAttempt.countDocuments({ userId, planId });

    if (!transactions || transactions.length === 0) {
      return res.status(404).json({ message: 'No transactions found for this strategy' });
    }

    res.status(200).json({
      data: transactions,
      pagination: {
        total: totalTransactions,
        page,
        limit,
        totalPages: Math.ceil(totalTransactions / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
};

interface UserStrategy {
  _id: string;
  totalInvested: number;
  profit: number;
  currentValue: number;
  profitPercentage: number;
  invested: number;
  initialAmount: number;
  frequency: string;
  amount: number;
  createdAt: string;
  active: boolean;
}
