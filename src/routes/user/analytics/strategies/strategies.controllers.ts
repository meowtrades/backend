import { logger } from 'ethers';
import { InvestmentPlan } from '../../../../models/InvestmentPlan';
import { Request, Response } from 'express';
import { parse } from 'path';

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
    const profit = parseFloat((totalInvested - strategy.initialAmount).toFixed(2));
    const profitPercentage = parseFloat(((profit / strategy.initialAmount) * 100).toFixed(2));
    const currentValue = parseFloat((strategy.totalInvested + strategy.amount).toFixed(2));

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
