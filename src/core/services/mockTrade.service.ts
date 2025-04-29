import { InvestmentPlan, IInvestmentPlan } from '../../models/InvestmentPlan';
import { logger } from '../../utils/logger';
import { PluginFactory } from '../strategies/s-dca/chains/factory';
import { DCAService } from '../strategies/s-dca/index';
import { User } from '../../models/User';
import { RiskLevel, Frequency, Range } from '../types';
import { CreateMockTradeInput } from '../mocktrade/service';
import { DataFetcher } from '../mocktrade/mock.fetcher';
import { CoinGeckoDataProvider } from '../mocktrade/data-providers/coingecko.provider';
import {
  PythProvider,
  PythProviderData,
  PythProviderInterval,
} from '../mocktrade/data-providers/pyth.provider';
import { Interval } from '../mocktrade/data-providers/provider.interface';
import { PriceData } from './price.service';
import { SDCAStrategy } from '../mocktrade/strategies/s-dca.strategy';
import { MockExecutor } from '../mocktrade/mock.executor';
import { ParsedQs } from 'qs';
import { frequencyToInterval, rangeToDays } from '../../utils/convertors';
import { MockDataBatch } from '../../models/MockDataBatch';
import { OpenAIBatchProcessor } from '../mocktrade/openai.batch.processor';
import { SDCAStrategyAdapter } from '../mocktrade/strategies/nsdca.strategy';
import { PythTransformer } from '../mocktrade/data-providers/pyth.transformer';

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
   * Create a new investment plan for a user
   */
  async createMockTrade(userId: string, data: CreateMockTradeInput): Promise<IInvestmentPlan> {
    try {
      logger.info(`Creating mock trade for user ${userId}`, data);

      // Validate user exists
      const user = await User.findOne({ _id: userId });
      if (!user) {
        throw new Error('User not found');
      }

      // Create a new investment plan
      const investmentPlan = new InvestmentPlan({
        userId,
        strategyId: data.strategyId,
        tokenSymbol: data.tokenSymbol.toUpperCase(),
        initialAmount: data.amount,
        chain: 'mock',
        amount: data.amount,
        initialInvestment: data.amount, // Default to the same amount
        riskLevel: data.riskLevel || RiskLevel.MEDIUM_RISK,
        frequency: data.frequency || Frequency.DAILY,
        status: 'active',
        startDate: new Date(),
      });

      await investmentPlan.save();
      logger.info(`Created investment plan ${investmentPlan._id} for user ${userId}`);

      return investmentPlan;
    } catch (error) {
      logger.error(`Error creating investment plan:`, error);
      throw error;
    }
  }

  /**
   * Get all active investment plans for a user
   */
  async getActiveMockTrades(userId: string): Promise<IInvestmentPlan[]> {
    try {
      return await InvestmentPlan.find({ userId, status: 'active', chain: 'mock' });
    } catch (error) {
      logger.error(`Error fetching active investment plans:`, error);
      throw error;
    }
  }

  /**
   * Get details of a specific investment plan
   */
  async getMockTradeDetails(tradeId: string, userId: string): Promise<IInvestmentPlan | null> {
    try {
      return await InvestmentPlan.findOne({ _id: tradeId, userId });
    } catch (error) {
      logger.error(`Error fetching investment plan details:`, error);
      throw error;
    }
  }

  /**
   * Stop an active investment plan
   */
  async stopMockTrade(tradeId: string, userId: string): Promise<IInvestmentPlan | null> {
    try {
      // Find and update the plan
      const investmentPlan = await InvestmentPlan.findOneAndUpdate(
        { _id: tradeId, userId, status: 'active' },
        { status: 'stopped', endDate: new Date() },
        { new: true }
      );

      return investmentPlan;
    } catch (error) {
      logger.error(`Error stopping investment plan:`, error);
      throw error;
    }
  }

  /**
   * Get current position value for an investment plan
   */
  async getMockTradePosition(
    tradeId: string,
    userId: string
  ): Promise<{
    tokenAmount: number;
    usdValue: number;
  }> {
    try {
      const investmentPlan = await InvestmentPlan.findOne({ _id: tradeId, userId });
      if (!investmentPlan) {
        throw new Error('Investment plan not found');
      }

      // Get the mock plugin
      const mockPlugin = PluginFactory.getPlugin('mock');

      // Get the current balance
      const tokenAmount = await mockPlugin.getNativeBalance(userId);

      // Convert to USD value
      const usdValue = await mockPlugin.getNativeTokenValueInUSDT(tokenAmount);

      return { tokenAmount, usdValue };
    } catch (error) {
      logger.error(`Error getting investment plan position:`, error);
      throw error;
    }
  }

  async fetchMockData() {
    const fetcher = new DataFetcher(
      new PythProvider(),
      'Crypto.USDT/USD',
      new Date(Date.now() - 1000 * 60 * 60 * 24 * 90), // 90 days agi
      new Date(Date.now()),
      'D' as PythProviderInterval
    );

    const data = await fetcher.fetchData<PythProviderData>();
    return data;
  }

  async handleChartRequest(mockId: string) {
    // Check if data exists in DB
    const existingBatch = await MockDataBatch.findOne({ mockId });

    if (!existingBatch) {
      // No batch exists, create a new batch
      const newBatch = await this.createChartData();
      const mockDataBatch = new MockDataBatch({
        mockId,
        batchId: newBatch.id,
      });
      await mockDataBatch.save();

      return { message: 'Processing, come back later' };
    }

    // Check OpenAI batch status
    const batchProcessor = new OpenAIBatchProcessor(new SDCAStrategyAdapter());
    const batchStatus = await batchProcessor.getBatchMetadata(existingBatch.batchId);

    if (batchStatus.status === 'completed') {
      // Fetch results and store in DB
      const results = await batchProcessor.getBatchResult(existingBatch.batchId);
      existingBatch.data = results;
      await existingBatch.save();

      return { data: results };
    } else {
      // Batch is still processing
      return { message: 'Processing, come back later' };
    }
  }

  async createChartData() {
    const strategy = new SDCAStrategyAdapter();
    const batchProcessor = new OpenAIBatchProcessor(strategy);

    const data = await this.fetchMockData();
    const dataPoints = new PythTransformer().transform(data);

    return await batchProcessor.process(dataPoints);
  }

  async getChartData(mockId: string) {
    const batch = await MockDataBatch.findOne({ mockId });

    if (!batch) {
      throw new Error('Batch not found');
    }

    return batch.data;
  }

  async getOrCreateChartData(mockPlanId: string) {
    const batch = await MockDataBatch.findOne({ mockId: mockPlanId });

    if (batch) {
      return batch;
    }

    const newBatch = await this.createChartData();

    const mockDataBatch = new MockDataBatch({
      mockId: mockPlanId,
      batchId: newBatch.id,
    });

    await mockDataBatch.save();
    logger.info(`Created new batch ${mockDataBatch.batchId} for mock plan ${mockPlanId}`);

    return mockDataBatch;
  }

  async getChartStatus(fileId: string) {
    const strategy = new SDCAStrategyAdapter();

    const batchProcessor = new OpenAIBatchProcessor(strategy);

    return await batchProcessor.getBatchMetadata(fileId);
  }
}
