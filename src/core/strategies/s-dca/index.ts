import { DCAPlugin, Frequency } from '../../types';
import { InvestmentPlan, IInvestmentPlan } from '../../../models/InvestmentPlan';
import { User } from '../../../models/User';
import { UserBalance } from '../../../models/UserBalance';
import cron from 'node-cron';
import { logger } from '../../../utils/logger';
import { analyzeTokenPrice, getRiskMultiplier } from './price-analysis';
import { PluginFactory } from './chains/factory';
import { RiskLevel } from '../../types';
import { TransactionRecoveryService } from '../../services/TransactionRecoveryService';
import { TokenRepository } from '../../factories/tokens.repository';

export class DCAService {
  private plugins: Map<string, DCAPlugin>;
  private cronJobs: Map<string, cron.ScheduledTask>;
  private recoveryService: TransactionRecoveryService;

  constructor() {
    this.plugins = new Map();
    this.cronJobs = new Map();
    this.recoveryService = TransactionRecoveryService.getInstance();
    logger.info('DCAService initialized, starting to initialize existing plans');
    this.initializeExistingPlans();
  }

  private getPlugin(chain: string): DCAPlugin {
    let plugin = this.plugins.get(chain);
    if (!plugin) {
      plugin = PluginFactory.getPlugin(chain);
      this.plugins.set(chain, plugin);
    }
    return plugin;
  }

  private async initializeExistingPlans() {
    try {
      const activePlans = await InvestmentPlan.find({
        isActive: true,
        chain: { $ne: 'mock' }, // Exclude mock chain plans
      });
      for (const plan of activePlans) {
        try {
          const user = await this.getUserById(plan.userId);
          if (!user) {
            // If user doesn't exist, deactivate the plan
            plan.isActive = false;
            await plan.save();
            logger.warn(
              `Deactivated plan ${plan._id} because associated user ${plan.userId} not found`
            );
            continue;
          }
          this.schedulePlan(plan);
        } catch (error) {
          logger.error(`Failed to initialize plan ${plan._id}:`, error);
          // Deactivate the plan if there's an error
          plan.isActive = false;
          await plan.save();
        }
      }
    } catch (error) {
      logger.error('Failed to initialize existing plans:', error);
    }
  }

  private getCronExpression(frequency: string): string {
    switch (frequency) {
      case Frequency.DAILY:
        return '0 0 * * *';
      case Frequency.WEEKLY:
        return '0 0 * * 0'; // Every Sunday at midnight
      case Frequency.MONTHLY:
        return '0 0 1 * *'; // First day of every month at midnight
      case Frequency.TEST_MINUTE: // Use the enum value
        return '* * * * *'; // Every minute
      case Frequency.TEST_10_SECONDS:
        return '*/10 * * * * *'; // Every 10 seconds
      default:
        // Check if the frequency exists in the enum before throwing an error
        if (Object.values(Frequency).includes(frequency as Frequency)) {
          throw new Error(`Cron expression not defined for frequency: ${frequency}`);
        }
        throw new Error(`Invalid frequency: ${frequency}`);
    }
  }

  private async getUserById(id: string) {
    const user = await User.findOne({ _id: id });
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }

