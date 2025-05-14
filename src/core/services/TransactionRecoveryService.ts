import {
  TransactionAttempt,
  TransactionStatus,
  ITransactionAttempt,
} from '../../models/TransactionAttempt';
import { InvestmentPlan, IInvestmentPlan } from '../../models/InvestmentPlan';
import { User } from '../../models/User';
import { PluginFactory } from '../strategies/s-dca/chains/factory';
import { logger } from '../../utils/logger';
import cron from 'node-cron';

export class TransactionRecoveryService {
  private static instance: TransactionRecoveryService;
  private recoveryJob: cron.ScheduledTask | null = null;
  private readonly maxRetryDelayMinutes = 30; // Maximum time to wait between retries

  private constructor() {
    // Initialize recovery job to run every 5 minutes
    this.recoveryJob = cron.schedule('*/5 * * * *', () => this.processFailedTransactions());
    logger.info('Transaction recovery service initialized');
  }

  public static getInstance(): TransactionRecoveryService {
    if (!TransactionRecoveryService.instance) {
      TransactionRecoveryService.instance = new TransactionRecoveryService();
    }
    return TransactionRecoveryService.instance;
  }

  /**
   * Creates a new transaction attempt record
   */
  public async createTransactionAttempt(
    planId: string,
    userId: string,
    chain: string,
    amount: number,
    type: string,
    from: {
      token: string;
      amount: number;
    },
    to: {
      token: string;
      amount: number;
    },
    price: number,
    value: number,
    invested: number
  ): Promise<ITransactionAttempt> {
    const transaction = await TransactionAttempt.create({
      planId,
      userId,
      chain,
      amount,
      status: TransactionStatus.PENDING,
      retryCount: 0,
      maxRetries: 3,
      lastAttemptTime: new Date(),
      type,
      from,
      to,
      price,
      value,
      invested,
    });

    logger.info(`Created transaction attempt record: ${transaction._id} for plan: ${planId}`);
    return transaction;
  }

  /**
   * Records a successful transaction completion
   */
  public async markTransactionComplete(transactionId: string, txHash: string): Promise<void> {
    const transaction = await TransactionAttempt.findById(transactionId);
    if (!transaction) {
      logger.error(`Transaction ${transactionId} not found for completion`);
      return;
    }

    transaction.status = TransactionStatus.COMPLETED;
    transaction.txHash = txHash;
    await transaction.save();

    logger.info(`Marked transaction ${transactionId} as completed with hash: ${txHash}`);
  }

  /**
   * Records a failed transaction
   */
  public async markTransactionFailed(transactionId: string, error: string): Promise<void> {
    const transaction = await TransactionAttempt.findById(transactionId);
    if (!transaction) {
      logger.error(`Transaction ${transactionId} not found for failure marking`);
      return;
    }

    transaction.status = TransactionStatus.FAILED;
    transaction.error = error;
    await transaction.save();

    logger.error(`Marked transaction ${transactionId} as failed: ${error}`);
  }

  /**
   * Processes all failed transactions that need recovery
   */
  public async processFailedTransactions(): Promise<void> {
    try {
      logger.info('Starting failed transaction recovery process');

      // Find failed transactions that haven't exceeded max retries
      const failedTransactions = await TransactionAttempt.find({
        status: TransactionStatus.FAILED,
        retryCount: { $lt: '$maxRetries' },
      });

      logger.info(`Found ${failedTransactions.length} failed transactions to retry`);

      for (const transaction of failedTransactions) {
        await this.retryTransaction(transaction);
      }

      // Also look for stuck pending transactions (older than 10 minutes)
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
      const stuckTransactions = await TransactionAttempt.find({
        status: TransactionStatus.PENDING,
        lastAttemptTime: { $lt: tenMinutesAgo },
      });

      logger.info(`Found ${stuckTransactions.length} stuck pending transactions to retry`);

      for (const transaction of stuckTransactions) {
        await this.retryTransaction(transaction);
      }
    } catch (error) {
      logger.error('Error in transaction recovery process:', error);
    }
  }

  /**
   * Retries a single failed transaction
   */
  private async retryTransaction(transaction: ITransactionAttempt): Promise<void> {
    try {
      // Get the investment plan
      const plan = await InvestmentPlan.findById(transaction.planId);
      if (!plan) {
        throw new Error(`Investment plan ${transaction.planId} not found`);
      }

      // Execute the transaction based on type
      let txHash: string;
      switch (transaction.type) {
        case 'buy':
          txHash = await this.executeBuyTransaction(transaction, plan);
          break;
        case 'sell':
          txHash = await this.executeSellTransaction(transaction, plan);
          break;
        case 'swap':
          txHash = await this.executeSwapTransaction(transaction, plan);
          break;
        default:
          throw new Error(`Unsupported transaction type: ${transaction.type}`);
      }

      // Update transaction status
      transaction.status = TransactionStatus.COMPLETED;
      transaction.txHash = txHash;
      await transaction.save();

      // Update plan data
      plan.lastExecutionTime = new Date();
      plan.totalInvested += transaction.invested;
      plan.executionCount += 1;

      // After first execution, save the initial amount for future calculations
      if (plan.executionCount === 1) {
        plan.initialAmount = transaction.invested;
      }

      await plan.save();

      logger.info(`Successfully completed transaction ${transaction._id}, txHash: ${txHash}`);
    } catch (error) {
      logger.error(`Failed to execute transaction ${transaction._id}:`, error);

      transaction.status = TransactionStatus.FAILED;
      transaction.error = `Transaction failed: ${error}`;
      await transaction.save();
    }
  }

  private async executeBuyTransaction(
    transaction: ITransactionAttempt,
    plan: IInvestmentPlan
  ): Promise<string> {
    // Implement buy transaction logic
    throw new Error('Buy transaction not implemented');
  }

  private async executeSellTransaction(
    transaction: ITransactionAttempt,
    plan: IInvestmentPlan
  ): Promise<string> {
    // Implement sell transaction logic
    throw new Error('Sell transaction not implemented');
  }

  private async executeSwapTransaction(
    transaction: ITransactionAttempt,
    plan: IInvestmentPlan
  ): Promise<string> {
    // Implement swap transaction logic
    throw new Error('Swap transaction not implemented');
  }

  /**
   * Returns statistics about transaction recovery
   */
  public async getRecoveryStats(): Promise<{
    pending: number;
    failed: number;
    retrying: number;
    completed: number;
    recoveryRate: number;
  }> {
    const [pending, failed, retrying, completed] = await Promise.all([
      TransactionAttempt.countDocuments({ status: TransactionStatus.PENDING }),
      TransactionAttempt.countDocuments({ status: TransactionStatus.FAILED }),
      TransactionAttempt.countDocuments({ status: TransactionStatus.PENDING }),
      TransactionAttempt.countDocuments({ status: TransactionStatus.COMPLETED }),
    ]);

    const total = pending + failed + retrying + completed;
    const recoveryRate = total > 0 ? completed / total : 0;

    return {
      pending,
      failed,
      retrying,
      completed,
      recoveryRate,
    };
  }

  /**
   * Stop the recovery service
   */
  public stopService(): void {
    if (this.recoveryJob) {
      this.recoveryJob.stop();
      this.recoveryJob = null;
      logger.info('Transaction recovery service stopped');
    }
  }
}
