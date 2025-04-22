import {
  AnalysisResult,
  calculatePriceAnalysis,
  PriceData,
} from '../../strategies/s-dca/price-analysis';
import { Strategy } from '../../strategies/strategies.interface';
import { FetchedData } from '../mock.fetcher';

export class SDCAStrategy implements Strategy {
  async executePlan(dataPoints: PriceData[]) {
    const out: AnalysisResult[] = [];

    const data = await calculatePriceAnalysis(dataPoints, '');

    console.log(out);

    return data;
  }
}
