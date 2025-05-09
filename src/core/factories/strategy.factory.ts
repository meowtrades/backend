import { SDCAStrategyAdapter } from '../mocktrade/strategies/nsdca.strategy';
import { StrategyAdapter } from '../mocktrade/strategies/strategy.adapter';

export class StrategyFactory {
  static strategies = {
    SDCA: new SDCAStrategyAdapter(),
  } as const;

  private static strategyNames = {
    SDCA: 'Smart Dollar Cost Averaging',
  } as const;

  static getStrategy(strategyName: StrategyName): StrategyAdapter {
    const strategy = this.strategies[strategyName];

    if (!strategy) {
      throw new Error(`Strategy ${strategyName} not found`);
    }

    return strategy;
  }

  static getStrategyName(strategyId: StrategyName): string {
    return this.strategyNames[strategyId];
  }
}

export type StrategyName = keyof typeof StrategyFactory.strategies;
