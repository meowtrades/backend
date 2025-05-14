import { IInvestmentPlan } from '../../models/InvestmentPlan';
import { generateCustomId } from '../../utils/generators';
import { Transaction } from '../types';
import { MockDataBatch } from '../../models/MockDataBatch';

export class TransactionTransformer {
  /**
   *
   * @param data
   * @param investmentPlan
   * @param options Optional pagination parameters
   *
   * Converts price factor chart data into Transaction[]
   * Uses price history from the batch for accurate price data
   * Supports pagination to avoid processing unnecessary data
   * Returns transactions in reverse chronological order (most recent first)
   */
  async transform(
    data: { priceFactor: number }[],
    investmentPlan: IInvestmentPlan,
    options?: { page?: number; limit?: number }
  ): Promise<{ transactions: Transaction[]; total: number }> {
    // Get the batch to access price history
    const batch = await MockDataBatch.findOne({ mockIds: investmentPlan.id });

    if (!batch) {
      throw new Error('Batch not found for investment plan');
    }

    // Calculate total length for pagination
    const total = data.length;

    // If pagination is requested, calculate the slice indices
    // Since we want most recent first, we need to reverse the slice indices
    let startIndex = 0;
    let endIndex = data.length;

    if (options?.page && options?.limit) {
      const page = options.page;
      const limit = options.limit;
      // Calculate indices from the end of the array
      startIndex = total - page * limit;
      endIndex = total - (page - 1) * limit;
      // Ensure startIndex doesn't go below 0
      startIndex = Math.max(0, startIndex);
    }

    // Process the required slice of data in reverse order
    const transactions = data
      .slice(startIndex, endIndex)
      .map((transaction, i) => {
        // Calculate the actual index in the full dataset
        const actualIndex = startIndex + i;
        const priceHistoryPoint = batch.priceHistory[actualIndex];

        if (!priceHistoryPoint) {
          throw new Error(`Price history not found for index ${actualIndex}`);
        }

        const usdInvestment = investmentPlan.initialAmount * transaction.priceFactor;
        const tokenAmount = usdInvestment / priceHistoryPoint.price;

        const newTransaction: Transaction = {
          id: generateCustomId(),
          type: 'buy',
          createdAt: new Date(priceHistoryPoint.timestamp * 1000),
          from: {
            token: 'USDT',
            amount: investmentPlan.initialAmount,
          },
          to: {
            token: investmentPlan.tokenSymbol,
            amount: tokenAmount,
          },
          price: priceHistoryPoint.price,
          value: usdInvestment,
          invested: usdInvestment,
          planId: investmentPlan.id,
          userId: investmentPlan.userId,
          status: 'completed',
          txHash: generateCustomId(), // Mock hash for historical data
        };

        return newTransaction;
      })
      .reverse(); // Reverse to get most recent first

    return { transactions, total };
  }
}
