import { RiskLevel } from '../types';
import { analyzeTokenPrice, getRiskMultiplier } from './priceAnalysisService';
import { logger } from '../../utils/logger';

export interface MockPlanConfig {
  strategy: string;
  tokenId: string;
  initialInvestment: number;
  riskLevel: RiskLevel;
  startDate: Date;
  endDate?: Date;
  userId: string;
}

export interface MockPlanResult {
  planId: string;
  config: MockPlanConfig;
  currentValue: number;
  totalInvested: number;
  profitLoss: number;
  profitLossPercentage: number;
  transactions: Array<{
    date: Date;
    type: 'BUY' | 'SELL';
    amount: number;
    price: number;
    value: number;
  }>;
}

export class MockPlanService {
  private activePlans: Map<string, MockPlanResult>;

  constructor() {
    this.activePlans = new Map();
  }

  async startMockPlan(config: MockPlanConfig): Promise<MockPlanResult> {
    try {
      // Generate a unique plan ID
      const planId = `mock-plan-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Initialize the plan result
      const planResult: MockPlanResult = {
        planId,
        config,
        currentValue: config.initialInvestment,
        totalInvested: config.initialInvestment,
        profitLoss: 0,
        profitLossPercentage: 0,
        transactions: []
      };

      // Store the plan
      this.activePlans.set(planId, planResult);

      // Start the mock trading process
      this.runMockPlan(planId);

      return planResult;
    } catch (error) {
      logger.error('Failed to start mock plan:', error);
      throw new Error(`Failed to start mock plan: ${error}`);
    }
  }

  private async runMockPlan(planId: string) {
    const plan = this.activePlans.get(planId);
    if (!plan) {
      logger.error(`Plan ${planId} not found`);
      return;
    }

    try {
      // Get current price analysis
      const analysis = await analyzeTokenPrice(plan.config.tokenId);
      const riskMultiplier = getRiskMultiplier(plan.config.riskLevel);

      // Calculate investment amount based on strategy and analysis
      let investmentAmount = 0;
      if (plan.config.strategy === 'smart-dca') {
        investmentAmount = this.calculateSmartDCAInvestment(
          plan.config.initialInvestment,
          analysis,
          riskMultiplier
        );
      }

      // Execute mock transaction if investment amount is positive
      if (investmentAmount > 0) {
        await this.executeMockTransaction(plan, investmentAmount, analysis);
      }

      // Update plan metrics
      this.updatePlanMetrics(plan);

      // Schedule next execution based on strategy
      this.scheduleNextExecution(planId);
    } catch (error) {
      logger.error(`Error running mock plan ${planId}:`, error);
    }
  }

  private calculateSmartDCAInvestment(
    baseAmount: number,
    analysis: any,
    riskMultiplier: number
  ): number {
    // Smart DCA strategy implementation
    const baseInvestment = baseAmount * 0.1; // 10% of initial investment per transaction
    return baseInvestment * analysis.priceFactor * riskMultiplier;
  }

  private async executeMockTransaction(
    plan: MockPlanResult,
    amount: number,
    analysis: any
  ) {
    try {
      // Record the transaction
      const transaction = {
        date: new Date(),
        type: 'BUY' as const,
        amount,
        price: analysis.movingAverage7Day,
        value: amount * analysis.movingAverage7Day
      };

      plan.transactions.push(transaction);
      plan.totalInvested += amount;

      // Update current value based on latest price
      plan.currentValue = plan.totalInvested * (1 + analysis.priceChangePercentage / 100);
      plan.profitLoss = plan.currentValue - plan.totalInvested;
      plan.profitLossPercentage = (plan.profitLoss / plan.totalInvested) * 100;

      logger.info(`Mock transaction executed for plan ${plan.planId}:`, transaction);
    } catch (error) {
      logger.error('Error executing mock transaction:', error);
      throw error;
    }
  }

  private updatePlanMetrics(plan: MockPlanResult) {
    // Update plan metrics based on latest transactions and prices
    const latestTransaction = plan.transactions[plan.transactions.length - 1];
    if (latestTransaction) {
      plan.currentValue = latestTransaction.value;
      plan.profitLoss = plan.currentValue - plan.totalInvested;
      plan.profitLossPercentage = (plan.profitLoss / plan.totalInvested) * 100;
    }
  }

  private scheduleNextExecution(planId: string) {
    // Schedule next execution based on strategy
    // For now, we'll use a simple interval
    setTimeout(() => {
      this.runMockPlan(planId);
    }, 24 * 60 * 60 * 1000); // Run every 24 hours
  }

  getPlan(planId: string): MockPlanResult | undefined {
    return this.activePlans.get(planId);
  }

  getAllPlans(): MockPlanResult[] {
    return Array.from(this.activePlans.values());
  }
} 