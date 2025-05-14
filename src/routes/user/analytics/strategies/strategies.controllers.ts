import { InvestmentPlan } from '../../../../models/InvestmentPlan';
import { NextFunction, Request, Response } from 'express';
import { parse } from 'path';
import { TransactionAttempt } from '../../../../models/TransactionAttempt';
import { TokenName, TokenRepository } from '../../../../core/factories/tokens.repository';
import { StrategyFactory, StrategyName } from '../../../../core/factories/strategy.factory';
import { MockTradeService } from '../../../../core/services/mockTrade.service';
import { logger } from '../../../../utils/logger';
import { UserBalance } from '../../../../models/UserBalance';
import { getStrategiesAnalytics } from '../../../../core/services/analytics.service';

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

    // Calculate detailed analytics metrics

    const invested = parseFloat(strategy.amount.toFixed(2));

    // Get transactions using the existing getStrategyTransactions logic
    let transactions;
    let tokensHeld = 0;
    let lastTransactionPrice = 1.0;

    if (strategy.chain === 'mock') {
      const mockTradeService = new MockTradeService();
      const { transactions: mockTransactions } = await mockTradeService.getTransactions(
        strategyId,
        {
          page: 1,
          limit: 1000, // Get all transactions for accurate calculations
        }
      );
      transactions = mockTransactions;
    } else {
      // Fetch all transactions for the strategy
      const result = await TransactionAttempt.find({
        userId,
        planId: strategyId,
        status: 'completed',
      }).sort({ createdAt: -1 });
      transactions = result;
    }

    const totalInvested = parseFloat(
      transactions.reduce((total, tx) => total + tx.invested, 0).toFixed(2)
    );

    // Calculate tokens held and get last transaction price
    if (transactions && transactions.length > 0) {
      tokensHeld = transactions.reduce((total, tx) => {
        if (tx.type === 'buy' || tx.type === 'swap') {
          return total + tx.to.amount;
        } else if (tx.type === 'sell') {
          return total - tx.from.amount;
        }
        return total;
      }, 0);

      // Get the most recent transaction price
      lastTransactionPrice = transactions[0].price;
    }

    // Get current token price from CoinGecko
    let currentTokenPrice;
    try {
      currentTokenPrice = await TokenRepository.getTokenPrice(strategy.tokenSymbol);
    } catch (error) {
      logger.error(`Error fetching price for ${strategy.tokenSymbol}:`, error);
      // Fallback to 1.0 for stablecoins, otherwise use last known price from transactions
      if (strategy.tokenSymbol === 'USDT' || strategy.tokenSymbol === 'USDC') {
        currentTokenPrice = 1.0;
      } else {
        currentTokenPrice = lastTransactionPrice;
      }
    }

    // Calculate portfolio value and profit metrics
    const portfolioValue = parseFloat((tokensHeld * currentTokenPrice).toFixed(2));
    const profit = parseFloat((portfolioValue - totalInvested).toFixed(2));
    const profitPercentage = parseFloat(((profit / totalInvested) * 100).toFixed(2));
    const averageBuyPrice =
      tokensHeld > 0 ? parseFloat((totalInvested / tokensHeld).toFixed(6)) : 0;

    if (tokensHeld > 0 && strategy.amount === 0) {
      await InvestmentPlan.updateOne({ _id: strategy._id }, { $set: { amount: tokensHeld } });
    }

    const userStrategy: UserStrategy = {
      chain: strategy.chain,
      _id: strategy._id.toString(),
      currentValue: portfolioValue,
      token: {
        symbol: strategy.tokenSymbol,
        name: TokenRepository.getTokenName(strategy.tokenSymbol),
        currentPrice: currentTokenPrice,
      },
      strategyTemplate: {
        id: 'SDCA',
        ...StrategyFactory.getStrategyDetails('SDCA'),
      },
      totalInvested,
      invested,
      profit,
      profitPercentage,
      initialAmount: parseFloat(strategy.initialAmount.toFixed(2)),
      frequency: strategy.frequency,
      amount: parseFloat(strategy.amount.toFixed(2)),
      createdAt: strategy.createdAt.toISOString(),
      active: strategy.isActive,
      analytics: {
        tokensHeld,
        averageBuyPrice,
        currentTokenPrice,
        portfolioValue,
        profit,
        profitPercentage,
        totalTransactions: transactions.length,
      },
    };

    res.status(200).json({ data: userStrategy });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Internal server error', error });
  }
};

/**
 *
 * @param req
 * @param res
 * @returns
 *
 * get transactions for a strategy
 *
 * we need to get the transactions from the database
 * we need to paginate the transactions
 * we need to return the transactions
 *
 * this can accept both mock and real transactions
 *
 * if the strategy is mock, we need to get the transactions from the mock trade service
 * if the strategy is real, we need to get the transactions from the database
 *
 */
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

    const strategy = await InvestmentPlan.findById(planId).where({ userId });

    if (!strategy) {
      return res.status(404).json({ message: 'Strategy not found' });
    }

    if (strategy.chain === 'mock') {
      const mockTradeService = new MockTradeService();
      const { transactions, total } = await mockTradeService.getTransactions(planId, {
        page,
        limit,
      });

      return res.status(200).json({
        data: transactions,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      });
    }

    // Fetch transactions for the specified strategy with pagination
    const transactions = await TransactionAttempt.find({
      userId,
      planId,
      status: 'completed',
    })
      .skip(skip)
      .limit(limit);

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
    console.log(error);
    res.status(500).json({ message: 'Internal server error', error });
  }
};

