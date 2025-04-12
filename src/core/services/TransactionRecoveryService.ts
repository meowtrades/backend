import {
  TransactionAttempt,
  TransactionStatus,
  ITransactionAttempt,
} from '../../models/TransactionAttempt';
import { InvestmentPlan } from '../../models/InvestmentPlan';
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
    amount: number
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
   * Records a failed transaction for later recovery
   */
  public async markTransactionFailed(transactionId: string, error: string): Promise<void> {
    const transaction = await TransactionAttempt.findById(transactionId);
    if (!transaction) {
      logger.error(`Transaction ${transactionId} not found for failure marking`);
      return;
    }

    transaction.status = TransactionStatus.FAILED;
    transaction.error = error;
    transaction.lastAttemptTime = new Date();
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
      // Mark as retrying
      transaction.status = TransactionStatus.RETRYING;
      transaction.retryCount += 1;
      transaction.lastAttemptTime = new Date();
      await transaction.save();

      logger.info(
        `Retrying transaction ${transaction._id}, attempt ${transaction.retryCount} of ${transaction.maxRetries}`
      );

      // Get the plan and user information
      const plan = await InvestmentPlan.findById(transaction.planId);
      if (!plan) {
        logger.error(`Plan ${transaction.planId} not found for transaction ${transaction._id}`);
        transaction.status = TransactionStatus.FAILED;
        transaction.error = 'Plan not found';
        await transaction.save();
        return;
      }

      // Check if plan is still active
      if (!plan.isActive) {
        logger.info(
          `Plan ${transaction.planId} is no longer active, cancelling recovery for transaction ${transaction._id}`
        );
        transaction.status = TransactionStatus.FAILED;
        transaction.error = 'Plan no longer active';
        await transaction.save();
        return;
      }

      const user = await User.findOne({ _id: transaction.userId });
      if (!user) {
        logger.error(`User ${transaction.userId} not found for transaction ${transaction._id}`);
        transaction.status = TransactionStatus.FAILED;
        transaction.error = 'User not found';
        await transaction.save();
        return;
      }

      // Get the appropriate plugin
      const plugin = PluginFactory.getPlugin(transaction.chain);

      // Execute the transaction
      logger.info(
        `Executing recovered transaction ${transaction._id} for amount ${transaction.amount}`
      );
      const txHash = await plugin.sendSwapTransaction(transaction.amount, user.address);

      // Mark as complete
      transaction.status = TransactionStatus.COMPLETED;
      transaction.txHash = txHash;
      await transaction.save();

      // Update plan data if this was successful
      plan.lastExecutionTime = new Date();
      plan.totalInvested += transaction.amount;
      plan.executionCount += 1;

      // After first execution, save the initial amount for future calculations
      if (plan.executionCount === 1) {
        plan.initialAmount = plan.amount;
      }

      await plan.save();

      logger.info(`Successfully recovered transaction ${transaction._id}, txHash: ${txHash}`);
    } catch (error) {
      logger.error(`Failed to retry transaction ${transaction._id}:`, error);

      // If we've exceeded max retries, give up
      if (transaction.retryCount >= transaction.maxRetries) {
        logger.error(
          `Transaction ${transaction._id} has exceeded max retries (${transaction.maxRetries}), marking as permanently failed`
        );

        // Try to notify admin or user here about permanent failure

        transaction.status = TransactionStatus.FAILED;
        transaction.error = `Exceeded max retries: ${error}`;
        await transaction.save();
      } else {
        // Otherwise, mark as failed for next retry cycle
        transaction.status = TransactionStatus.FAILED;
        transaction.error = `Retry attempt ${transaction.retryCount} failed: ${error}`;

        // Implement exponential backoff - wait longer between retries
        // Each retry waits 2^retryCount minutes (capped at maxRetryDelayMinutes)
        const backoffMinutes = Math.min(
          Math.pow(2, transaction.retryCount),
          this.maxRetryDelayMinutes
        );
        transaction.lastAttemptTime = new Date(Date.now() + backoffMinutes * 60 * 1000);

        await transaction.save();
        logger.info(
          `Scheduled next retry for transaction ${transaction._id} in ${backoffMinutes} minutes`
        );
      }
    }
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
      TransactionAttempt.countDocuments({ status: TransactionStatus.RETRYING }),
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
