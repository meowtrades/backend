import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { InvestmentPlan } from '../../../models/InvestmentPlan';
import { UserBalance } from '../../../models/UserBalance';
import { StrategyFactory } from '../../../core/factories/strategy.factory';
import { MockTradeService } from '../../../core/services/mockTrade.service';
import { TransactionAttempt } from '../../../models/TransactionAttempt';

// Extend Request type to include user (assuming auth middleware adds it)
interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    name: string;
    email: string;
    emailVerified: boolean;
    createdAt: Date;
    updatedAt: Date;
    image?: string | null;
  };
}

/**
 * Get historical performance data for user's trades
 */
export const getUserPerformanceHistory = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  req.user;
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const { timeframe = '30d', granularity = 'daily' } = req.query;

    // TODO: Implement data retrieval from service layer
    // const performanceData = await analyticsService.getUserPerformanceHistory(userId, timeframe, granularity);

    // Mock response for now
    const mockData = {
      timeframe,
      granularity,
      dataPoints: [],
    };

    res.status(200).json({ data: mockData });
  } catch (error) {
    next(error);
  }
};

/**
 * Get historical performance data for a specific strategy (mock trading or live)
 */
export const getStrategyPerformanceHistory = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const strategyId = req.params.strategyId;
    const { timeframe = '30d', granularity = 'daily', tokenSymbol } = req.query;

    // TODO: Implement data retrieval from service layer
    // const performanceData = await analyticsService.getStrategyPerformance(
    //   strategyId,
    //   { timeframe, granularity, tokenSymbol, userId }
    // );

    // Mock response for now
    const mockData = {
      strategyId,
      timeframe,
      granularity,
      tokenSymbol,
      dataPoints: [],
    };

    res.status(200).json({ data: mockData });
  } catch (error) {
    next(error);
  }
};

/**
 * Compare performance of different strategies
 */
export const compareStrategiesPerformance = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const { strategyIds, timeframe = '30d', tokenSymbol, initialInvestment = 100 } = req.body;

    if (!strategyIds || !Array.isArray(strategyIds) || strategyIds.length === 0) {
      return res
        .status(400)
        .json({ message: 'Please provide at least one strategy ID to compare' });
    }

    // TODO: Implement data retrieval from service layer
    // const comparisonData = await analyticsService.compareStrategies(
    //   strategyIds,
    //   { timeframe, tokenSymbol, initialInvestment, userId }
    // );

    // Mock response for now
    const mockData = {
      strategies: strategyIds.map(id => ({
        strategyId: id,
        name: `Strategy ${id}`,
        performance: [],
      })),
      timeframe,
      tokenSymbol,
    };

    res.status(200).json({ data: mockData });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user-specific analytics and statistics
 */
export const getUserStatistics = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Get all investment plans for this user
    const investmentPlans = await InvestmentPlan.find({ userId });

    const mockTrades = investmentPlans.filter(plan => plan.chain === 'mock');
    const actualTrades = investmentPlans.filter(plan => plan.chain !== 'mock');

    const userBalance = await UserBalance.findOne({ userId });

    const totalInvestment = actualTrades.reduce((sum, plan) => sum + plan.totalInvested, 0);

    // userBalance?.balances.forEach(balance => {
    //   const plan = investmentPlans.find(plan => plan.chain === balance.chainId);
    //   if (plan) {
    //     const currentValue = balance.amount * plan.currentPrice; // Assuming currentPrice is available
    //     plan.currentValue = currentValue; // Update the plan with current value
    //   }
    // });

    const activePlans = actualTrades.filter(plan => plan.isActive).length;

    // Calculate mock trade statistics
    const activeMockTrades = mockTrades.filter(plan => plan.isActive).length;
    const completedMockTrades = mockTrades.filter(plan => !plan.isActive).length;
    // Calculate total current value (from UserBalance if available)
    const totalCurrentValue = actualTrades
      ? actualTrades.reduce((sum, plan) => sum + plan.amount + plan.totalInvested, 0)
      : totalInvestment; // Fallback to total investment if no balance data

    // Calculate profit/loss
    const totalProfitLoss = totalCurrentValue - totalInvestment;
    const profitLossPercentage =
      totalInvestment > 0 ? (totalProfitLoss / totalInvestment) * 100 : 0;

    // Compile stats
    const userStats = {
      totalInvestment,
      totalCurrentValue,
      totalProfitLoss,
      activeStrategies: {
        mock: mockTrades.length,
        real: actualTrades.length,
      },
      profitLossPercentage,
      bestPerformingStrategy: null, // Would need historical data to calculate
      worstPerformingStrategy: null, // Would need historical data to calculate
      activeTrades: activePlans + activeMockTrades,
      completedTrades: completedMockTrades,
      mostTradedToken: null,
      activePlans,
      activeInvestmentAmount: investmentPlans
        .filter(plan => plan.isActive)
        .reduce((sum, plan) => sum + plan.amount, 0),
    };

    res.status(200).json({ data: userStats });
  } catch (error) {
    next(error);
  }
};

/**
 * Get platform-wide statistics that are accessible to regular users
 */
export const getPlatformStatistics = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // TODO: Implement data retrieval from service layer
    // const platformStats = await analyticsService.getPlatformStatistics();

    // Mock response for now
    const mockStats = {
      topPerformingStrategies: [
        // Array of top strategies with performance data
      ],
      popularTokens: [
        // Array of most traded tokens
      ],
      averageReturns: {
        daily: 0,
        weekly: 0,
        monthly: 0,
      },
      totalTrades: 0,
      activeTrades: 0,
    };

    res.status(200).json({ data: mockStats });
  } catch (error) {
    next(error);
  }
};

export const getUserOverview = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    let totalPortfolioValue = 0;
    let totalInvested = 0;
    let totalProfitLoss = 0;

    // Get all active investment plans for this user
    const activePlans = await InvestmentPlan.find({
      userId,
      isActive: true,
    });

    const mockTrades = activePlans.filter(plan => plan.chain === 'mock');
    const realTrades = activePlans.filter(plan => plan.chain !== 'mock');

    for (const plan of realTrades) {
      const transactions = await TransactionAttempt.find({
        planId: plan._id,
        status: 'completed',
      });

      const totalInvestedAmount = transactions.reduce(
        (sum, transaction) => sum + transaction.invested,
        0
      );

      const totalValue = transactions.reduce((sum, transaction) => sum + transaction.value, 0);

      const profitLoss = totalValue - totalInvestedAmount;

      totalPortfolioValue += totalValue;
      totalInvested += totalInvestedAmount;
      totalProfitLoss += profitLoss;
    }

    // Calculate overall profit/loss percentage
    const profitLossPercentage = totalInvested > 0 ? (totalProfitLoss / totalInvested) * 100 : 0;

    // Compile the overview data
    const overview = {
      totalPortfolioValue: parseFloat(totalPortfolioValue.toFixed(2)),
      totalInvested: parseFloat(totalInvested.toFixed(2)),
      totalProfitLoss: parseFloat(totalProfitLoss.toFixed(2)),
      profitLossPercentage: parseFloat(profitLossPercentage.toFixed(2)),
      activeStrategies: {
        total: activePlans.length,
        mock: mockTrades.length,
        real: activePlans.length - mockTrades.length,
      },
    };

    res.status(200).json({ data: overview });
  } catch (error) {
    next(error);
  }
};
