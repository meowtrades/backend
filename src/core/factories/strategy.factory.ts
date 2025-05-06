import { SDCAStrategyAdapter } from '../mocktrade/strategies/nsdca.strategy';
import { StrategyAdapter } from '../mocktrade/strategies/strategy.adapter';

export class StrategyFactory {
  static strategies = {
    SDCA: new SDCAStrategyAdapter(),
  };

  static getStrategy(strategyName: keyof typeof StrategyFactory.strategies): StrategyAdapter {
    const strategy = this.strategies[strategyName];

    if (!strategy) {
      throw new Error(`Strategy ${strategyName} not found`);
    }

    return strategy;
  }
}