  private async executePlan(plan: IInvestmentPlan) {
    try {
      logger.info(`Starting execution for plan ${plan._id}`);

      const user = await this.getUserById(plan.userId);

      logger.info(`Found user ${user._id} for plan ${plan._id}`);

      // Get the execution amount
      let executionAmount = plan.amount;
      logger.info(`Initial execution amount for plan ${plan._id}: ${executionAmount}`);

      // Check user's balance before proceeding
      const userBalance = await UserBalance.findOne({ userId: plan.userId });
      if (!userBalance) {
        logger.warn(`UserBalance record not found for user ${plan.userId}, skipping execution.`);
        return;
      }

      const chainBalance = userBalance.balances.find(
        b => b.chainId === plan.chain && b.tokenSymbol === 'USDT'
      );

      const currentBalance = chainBalance ? parseFloat(chainBalance.balance) : 0;

      if (currentBalance < executionAmount) {
        logger.warn(
          `Insufficient balance for user ${plan.userId} on chain ${plan.chain}. ` +
            `Required: ${executionAmount}, Available: ${currentBalance}. Skipping execution.`
        );
        return;
      }

      // If this is not the first execution, apply risk-based strategy
      if (plan.executionCount > 0) {
        logger.info(
          `Plan ${plan._id} has previous executions (count: ${plan.executionCount}), applying risk strategy`
        );
        // Get price analysis for token based on chain
        const analysis = await analyzeTokenPrice(plan.chain);
        logger.info(`Price analysis for plan ${plan._id}:`, analysis);

        // Get risk multiplier based on user's selected risk level
        const riskMultiplier = getRiskMultiplier(plan.riskLevel as RiskLevel);

        // Calculate updated amount based on risk level
        const updatedAmount = plan.initialAmount * riskMultiplier;

        // Calculate the random number component based on price factor
        const randomNumber = (updatedAmount - plan.initialAmount) * analysis.priceFactor;

        // Apply the formula based on price trend
        if (analysis.isPriceGoingUp) {
          // If price going up: FP = UA - RN
          executionAmount = updatedAmount - randomNumber;
        } else {
          // If price going down: FP = UA + RN
          executionAmount = updatedAmount + randomNumber;
        }

        logger.info(`Plan ${plan._id}: Applied risk-based strategy
          Risk Level: ${plan.riskLevel}, Risk Multiplier: ${riskMultiplier}
          Price Factor: ${analysis.priceFactor}, Price Trend: ${
          analysis.isPriceGoingUp ? 'Up' : 'Down'
        }
          Initial Amount: ${plan.initialAmount}, Updated Amount: ${updatedAmount}
          Random Component: ${randomNumber}, Final Amount: ${executionAmount}`);
      }

      const price = await TokenRepository.getTokenPrice(plan.tokenSymbol);
      const value = price * executionAmount;
      const invested = executionAmount;

      // Create a transaction record for tracking and recovery
      const transaction = await this.recoveryService.createTransactionAttempt(
        plan._id.toString(),
        plan.userId,
        plan.chain,
        executionAmount,
        'swap',
        { token: 'USDT', amount: executionAmount },
        { token: plan.tokenSymbol, amount: executionAmount / price },
        price,
        value,
        invested
      );

      try {
        // Get the appropriate plugin for this chain
        logger.info(`Getting plugin for chain ${plan.chain}`);
        const plugin = this.getPlugin(plan.chain);

        // Execute the transaction with the calculated amount
        logger.info(`Sending swap transaction for plan ${plan._id}:
          Amount: ${executionAmount}
          From: ${user.address}`);
        const txHash = await plugin.sendSwapTransaction(executionAmount, user.address);

        // Mark transaction as completed
        await this.recoveryService.markTransactionComplete(transaction._id.toString(), txHash);

        // Update plan data
        plan.lastExecutionTime = new Date();
        plan.totalInvested += executionAmount;
        plan.executionCount += 1;

        // After first execution, save the initial amount for future calculations
        if (plan.executionCount === 1) {
          plan.initialAmount = plan.amount;
        }

        await plan.save();

        // Update the user's wallet balance
        try {
          const userBalance = await UserBalance.findOne({ userId: plan.userId });
          if (userBalance) {
            const chainBalance = userBalance.balances.find(
              b => b.chainId === plan.chain && b.tokenSymbol === 'USDT'
            );

            if (chainBalance) {
              const currentBalance = parseFloat(chainBalance.balance);
              chainBalance.balance = (currentBalance - executionAmount).toString();
              chainBalance.lastUpdated = new Date();
            } else {
              userBalance.balances.push({
                chainId: plan.chain,
                tokenSymbol: 'USDT',
                balance: (-executionAmount).toString(),
                lastUpdated: new Date(),
              });
            }

            await userBalance.save();
            logger.info(`Updated wallet balance for user ${plan.userId} after plan execution.`);
          } else {
            logger.warn(`UserBalance record not found for user ${plan.userId}`);
          }
        } catch (balanceError) {
          logger.error(`Failed to update wallet balance for user ${plan.userId}:`, balanceError);
        }

        logger.info(
          `Successfully executed DCA plan: ${plan._id}, txHash: ${txHash}, amount: ${executionAmount}`
        );
      } catch (error) {
        // Mark transaction as failed for later recovery
        logger.error(`Failed to execute transaction for plan ${plan._id}:`, error);
        await this.recoveryService.markTransactionFailed(
          transaction._id.toString(),
          error instanceof Error ? error.message : String(error)
        );

        // Don't throw here, as we've recorded the failure for recovery
      }
    } catch (error) {
      logger.error(`Failed to prepare execution for plan ${plan._id}:`, error);
      // Plan preparation errors are not recoverable automatically
    }
  }

