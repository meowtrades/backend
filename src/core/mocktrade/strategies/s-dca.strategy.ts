import {
  AnalysisResult,
  calculatePriceAnalysis,
  getRiskMultiplier,
  PriceData,
} from '../../strategies/s-dca/price-analysis';
import { Strategy } from '../../strategies/strategies.interface';
import { RiskLevel } from '../../types';
import { FetchedData } from '../mock.fetcher';

export class SDCAStrategy implements Strategy {
  async executePlan(dataPoints: PriceData[], initialAmount: number, amount: number) {
    const out: AnalysisResult[] = [];
    let executionAmount = amount;
    const analysis = await calculatePriceAnalysis(dataPoints, '');

    // const analysis = await analyzeTokenPrice(plan.chain);
    //         logger.info(`Price analysis for plan ${plan._id}:`, analysis);

    // Get risk multiplier based on user's selected risk level
    const riskMultiplier = getRiskMultiplier(RiskLevel.HIGH_RISK);

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
