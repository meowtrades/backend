import { generateCustomId } from '../../../utils/generators';
import { PriceData } from '../../services/price.service';
import {
  calculateMovingAverage,
  calculatePriceChangePercentage,
} from '../../strategies/s-dca/price-analysis';
import { BatchInput, PromptOutput, StrategyAdapter } from './strategy.adapter';

type Indicators = {
  movingAverage7Day: number;
  movingAverage30Day: number;
  priceChangePercentage: number;
};

export class SDCAStrategyAdapter implements StrategyAdapter {
  execute(dataPoints: PriceData[]): BatchInput[] {
    if (dataPoints.length < 30) {
      throw new Error('Not enough data points to execute strategy min 30');
    }

    return dataPoints.slice(30).map((_, i) => {
      const slicedDataPoints = dataPoints.slice(i, i + 30); // Use the last 30 data points
      const indicators = this.prepareIndicators(slicedDataPoints);
      const prompt = this.generatePrompt(indicators);
      return {
        custom_id: generateCustomId(),
        method: 'POST',
        url: '/v1/chat/completions',
        body: {
          model: 'gpt-3.5-turbo-0125',
          messages: prompt,
          max_tokens: 1000,
        },
      };
    });
  }

  prepareIndicators(dataPoints: PriceData[]): Indicators {
    const movingAverage7Day = calculateMovingAverage(dataPoints, 7);
    const movingAverage30Day = calculateMovingAverage(dataPoints, 30);
    const priceChangePercentage = calculatePriceChangePercentage(dataPoints);

    return {
      movingAverage7Day,
      movingAverage30Day,
      priceChangePercentage,
    };
  }

  generatePrompt(data: ReturnType<SDCAStrategyAdapter['prepareIndicators']>): PromptOutput {
    data.movingAverage7Day = parseFloat(data.movingAverage7Day.toFixed(4));
    data.movingAverage30Day = parseFloat(data.movingAverage30Day.toFixed(4));
    data.priceChangePercentage = parseFloat(data.priceChangePercentage.toFixed(2));

    return [
      {
        role: 'system',
        content: `You are a cryptocurrency price analyzer. Analyze the provided data and return a single number:
    
            - If price is dropping (negative price change %), return a number between 0 and 1:
              * For minimal price drops (0 to -3%), return a number close to 1 (0.7-1.0)
              * For moderate price drops (-3% to -10%), return a mid-range number (0.4-0.7)
              * For significant price drops (< -10%), return a number close to 0 (0.1-0.3)
    
            - If price is rising (positive price change %), return a number between 1 and 2:
              * For minimal price increases (0-3%), return a number close to 1 (1.0-1.3)
              * For moderate price increases (3-10%), return a mid-range number (1.4-1.7)
              * For significant price increases (>10%), return a number close to 2 (1.7-1.9)
    
            Only return the number as a JSON object with a single field called "priceFactor". Nothing else.`,
      },
      {
        role: 'user',
        content: `
            Please analyze this token data and provide a price factor:
    
            Token: USDT
            7-Day Moving Average: $${data.movingAverage7Day}
            30-Day Moving Average: $${data.movingAverage30Day}
            24-Hour Price Change: ${data.priceChangePercentage}%
            `,
      },
    ];
  }
}
