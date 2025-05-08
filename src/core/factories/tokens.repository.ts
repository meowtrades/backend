/**
 *
 */
export class TokensRepository {
  static tokens = {
    USDT: 'Tether',
    BTC: 'Bitcoin',
    ETH: 'Ethereum',
  };

  static validateAndGetToken(tokenName: string): TokenName {
    const token = this.tokens[tokenName as TokenName];

    if (!token) {
      throw new Error(`Token ${tokenName} not found`);
    }

    return tokenName as TokenName;
  }
}

export type TokenName = keyof typeof TokensRepository.tokens;
