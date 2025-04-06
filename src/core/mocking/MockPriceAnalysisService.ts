import axios from 'axios';
import { AnalysisResult } from './priceAnalysisService';
import { RiskLevel } from '../../models/InvestmentPlan';
import { logger } from '../../utils/logger';

interface PriceData {
  date: string;
  timestamp: number;
  price: number;
}
async function fetchHistoricalPrices(tokenId: string, days: number = 30): Promise<PriceData[]> {
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

function calculateMovingAverage(prices: PriceData[], period: number): number {
  if (prices.length < period) {
    throw new Error('Not enough price data to calculate moving average');
  }

  const recentPrices = prices.slice(-period);
  const sum = recentPrices.reduce((acc, data) => acc + data.price, 0);
  return sum / period;
}

function calculatePriceChangePercentage(prices: PriceData[]): number {
  if (prices.length < 2) {
    throw new Error('Not enough price data to calculate price change');
  }
  const sortedPrices = [...prices].sort((a, b) => a.timestamp - b.timestamp);
  const latestPrice = sortedPrices[sortedPrices.length - 1];
  const oneDayMs = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  const targetTimestamp = latestPrice.timestamp - oneDayMs;
  // Find the price data point closest to 24 hours ago
  let closestPricePoint = sortedPrices[0];
  let smallestDiff = Math.abs(sortedPrices[0].timestamp - targetTimestamp);
  for (let i = 1; i < sortedPrices.length; i++) {
    const diff = Math.abs(sortedPrices[i].timestamp - targetTimestamp);
    if (diff < smallestDiff) {
      smallestDiff = diff;
      closestPricePoint = sortedPrices[i];
    }
  }
  // Calculate percentage change using true 24-hour window
  const percentageChange = ((latestPrice.price - closestPricePoint.price) / closestPricePoint.price) * 100
  return percentageChange;
}
// This function implements the OpenAI prompt logic
function simulateGptPriceFactor(tokenId: string, movingAverage7Day: number, movingAverage30Day: number, priceChangePercentage: number): number {
  // Implementing the exact logic from the GPT prompt
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
export async function mockAnalyzeTokenPrice(tokenId: string): Promise<AnalysisResult> {
  try {
    // Fetch actual historical price data
    const priceData = await fetchHistoricalPrices(tokenId, 31);
    
    const movingAverage7Day = calculateMovingAverage(priceData, 7);
    const movingAverage30Day = calculateMovingAverage(priceData, Math.min(30, priceData.length));
    // Calculate price change percentage using 24-hour rolling window
    const priceChangePercentage = calculatePriceChangePercentage(priceData);
    const isPriceGoingUp = priceChangePercentage > 0;
    // Use our GPT simulation function instead of the actual OpenAI API
    const priceFactor = simulateGptPriceFactor(
      tokenId,
      movingAverage7Day,
      movingAverage30Day,
      priceChangePercentage
    );
    
    logger.info(`Price analysis for ${tokenId}: 
      7-Day MA: ${movingAverage7Day.toFixed(4)}
      30-Day MA: ${movingAverage30Day.toFixed(4)}
      24h Change: ${priceChangePercentage.toFixed(2)}%
      Trend: ${isPriceGoingUp ? 'Up' : 'Down'}
      Price Factor: ${priceFactor.toFixed(4)}`);
    
    return {
      movingAverage7Day,
      movingAverage30Day,
      priceChangePercentage,
      priceFactor,
      isPriceGoingUp
    };
  } catch (error) {
    logger.error('Error analyzing token price:', error);
    // Default to a neutral factor if analysis fails
    return {
      movingAverage7Day: 0,
      movingAverage30Day: 0,
      priceChangePercentage: 0,
      priceFactor: 1.0, // Neutral factor
      isPriceGoingUp: false
    };
  }
}

export function mockGetRiskMultiplier(riskLevel: RiskLevel): number {
  switch (riskLevel) {
    case RiskLevel.NO_RISK:
      return 1.0;
    case RiskLevel.LOW_RISK:
      return 1.2;
    case RiskLevel.MEDIUM_RISK:
      return 1.5;
    case RiskLevel.HIGH_RISK:
      return 2.0;
    default:
      return 1.0;
  }
}