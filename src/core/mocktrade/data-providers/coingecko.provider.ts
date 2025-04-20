import { DataProviderInterface, Interval } from './provider.interface';
import axios from 'axios'; // Import axios for HTTP requests

export interface FetchedDataPoint {
  timestamp: Date;
  price: number;
  executionDetails: {
    calculatedAmount: number;
    riskLevel: string;
    transactionHash?: string;
  };
  analysisMetadata: {
    priceTrend: 'up' | 'down';
    priceFactor: number;
  };
}

/**
 * CoinGeckoDataProvider class implements the DataProviderInterface.
 * It is responsible for fetching data from the CoinGecko API.
 */
export class CoinGeckoDataProvider implements DataProviderInterface {
  async fetchData(
    tokenSymbol: string, // e.g. "USDT"
    interval: Interval, // resolution of data points
    startTime: Date,
    endTime: Date,
    chainId?: string // optional for non-chain-specific providers like CoinGecko
  ): Promise<FetchedDataPoint[]> {
    const baseUrl = 'https://api.coingecko.com/api/v3/coins';
    const vsCurrency = 'usd'; // Assuming USD as the base currency
    const fromTimestamp = Math.floor(startTime.getTime() / 1000);
    const toTimestamp = Math.floor(endTime.getTime() / 1000);

    try {
      const response = await axios.get(
        `${baseUrl}/${tokenSymbol.toLowerCase()}/market_chart/range`,
        {
          params: {
            vs_currency: vsCurrency,
            from: fromTimestamp,
            to: toTimestamp,
          },
        }
      );

      const prices = response.data.prices.map((price: [number, number]) => {
        const timestamp = new Date(price[0]);
        const priceValue = price[1];

        // Mock execution details and analysis metadata
        const calculatedAmount = priceValue * 0.1; // Example calculation
        const riskLevel = 'medium'; // Example risk level
        const priceTrend = Math.random() > 0.5 ? 'up' : 'down'; // Mock trend
        const priceFactor = Math.random(); // Mock price factor

        return {
          timestamp,
          price: priceValue,
          executionDetails: {
            calculatedAmount,
            riskLevel,
            transactionHash: undefined, // To be filled after execution
          },
          analysisMetadata: {
            priceTrend,
            priceFactor,
          },
        };
      });

      return prices;
    } catch (error) {
      console.error('Error fetching data from CoinGecko:', error);
      throw new Error('Failed to fetch data from CoinGecko API');
    }
  }
}
