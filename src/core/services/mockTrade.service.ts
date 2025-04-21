import { MockTrade, IMockTrade } from '../../models/mockTrade.model';
import { logger } from '../../utils/logger';
import { PluginFactory } from '../strategies/s-dca/chains/factory';
import { DCAService } from '../strategies/s-dca/index';
import { User } from '../../models/User';
import { RiskLevel, Frequency } from '../types';
import { CreateMockTradeInput } from '../mocktrade/service';
import { DataFetcher } from '../mocktrade/mock.fetcher';
import { CoinGeckoDataProvider } from '../mocktrade/data-providers/coingecko.provider';
import { PythProvider, PythProviderInterval } from '../mocktrade/data-providers/pyth.provider';
import { Interval } from '../mocktrade/data-providers/provider.interface';

export class MockTradeService {
  private dcaService: DCAService;

  constructor() {
    this.dcaService = new DCAService();
    // Make sure mock plugin is initialized
    try {
      // Test if the plugin is accessible
      PluginFactory.getPlugin('mock');
    } catch (error) {
      // If not, initialize plugins
      PluginFactory.initializePlugins();
    }
  }

  /**
   * Create a new mock trade for a user
   */
  async createMockTrade(userId: string, data: CreateMockTradeInput): Promise<IMockTrade> {
    try {
      logger.info(`Creating mock trade for user ${userId}`, data);

      // Validate user exists
      const user = await User.findOne({ _id: userId });
      if (!user) {
        throw new Error('User not found');
      }

      // Create a new mock trade
      const mockTrade = new MockTrade({
        userId,
        strategyId: data.strategyId,
        tokenSymbol: data.tokenSymbol.toUpperCase(),
        initialAmount: data.amount,
        amount: data.amount, // Default to the same amount
        riskLevel: data.riskLevel || RiskLevel.MEDIUM_RISK, // Default to medium risk
        frequency: data.frequency || Frequency.DAILY, // Default to daily frequency
        status: 'active',
      });

      await mockTrade.save();
      logger.info(`Created mock trade ${mockTrade._id} for user ${userId}`);

      // Set up a test DCA plan using the mock plugin
      await this.dcaService.createPlan(userId, {
        amount: data.amount,
        frequency: Frequency.TEST_MINUTE, // Use a test frequency for quick feedback
        userWalletAddress: userId, // Use userId as wallet address for mock purposes
        riskLevel: RiskLevel.MEDIUM_RISK, // Default to medium risk
        chain: 'mock', // Use our mock plugin
      });

      return mockTrade;
    } catch (error) {
      logger.error(`Error creating mock trade:`, error);
      throw error;
    }
  }

  /**
   * Get all active mock trades for a user
   */
  async getActiveMockTrades(userId: string): Promise<IMockTrade[]> {
    try {
      return await MockTrade.find({ userId, status: 'active' });
    } catch (error) {
      logger.error(`Error fetching active mock trades:`, error);
      throw error;
    }
  }

  /**
   * Get details of a specific mock trade
   */
  async getMockTradeDetails(tradeId: string, userId: string): Promise<IMockTrade | null> {
    try {
      return await MockTrade.findOne({ _id: tradeId, userId });
    } catch (error) {
      logger.error(`Error fetching mock trade details:`, error);
      throw error;
    }
  }

  /**
   * Stop an active mock trade
   */
  async stopMockTrade(tradeId: string, userId: string): Promise<IMockTrade | null> {
    try {
      // Find and update the trade
      const mockTrade = await MockTrade.findOneAndUpdate(
        { _id: tradeId, userId, status: 'active' },
        { status: 'stopped', endDate: new Date() },
        { new: true }
      );

      if (mockTrade) {
        // Also stop the DCA plan
        const userPlans = await this.dcaService.getUserPlans(userId);
        for (const plan of userPlans) {
          if (plan.chain === 'mock') {
            await this.dcaService.stopPlan(plan._id.toString());
          }
        }
      }

      return mockTrade;
    } catch (error) {
      logger.error(`Error stopping mock trade:`, error);
      throw error;
    }
  }

  /**
   * Get current position value for a mock trade
   */
  async getMockTradePosition(
    tradeId: string,
    userId: string
  ): Promise<{
    tokenAmount: number;
    usdValue: number;
  }> {
    try {
      const mockTrade = await MockTrade.findOne({ _id: tradeId, userId });
      if (!mockTrade) {
        throw new Error('Mock trade not found');
      }

      // Get the mock plugin
      const mockPlugin = PluginFactory.getPlugin('mock');

      // Get the current balance
      const tokenAmount = await mockPlugin.getNativeBalance(userId);

      // Convert to USD value
      const usdValue = await mockPlugin.getNativeTokenValueInUSDT(tokenAmount);

      return { tokenAmount, usdValue };
    } catch (error) {
      logger.error(`Error getting mock trade position:`, error);
      throw error;
    }
  }

  async fetchMockData() {
    const fetcher = new DataFetcher(
      // new CoinGeckoDataProvider(),
      new PythProvider(),
      'Crypto.USDT/USD',
      new Date(Date.now() - 1000 * 60 * 60 * 24 * 30), // 30 days
      new Date(Date.now()),
      'M' as PythProviderInterval
    );

    const data = await fetcher.fetchData();
    return data;
  }
}
