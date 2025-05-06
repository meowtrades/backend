/**
 *
 */
export class TokensRepository {
  static tokens = {
    USDT: 'Tether',
    BTC: 'Bitcoin',
    ETH: 'Ethereum',
  };
}

export type TokenName = keyof typeof TokensRepository.tokens;
