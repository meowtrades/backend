import { MockDataBatch } from '../../models/MockDataBatch';

export class ChartTransformer {
  /**
   *
   * @param data
   * @param investmentAmount
   * @param batchId
   * @returns { price: number, timestamp: number }[]
   */
  async transform(
    data: { priceFactor: number }[],
    investmentAmount: number,
    batchId: string
  ): Promise<{ price: number; timestamp: number }[]> {
    // Get the batch to access price history
    const batch = await MockDataBatch.findOne({ batchId });

    // console.log(batch);

    if (!batch) {
      throw new Error('Batch not found');
    }

    const output = [];
    let accumulatedInvestment = 0;

    for (let i = 0; i < data.length; i++) {
      const priceHistoryPoint = batch.priceHistory[i];
      if (!priceHistoryPoint) {
        throw new Error(`Price history not found for index ${i}`);
      }

      accumulatedInvestment += investmentAmount * data[i].priceFactor;
      output.push({
        price: parseFloat(accumulatedInvestment.toFixed(2)),
        timestamp: priceHistoryPoint.timestamp,
      });
    }

    return output;
  }
}
