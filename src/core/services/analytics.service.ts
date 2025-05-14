import { InvestmentPlan } from '../../models/InvestmentPlan';
import { TransactionAttempt } from '../../models/TransactionAttempt';
import { UserStrategy } from '../../routes/user/analytics/strategies/strategies.controllers';
import { logger } from '../../utils/logger';
import { StrategyFactory } from '../factories/strategy.factory';
import { TokenRepository } from '../factories/tokens.repository';
import { MockTradeService } from './mockTrade.service';

export const getStrategiesAnalytics = async (planId: string) => {
  try {
    // Fetch the strategy by userId and strategyId
    const strategy = await InvestmentPlan.findById(planId);

    if (!strategy) {
      throw new Error('Strategy not found');
    }

    // Calculate detailed analytics metrics

    const invested = parseFloat(strategy.amount.toFixed(2));

    // Get transactions using the existing getStrategyTransactions logic
    let transactions;
    let tokensHeld = 0;
    let lastTransactionPrice = 1.0;

    if (strategy.chain === 'mock') {
      const mockTradeService = new MockTradeService();
      const { transactions: mockTransactions } = await mockTradeService.getTransactions(planId, {
        page: 1,
        limit: 1000, // Get all transactions for accurate calculations
      });
      transactions = mockTransactions;
    } else {
      // Fetch all transactions for the strategy
      const result = await TransactionAttempt.find({
        userId: strategy.userId,
        planId,
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

    return userStrategy;
  } catch (error) {
    console.log(error);
    throw new Error('Internal server error');
  }
};