export interface UserStrategy {
  _id: string;
  totalInvested: number;
  chain: string;
  token: {
    symbol: string;
    name: string;
    currentPrice: number;
  };
  strategyTemplate: {
    id: string;
    name: string;
    type: string;
    description: string;
  };
  profit: number;
  currentValue: number;
  profitPercentage: number;
  invested: number;
  initialAmount: number;
  frequency: string;
  amount: number;
  createdAt: string;
  active: boolean;
  analytics: {
    tokensHeld: number;
    averageBuyPrice: number;
    currentTokenPrice: number;
    portfolioValue: number;
    profit: number;
    profitPercentage: number;
    totalTransactions: number;
  };
}

type ActiveStrategyAnalytics = {
  id: string;
  chain: string;
  tokenSymbol: string;
  strategyType: {
    fullName: string;
    shortName: string;
  };
  profit: number;
  profitPercentage: number;
  currentValue: number;
  totalInvested: number;
};

/**
 *
 * get active strategies analytics
 *
 * this will return the active strategies with the analytics
 * @returns ActiveStrategyAnalytics[]
 */
export const getActiveStrategiesAnalytics = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ message: 'User not authenticated' });
  }

  const activeStrategies = await InvestmentPlan.find({ userId, isActive: true });

  const mockStrategies = activeStrategies.filter(strategy => strategy.chain === 'mock');
  const realStrategies = activeStrategies.filter(strategy => strategy.chain !== 'mock');

  const mockAnalytics = await Promise.all(
    mockStrategies.map(async strategy => {
      const analytics = await getStrategiesAnalytics(strategy._id.toString());

      return analytics;
    })
  );

  const realAnalytics = await Promise.all(
    realStrategies.map(async strategy => {
      const analytics = await getStrategiesAnalytics(strategy._id.toString());
      return analytics;
    })
  );

  return res.status(200).json({
    data: {
      mock: mockAnalytics,
      real: realAnalytics,
    },
  });
};

export const getActiveStrategiesSeparated = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Get all active investment plans
    const activeStrategies = await InvestmentPlan.find({ userId, isActive: true });

    // Get user balance for real trades
    const userBalance = await UserBalance.findOne({ userId });

    const analytics = await Promise.all(
      activeStrategies.map(async strategy => {
        let currentValue = 0;
        let totalProfitLoss = 0;
        let totalTokens = 0;
        let averageBuyPrice = 0;
        let currentPrice = 0;

        if (strategy.chain === 'mock') {
          // For mock trades, get the latest transaction to get accumulated investment
          const mockTradeService = new MockTradeService();
          try {
            const { transactions } = await mockTradeService.getTransactions(
              strategy._id.toString(),
              {
                page: 1,
                limit: 1,
              }
            );

            if (transactions.length > 0) {
              currentValue = transactions[0].value;
              totalProfitLoss = currentValue - strategy.initialInvestment;
            }
          } catch (error) {
            // If no transactions found, use the initial investment
            currentValue = strategy.initialInvestment;
            totalProfitLoss = 0;
          }
        } else {
          // For real trades, get current value from user balance
          const balance = userBalance?.balances.find(
            b => b.chainId === strategy.chain && b.tokenSymbol === strategy.tokenSymbol
          );

          if (balance) {
            currentValue = parseFloat(balance.balance);
            totalProfitLoss = currentValue - strategy.initialInvestment;

            // For real trades, we need to get token amounts from the blockchain
            // This would require additional blockchain queries to get historical data
            // For now, we'll use the current balance as an approximation
            const currentTokenPrice = currentValue / parseFloat(balance.balance || '1');
            totalTokens = currentValue / currentTokenPrice;
            averageBuyPrice = strategy.initialInvestment / totalTokens;
            currentPrice = currentTokenPrice;
          }
        }

        const strategyDetails = StrategyFactory.getStrategyDetails(
          strategy.strategyId as StrategyName
        );

        return {
          id: strategy._id,
          chain: strategy.chain,
          metrics: {
            totalInvested: strategy.initialInvestment,
            tokensHeld: totalTokens,
            averageBuyPrice,
            currentPrice,
            currentPortfolioValue: currentValue,
            profitLoss: totalProfitLoss,
            profitLossPercentage: (totalProfitLoss / strategy.initialInvestment) * 100,
          },
          tokenSymbol: strategy.tokenSymbol,
          strategyType: {
            fullName: strategyDetails.name,
            shortName: strategy.strategyId,
          },
        };
      })
    );

    return res.status(200).json({
      data: analytics,
    });
  } catch (error) {
    next(error);
  }
};
