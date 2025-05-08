import { IMockDataBatch, MockDataBatch } from './../../models/MockDataBatch';
import { InvestmentPlan, IInvestmentPlan } from '../../models/InvestmentPlan';
import { logger } from '../../utils/logger';
import { PluginFactory } from '../strategies/s-dca/chains/factory';
import { DCAService } from '../strategies/s-dca/index';
import { User } from '../../models/User';
import { RiskLevel, Frequency } from '../types';
import { CreateMockTradeInput } from '../mocktrade/service';
import { DataFetcher } from '../mocktrade/mock.fetcher';
import {
  PythProvider,
  PythProviderData,
  PythProviderInterval,
} from '../mocktrade/data-providers/pyth.provider';
import { OpenAIBatchProcessor, OpenAIStatus } from '../mocktrade/openai.batch.processor';
import { SDCAStrategyAdapter } from '../mocktrade/strategies/nsdca.strategy';
import { PythTransformer } from '../mocktrade/data-providers/pyth.transformer';
import { TokenName, TokensRepository } from '../factories/tokens.repository';
import { PythTokenTransformer } from '../transformers/pyth.token.transformer';

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

  async fetchMockData(tokenSymbol: TokenName = 'USDT') {
    const provider = new PythProvider();
    const pythTokenSymbol = PythTokenTransformer.transform(tokenSymbol);
    const startTime = new Date(Date.now() - 1000 * 60 * 60 * 24 * 90); // 90 days ago
    const endTime = new Date(Date.now());
    const interval = 'D' as PythProviderInterval;

    const fetcher = new DataFetcher(provider, pythTokenSymbol, startTime, endTime, interval);

    const data = await fetcher.fetchData<PythProviderData>();
    return data;
  }

  /**
   *
   * @param mockId string
   * @param tokenSymbol string
   * @returns `Batchh` object
   *
   * Create a new batch of mock data for the given token symbol
   * and link it to the given mock trade ID.
   * The batch is created by fetching data from the Pyth provider,
   */
  async createMockChart(
    mockId: string,
    tokenSymbol: TokenName,
    strategyName: string,
    riskProfile: string
  ) {
    const data = await this.fetchMockData(tokenSymbol);

    const transformer = new PythTransformer();
    const transformedData = transformer.transform(data);

    const strategy = new SDCAStrategyAdapter();
    const batchProcessor = new OpenAIBatchProcessor(strategy);
    const batch = await batchProcessor.process(transformedData);

    // console.log({
    //   mockIds: [mockId],
    //   batchId: batch.id,
    //   tokenSymbol,
    //   strategyName,
    //   status: OpenAIStatus.IN_PROGRESS,
    //   data: batch,
    // });

    let newBatch: IMockDataBatch;

    // Handle case where openai batch is created but not saved
    // This can happen if the batch is created but not saved to the database
    // due to a network error or other issue
    // In this case, cancel the old batch to save tokens
    try {
      newBatch = new MockDataBatch({
        mockIds: [mockId],
        batchId: batch.id,
        tokenSymbol,
        strategyName,
        riskProfile,
        status: OpenAIStatus.IN_PROGRESS,
        data: batch,
      });
    } catch (error) {
      await OpenAIBatchProcessor.cancelBatch(batch.id);
      logger.info(`Cancelled batch ${batch.id} due to error:`, error);
      throw new Error('Error creating new batch');
    }

    const investmentPlan = await InvestmentPlan.findOneAndUpdate(
      { _id: mockId },
      { batchId: newBatch.batchId }
    );

    if (!investmentPlan) {
      throw new Error('Investment plan not found');
    }

    await Promise.all([newBatch.save(), investmentPlan.save()]);
    logger.info(`Created new batch ${newBatch.batchId} for mock trade ${mockId}`);

    return newBatch;
  }
  /**
   * @param mockId
   *
   * Check if the mock trade with similar pre requisites already exists
   * if yes, insert id of the current mock trade in the batch's mockIds array
   * and link the batch to the current mock trade
   * if no, create a new batch and insert the mock trade id
   */
  async linkOrCreateMockChart(
    mockId: string,
    tokenSymbol: string,
    strategyName: string,
    riskProfile: string
  ) {
    const batchPromise = MockDataBatch.findOne({ tokenSymbol, strategyName, riskProfile });
    const mockTradePromise = InvestmentPlan.findById(mockId);

    const [batch, mockTrade] = await Promise.all([batchPromise, mockTradePromise]);

    if (!mockTrade) {
      throw new Error('Mock trade not found');
    }

    if (batch) {
      // If batch exists, add the mockId to the batch
      batch.mockIds.push(mockId);
      mockTrade.batchId = batch.batchId; // Link the mock trade to the batch

      await Promise.all([batch.save(), mockTrade.save()]);

      logger.info(`Added mock trade ${mockId} to existing batch ${batch.batchId}`);

      return batch;
    }

    const token = TokensRepository.validateAndGetToken(tokenSymbol);

    // If batch doesn't exist, create a new one
    return this.createMockChart(mockId, token, strategyName, riskProfile);
  }

  /**
   * @param mockId
   *
   * Get the chart data for a specific mock trade
   * if the batch exists, return the data
   * if the batch does not exist, create a new batch and return the data
   */
  async getChartDataForMockTrade(mockId: string): Promise<string | IMockDataBatch> {
    const investmentPlan = await InvestmentPlan.findById(mockId);
    if (!investmentPlan) {
      throw new Error('Investment plan not found');
    }

    const batch = await MockDataBatch.findOne({ mockIds: mockId });
    if (!batch) {
      throw new Error('Batch not found');
    }

    return batch.data;
  }

  async pollMockTradeBatch(batchId: string) {
    const batch = await MockDataBatch.findOne({ batchId });

    if (!batch) {
      throw new Error('Batch not found');
    }

    const batchProcessor = new OpenAIBatchProcessor(new SDCAStrategyAdapter());
    const { status, output_file_id } = await batchProcessor.getBatchMetadata(batchId);

    if (status === 'completed' && output_file_id) {
      batch.status = 'completed';
      batch.data = await batchProcessor.getBatchResult(output_file_id);
      await batch.save();
      return batch;
    }

    if (status === 'failed') {
      batch.status = 'failed';
      await batch.save();
      throw new Error('Batch processing failed');
    }

    return {
      status: 'in_progress',
      message: 'Batch is still processing',
      batchId,
    };
  }

  async getMockTradeChart(mockId: string): Promise<
    | IMockDataBatch
    | string
    | {
        status: string;
        message: string;
        batchId: string;
      }
  > {
    const investmentPlan = await InvestmentPlan.findById(mockId);

    if (!investmentPlan) {
      throw new Error('Investment plan not found');
    }

    const batch = await MockDataBatch.findOne({ mockIds: mockId });

    if (!batch) {
      return await this.linkOrCreateMockChart(
        mockId,
        investmentPlan.tokenSymbol,
        investmentPlan.strategyId,
        investmentPlan.riskLevel
      );
    }

    logger.info(`Batch found for mock trade ${mockId}: ${batch.batchId}`);

    const batchStatus = batch.status as OpenAIStatus;

    if (batchStatus === 'in_progress') {
      return this.pollMockTradeBatch(batch.batchId);
    }

    if (batch.status === 'completed') {
      return batch.data;
    }

    throw new Error('Batch is not in a valid state');
  }

  async listBatches() {
    return OpenAIBatchProcessor.listBatches();
  }
}
