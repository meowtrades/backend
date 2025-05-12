import { IInvestmentPlan } from '../../models/InvestmentPlan';
import { generateCustomId } from '../../utils/generators';
import { PriceData } from '../services/price.service';
import { Transaction } from '../types';

export class TransactionTransformer {
  /**
   *
   * @param data
   * @param investmentPlan
   * @param options Optional pagination parameters
   *
   * Converts price factor chart data into Transaction[]
   * creates timestamp for each transaction just like chart transformer
   * Supports pagination to avoid processing unnecessary data
   * Returns transactions in reverse chronological order (most recent first)
   */
  transform(
    data: { priceFactor: number }[],
    investmentPlan: IInvestmentPlan,
    options?: { page?: number; limit?: number }
  ): { transactions: Transaction[]; total: number } {
    const now = new Date();
    const interval = 24 * 60 * 60 * 1000; // 1 day in milliseconds
    let accumulatedInvestment = 0;

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
      endIndex = total - (page - 1) * limit;
      startIndex = Math.max(0, endIndex - limit);
    }

    // Process the required slice of data in reverse order
    const transactions = data
      .slice(startIndex, endIndex)
      .map((transaction, i) => {
        // Calculate the actual index in the full dataset
        const actualIndex = startIndex + i;
        const timestamp = Math.floor((now.getTime() - (total - actualIndex) * interval) / 1000);

        // Calculate accumulated investment up to this point
        accumulatedInvestment = investmentPlan.initialAmount * transaction.priceFactor;

        return {
          id: generateCustomId(),
          planId: investmentPlan.id,
          userId: investmentPlan.userId,
          chain: 'mock',
          amount: investmentPlan.initialAmount,
          status: 'completed',
          retryCount: 0,
          maxRetries: 0,
          lastAttemptTime: new Date(timestamp * 1000).toISOString(),
          createdAt: new Date(timestamp * 1000).toISOString(),
          updatedAt: new Date(timestamp * 1000).toISOString(),
          timestamp: timestamp,
          price: transaction.priceFactor * investmentPlan.initialAmount,
          value: accumulatedInvestment,
          type: 'buy',
          tokenSymbol: investmentPlan.tokenSymbol,
        };
      })
      .reverse(); // Reverse to get most recent first

    return { transactions, total };
  }
}
