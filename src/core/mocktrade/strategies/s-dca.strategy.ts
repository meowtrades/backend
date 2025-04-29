import {
  AnalysisResult,
  calculatePriceAnalysis,
  getRiskMultiplier,
  PriceData,
} from '../../strategies/s-dca/price-analysis';
import { Strategy } from '../../strategies/strategies.interface';
import { RiskLevel } from '../../types';

export class SDCAStrategy implements Strategy {
  async executePlan(
    dataPoints: PriceData[],
    initialAmount: number,
    amount: number,
    risk: RiskLevel
  ): Promise<number> {
    let executionAmount = amount;
    const analysis = await calculatePriceAnalysis(dataPoints, '');

    // Get risk multiplier based on user's selected risk level
    const riskMultiplier = getRiskMultiplier(risk);

    // Calculate updated amount based on risk level
    const updatedAmount = initialAmount * riskMultiplier;

    // Calculate the random number component based on price factor
    const randomNumber = (updatedAmount - initialAmount) * analysis.priceFactor;

    // Apply the formula based on price trend
    if (analysis.isPriceGoingUp) {
      // If price going up: FP = UA - RN
      executionAmount = updatedAmount - randomNumber;
    } else {
      // If price going down: FP = UA + RN
      executionAmount = updatedAmount + randomNumber;
    }

    return executionAmount;
  }
}
