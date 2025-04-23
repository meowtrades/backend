import { FetchedData } from '../mocktrade/mock.fetcher';
import { RiskLevel } from '../types';
import { PriceData } from './s-dca/price-analysis';

export type StrategyOutput = any;

export interface Strategy {
  /**
   * Executes the strategy plan based on the provided data points and initial amount.
   * @param dataPoints - The price data points to analyze. Typically data of past 30 days.
   * @param initialAmount - The initial amount to be used in the strategy.
   * @param amount - The amount to be executed in the strategy.
   * @returns A promise that resolves to the output of the strategy execution.
   */
  executePlan(
    dataPoints: PriceData[],
    initialAmount: number,
    amount: number,
    risk: RiskLevel
  ): Promise<StrategyOutput>;
}
