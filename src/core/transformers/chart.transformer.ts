import { PriceData } from '../services/price.service';

export class SDCAChartTransformer {
  /**
   *
   * We don't have a timestamp field, right now, there is a 1D interval
   * between each data point so generate a timestamp based on the index
   * The oldest data point will be 90D ago and the most recent will be now or yesterday
   *
   * @param data
   * @param priceData
   * @param investmentAmount
   * @returns { investment: number, timestamp: string }[]
   */
  transform(
    data: { priceFactor: number }[],
    investmentAmount: number
  ): { price: number; timestamp: number }[] {
    const output = [];
    const now = new Date();
    const interval = 24 * 60 * 60 * 1000; // 1 day in milliseconds

    for (let i = 0; i < data.length; i++) {
      const dataPoint: PriceData = {
        date: new Date(now.getTime() - (data.length - i) * interval).toISOString(),
        price: data[i].priceFactor,
        timestamp: Math.floor((now.getTime() - (data.length - i) * interval) / 1000),
      };
      output.push({
        price: parseFloat((investmentAmount * dataPoint.price).toFixed(2)),
        timestamp: dataPoint.timestamp,
      });
    }

    return output;
  }
}
