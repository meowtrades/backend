import { SDCAStrategyAdapter } from '../mocktrade/strategies/nsdca.strategy';
import { StrategyAdapter } from '../mocktrade/strategies/strategy.adapter';

export class StrategyFactory {
  static strategies = {
    SDCA: new SDCAStrategyAdapter(),
  } as const;

  private static strategyDetails = {
    SDCA: {
      name: 'Smart Dollar Cost Averaging',
      type: 'dca',
      description:
        'DCA reduces the impact of volatility by investing fixed amounts at regular intervals, regardless of asset price.',
    },
  } as const;

  static getStrategy(strategyName: StrategyName): StrategyAdapter {
    const strategy = this.strategies[strategyName];

    if (!strategy) {
      throw new Error(`Strategy ${strategyName} not found`);
    }

    return strategy;
  }

  static getStrategyDetails(strategyName: StrategyName) {
    return this.strategyDetails[strategyName];
  }
}

export type StrategyName = keyof typeof StrategyFactory.strategies;
