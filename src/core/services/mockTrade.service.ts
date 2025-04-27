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
import { sleep } from '../../utils/sleep';

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
      // new CoinGeckoDataProvider(),
      new PythProvider(),
      'Crypto.USDT/USD',
      // new Date(Date.now() - 1000 * 60 * 60 * 24 * 30 * 7), // 30 days
      new Date(Date.now() - 1000 * 60 * 60 * 24 * 7), // 7 days agi
      new Date(Date.now()),
      'D' as PythProviderInterval
    );

    const data = await fetcher.fetchData<PythProviderData>();
    return data;
  }

  async checkMockData() {
    const data = await this.fetchMockData();

    const dataPoints = [];

    for (let i = 0; i < data.t.length; i++) {
      const dataPoint: PriceData = {
        date: new Date(data.t[i] * 1000).toISOString(),
        price: data.c[i],
        timestamp: data.t[i],
      };
      dataPoints.push(dataPoint);
    }

    const strat = new SDCAStrategy();

    const initialAmount = 1000;
    const amount = 1000;

    const executor = new MockExecutor(strat);

    // const executor = new MockExecutor(strat);

    // const result = await executor.executePlan(dataPoints);

    return await executor.execute(dataPoints, initialAmount, amount, RiskLevel.MEDIUM_RISK);
  }

  /**
   * Update mock data for all active plans
   */
  async updateMockDataForActivePlans(): Promise<void> {
    const activePlans = await InvestmentPlan.find({ status: 'active', chain: 'mock' });

    for (const plan of activePlans) {
      logger.info(`Updating mock data for plan ${plan._id}`);
      const { tokenSymbol, initialAmount, amount, riskLevel } = plan;

      // Hardcoded interval and range
      const interval = '1D';
      const range = 90; // 90 days

      const startTime = new Date(Date.now() - 1000 * 60 * 60 * 24 * range);
      const endTime = new Date();

      const fetcher = new DataFetcher(
        new PythProvider(),
        tokenSymbol,
        startTime,
        endTime,
        interval
      );

      const data = await fetcher.fetchData<PythProviderData>();

      const dataPoints: PriceData[] = data.t.map((timestamp: number, i: number) => ({
        date: new Date(timestamp * 1000).toISOString(),
        price: data.c[i],
        timestamp,
      }));

      // Split data into 7-day batches
      const batchSize = 7;
      const batches = [];
      for (let i = 30; i < dataPoints.length; i += batchSize) {
        batches.push(dataPoints.slice(i, i + batchSize));
      }

      const strat = new SDCAStrategy();
      const executor = new MockExecutor(strat);

      const mockData: PriceData[] = [];

      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        const remainingIterations = batches.length - i;

        logger.info(
          `Processing batch ${i + 1}/${batches.length} for plan ${
            plan._id
          }. Remaining iterations: ${remainingIterations}`
        );

        // Execute the strategy for the current batch
        const batchResult = await executor.execute(batch, initialAmount, amount, riskLevel);

        if (batchResult.length === 0) {
          logger.warn(`Batch ${i + 1} returned no results.`);
        } else {
          logger.info(`Batch ${i + 1} processed ${batchResult.length} data points.`);
        }

        mockData.push(...batchResult);

        // Log "Sleeping for 60 seconds..." only once per iteration
        logger.info(`Sleeping for 60 seconds...`);

        // Introduce a delay between batches to respect OpenAI rate limits
        await sleep(60 * 1000); // 1-minute delay
      }

      // Save the processed mock data to the database immediately after completing iterations for this plan
      plan.mockData = mockData;
      plan.mockDataLastUpdated = new Date();
      await plan.save(); // Ensure this is awaited to persist the data

      logger.info(`Mock data for plan ${plan._id} has been saved successfully.`);
    }
  }

  /**
   * Get mock chart data for a specific plan
   */
  async getMockChartData(
    tokenSymbol: string,
    range: string | Range,
    frequency: Frequency | string,
    initialAmount: number,
    amount: number,
    risk: RiskLevel,
    planId: string
  ) {
    const plan = await InvestmentPlan.findById(planId);

    if (!plan) {
      throw new Error('Investment plan not found');
    }

    // Serve stored data if it is up-to-date
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of the day
    if (plan.mockDataLastUpdated && plan.mockDataLastUpdated >= today) {
      return plan.mockData;
    }

    // Otherwise, recalculate and update
    const days = isNaN(Number(range)) ? rangeToDays(range as Range) : Number(range);
    const startTime = new Date(Date.now() - 1000 * 60 * 60 * 24 * days);
    const endTime = new Date();

    const interval = frequencyToInterval(frequency as Frequency);

    const fetcher = new DataFetcher(new PythProvider(), tokenSymbol, startTime, endTime, interval);

    const data = await fetcher.fetchData<PythProviderData>();

    const dataPoints: PriceData[] = data.t.map((timestamp, i) => ({
      date: new Date(timestamp * 1000).toISOString(),
      price: data.c[i],
      timestamp,
    }));

    const strat = new SDCAStrategy();
    const executor = new MockExecutor(strat);

    const mockData = await executor.execute(dataPoints, initialAmount, amount, risk);

    plan.mockData = mockData;
    plan.mockDataLastUpdated = new Date();
    await plan.save();

    return mockData;
  }
}