  private schedulePlan(plan: IInvestmentPlan) {
    try {
      const cronExpression = this.getCronExpression(plan.frequency);
      logger.info(`Scheduling plan ${plan._id} with cron expression: ${cronExpression}`);
      const job = cron.schedule(cronExpression, () => this.executePlan(plan));
      this.cronJobs.set(plan._id.toString(), job);
      logger.info(`Successfully scheduled plan ${plan._id}`);
    } catch (error) {
      logger.error(`Failed to schedule plan ${plan._id}:`, error);
    }
  }

  async createPlan(
    userId: string,
    planData: {
      amount: number;
      frequency: string;
      userWalletAddress: string;
      riskLevel: RiskLevel;
      chain: string;
    }
  ): Promise<IInvestmentPlan> {
    // Validate that the chain plugin exists
    this.getPlugin(planData.chain);

    const plan = await InvestmentPlan.create({
      userId,
      ...planData,
      tokenSymbol: 'USDT', // FIXME: Remove this
      strategyId: 'SDCA', // FIXME: Remove this
      initialAmount: planData.amount,
      isActive: true,
      executionCount: 0,
    });

    this.schedulePlan(plan);
    return plan;
  }

  async stopPlan(planId: string): Promise<IInvestmentPlan | null> {
    const plan = await InvestmentPlan.findById(planId);
    if (!plan) {
      return null;
    }

    // Get the plugin for the chain
    const plugin = this.getPlugin(plan.chain);

    // Get the user to get their wallet address
    const user = await this.getUserById(plan.userId);

    if (!user) {
      throw new Error('User not found');
    }

    // Withdraw the total invested amount
    if (plan.totalInvested > 0) {
      // await plugin.withdrawTokens(plan.totalInvested, user.address);
    }

    // Stop the plan
    plan.isActive = false;
    await plan.save();

    const job = this.cronJobs.get(planId);
    if (job) {
      job.stop();
      this.cronJobs.delete(planId);
    }

    return plan;
  }

  async getUserPlans(userId: string): Promise<IInvestmentPlan[]> {
    return InvestmentPlan.find({ userId });
  }

  async getUserTotalInvestment(userId: string): Promise<number> {
    const result = await InvestmentPlan.aggregate([
      { $match: { userId: userId } },
      { $group: { _id: null, total: { $sum: '$totalInvested' } } },
    ]);
    return result.length > 0 ? result[0].total : 0;
  }

  async emergencyStop(planId: string): Promise<void> {
    const plan = await InvestmentPlan.findById(planId);
    if (plan) {
      plan.isActive = false;
      await plan.save();
      const job = this.cronJobs.get(planId);
      if (job) {
        job.stop();
        this.cronJobs.delete(planId);
      }
    }
  }

  async stopAllUserPlans(userId: string): Promise<number> {
    try {
      const plans = await InvestmentPlan.find({ userId, isActive: true });
      let stoppedCount = 0;

      for (const plan of plans) {
        plan.isActive = false;
        await plan.save();

        const job = this.cronJobs.get(plan._id.toString());
        if (job) {
          job.stop();
          this.cronJobs.delete(plan._id.toString());
        }
        stoppedCount++;
      }

      return stoppedCount;
    } catch (error) {
      logger.error(`Failed to stop all plans for user ${userId}:`, error);
      throw error;
    }
  }

  async getUserCurrentPositions(userId: string): Promise<
    Array<{
      planId: string;
      chain: string;
      nativeTokenAmount: number;
      usdtValue: number;
    }>
  > {
    const plans = await InvestmentPlan.find({ userId });
    const positions = [];

    for (const plan of plans) {
      try {
        const plugin = this.getPlugin(plan.chain);
        const user = await this.getUserById(plan.userId);

        if (!user) {
          logger.warn(`User not found for plan ${plan._id}`);
          continue;
        }

        // Get native token balance
        const nativeTokenAmount = await plugin.getNativeBalance(user.address);

        // Get current price of native token in USDT
        const usdtValue = await plugin.getNativeTokenValueInUSDT(nativeTokenAmount);

        positions.push({
          planId: plan._id.toString(),
          chain: plan.chain,
          nativeTokenAmount,
          usdtValue,
        });
      } catch (error) {
        logger.error(`Failed to get position for plan ${plan._id}:`, error);
        // Continue with other plans even if one fails
        continue;
      }
    }

    return positions;
  }
}
