import { SDCAStrategyAdapter } from '../mocktrade/strategies/nsdca.strategy';
import { StrategyAdapter } from '../mocktrade/strategies/strategy.adapter';

export class StrategyFactory {
  static strategies = {
    SDCA: new SDCAStrategyAdapter(),
  } as const;

  static getStrategy(strategyName: StrategyName): StrategyAdapter {
    const strategy = this.strategies[strategyName];

    if (!strategy) {
      throw new Error(`Strategy ${strategyName} not found`);
    }

    return strategy;
  }
}

export type StrategyName = keyof typeof StrategyFactory.strategies;
