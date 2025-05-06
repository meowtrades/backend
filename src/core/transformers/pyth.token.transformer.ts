import { TokenName } from '../factories/tokens.factory';

/**
 * Converts standard token symbol into something
 * that can be used by the Pyth provider.
 */
export class PythTokenTransformer {
  static symbols = {
    USDT: 'Crypto.USDT/USD',
    BTC: 'Crypto.BTC/USD',
    ETH: 'Crypto.ETH/USD',
  } as const;

  /**
   * Transforms the token symbol into a Pyth token symbol.
   */
  static transform(tokenSymbol: TokenName): PythToken {
    const transformedSymbol = this.symbols[tokenSymbol];

    if (!transformedSymbol) {
      throw new Error(`Token symbol ${tokenSymbol} not found`);
    }

    return transformedSymbol;
  }
}

type PythToken = (typeof PythTokenTransformer)['symbols'][TokenName];
