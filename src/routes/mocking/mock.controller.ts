import { AnalysisResult } from '../../core/mocking/priceAnalysisService';
import { RiskLevel } from '../../models/InvestmentPlan';
import { PriceService } from '../../core/services/price.service';
import { logger } from '../../utils/logger';

export class MockController {
  private priceService: PriceService;

  constructor() {
    this.priceService = new PriceService();
  }

  async analyzeTokenPrice(tokenId: string): Promise<AnalysisResult> {
    try {
      // Fetch actual historical price data
      const priceData = await this.priceService.fetchHistoricalPrices(tokenId, 31);
      
      const movingAverage7Day = this.priceService.calculateMovingAverage(priceData, 7);
      const movingAverage30Day = this.priceService.calculateMovingAverage(priceData, Math.min(30, priceData.length));
      const priceChangePercentage = this.priceService.calculatePriceChangePercentage(priceData);
      const isPriceGoingUp = priceChangePercentage > 0;
      
      const priceFactor = this.priceService.simulateGptPriceFactor(
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

  getRiskMultiplier(riskLevel: RiskLevel): number {
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
} 