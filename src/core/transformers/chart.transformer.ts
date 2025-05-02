import { PriceData } from '../services/price.service';

export class SDCAChartTransformer {
  /**
   *
   * @param data
   * @param priceData
   * @param investmentAmount
   * @returns { investment: number, timestamp: string }[]
   */
  transform(data: { priceFactor: number }[], priceData: PriceData[], investmentAmount: number) {
    return data.map((item, index) => {
      const price = priceData[index]?.price || 0;
      const investment = item.priceFactor * investmentAmount * price;

      return {
        investment,
        timestamp: new Date(priceData[index]?.timestamp * 1000).toISOString(),
      };
    });
  }
}
