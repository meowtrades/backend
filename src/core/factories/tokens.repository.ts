/**
 * @description This is a repository for tokens. It is used to validate and get a token name.
 */
export class TokenRepository {
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

  static getTokenName(tokenSymbol: string): string {
    return this.tokens[tokenSymbol as TokenName];
  }
}

export type TokenName = keyof typeof TokenRepository.tokens;
