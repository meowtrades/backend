import { InvestmentPlan } from '../../../../models/InvestmentPlan';
import { Request, Response } from 'express';

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
    const strategy = await InvestmentPlan.findOne({ userId, _id: strategyId });

    if (!strategy) {
      return res.status(404).json({ message: 'Strategy not found' });
    }

    // Perform calculations for UserStrategy fields
    const totalInvested = strategy.initialAmount + strategy.amount;
    const invested = strategy.amount;
    const profit = totalInvested - strategy.initialAmount;

    const userStrategy: UserStrategy = {
      _id: strategy._id.toString(),
      totalInvested,
      invested,
      initialAmount: strategy.initialAmount,
      frequency: strategy.frequency,
      amount: strategy.amount,
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
  invested: number;
  initialAmount: number;
  frequency: string;
  amount: number;
  createdAt: string;
  active: boolean;
}
