import axios from 'axios';
import { logger } from '../../utils/logger';

export interface PriceData {
  date: string;
  timestamp: number;
  price: number;
}

export class PriceService {
  async fetchHistoricalPrices(tokenId: string, days: number = 30): Promise<PriceData[]> {
    try {
      const response = await axios.get(`https://api.coingecko.com/api/v3/coins/${tokenId}/market_chart`, {
        params: {
          vs_currency: 'usd',
          days: days,
        },
      });
  
      const data = response.data as { prices: [number, number][] };
      return data.prices.map((item: [number, number]) => ({
        date: new Date(item[0]).toISOString(),
        timestamp: item[0],
        price: item[1],
      }));
    } catch (error) {
      logger.error('Error fetching historical prices:', error);
      throw new Error('Failed to fetch historical prices');
    }
  }

  calculateMovingAverage(prices: PriceData[], period: number): number {
    if (prices.length < period) {
      throw new Error('Not enough price data to calculate moving average');
    }
  
    const recentPrices = prices.slice(-period);
    const sum = recentPrices.reduce((acc, data) => acc + data.price, 0);
    return sum / period;
  }

  calculatePriceChangePercentage(prices: PriceData[]): number {
    if (prices.length < 2) {
      throw new Error('Not enough price data to calculate price change');
    }
    const sortedPrices = [...prices].sort((a, b) => a.timestamp - b.timestamp);
    const latestPrice = sortedPrices[sortedPrices.length - 1];
    const oneDayMs = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    const targetTimestamp = latestPrice.timestamp - oneDayMs;
    
    let closestPricePoint = sortedPrices[0];
    let smallestDiff = Math.abs(sortedPrices[0].timestamp - targetTimestamp);
    
    for (let i = 1; i < sortedPrices.length; i++) {
      const diff = Math.abs(sortedPrices[i].timestamp - targetTimestamp);
      if (diff < smallestDiff) {
        smallestDiff = diff;
        closestPricePoint = sortedPrices[i];
      }
    }
    
    const percentageChange = ((latestPrice.price - closestPricePoint.price) / closestPricePoint.price) * 100;
    return percentageChange;
  }

  simulateGptPriceFactor(tokenId: string, movingAverage7Day: number, movingAverage30Day: number, priceChangePercentage: number): number {
    const isPriceGoingUp = priceChangePercentage > 0;
    let priceFactor: number;
    
    if (isPriceGoingUp) {
      if (priceChangePercentage < 3) {
        priceFactor = 1.0 + (priceChangePercentage / 10);
      } else if (priceChangePercentage < 10) {
        priceFactor = 1.4 + ((priceChangePercentage - 3) / 23.33);
      } else {
        priceFactor = 1.7 + Math.min((priceChangePercentage - 10) / 50, 0.2);
      }
    } else {
      const absChange = Math.abs(priceChangePercentage);
      if (absChange < 3) {
        priceFactor = 1.0 - (absChange / 10);
      } else if (absChange < 10) {
        priceFactor = 0.7 - ((absChange - 3) / 23.33);
      } else {
        priceFactor = 0.3 - Math.min((absChange - 10) / 50, 0.2);
      }
    }
    
    logger.info(`Simulated GPT analysis for ${tokenId}: Price factor = ${priceFactor.toFixed(4)}, Price trend: ${isPriceGoingUp ? 'Up' : 'Down'}`);
    return priceFactor;
  }
} 