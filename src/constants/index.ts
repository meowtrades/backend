// Injective Chain Constants
export const INJECTIVE_CONSTANTS = {
  CONTRACT_ADDRESS: 'inj1wdx4lnl4amctfgwgujhepf7tjn3ygk37a3sgfj',
  USDT_DENOM: 'peggy0x87aB3B4C8661e07D6372361211B96ed4Dc36B1B5',
  INJ_DENOM: 'inj',
};

// Aptos Chain Constants
export const APTOS_CONSTANTS = {
  CONTRACT_ADDRESS: '0xa5d3ac4d429052674ed38adc62d010e52d7c24ca159194d17ddc196ddb7e480b',
  USDC_ADDRESS:
    '0x498d8926f16eb9ca90cab1b3a26aa6f97a080b3fcbe6e83ae150b7243a00fb68::devnet_coins::DevnetUSDC',
  APT_ADDRESS: '0x1::aptos_coin::AptosCoin',
};

// Sonic Chain Constants
export const SONIC_CONSTANTS = {
  PROGRAM_ID: 'HoGLe4rmFQ25oNNiRQ4rueYsKzEJdnoLFhoVtafjcC66',
  POOL_ACCOUNT: 'BbLDYff58ov1rBPgjyoUPXPpDc5wn57Y2qyoYXdBuMVK',
  USDC_MINT: '7kdH6DvwPSxov7pGUrDwta6CNsosZuH1HVbxSdLH57AU',
  SONIC_MINT: '8GgYcsRw6WCtAXvcuvLmeHH3jA6WAMrecXQu3UcMRTQ6',
  RPC_ENDPOINT: 'https://api.testnet.sonic.game',
};

export const CHAIN_TO_TOKEN_ID: Record<string, string> = {
  injective: 'injective-protocol',
  aptos: 'aptos',
  sonic: 'sonic-svm',
};

// =====================================
// Composable Token System
// =====================================

// Token interfaces
export interface TokenInfo {
  symbol: string;
  name: string;
  decimals: number;
  coingeckoId?: string; // For price data
  logo?: string;
  isStablecoin?: boolean;
}

export interface ChainTokenInfo extends TokenInfo {
  address: string; // Chain-specific address/identifier
  isNative?: boolean;
}

// Token Lists by Chain
interface TokenList {
  [tokenSymbol: string]: TokenInfo;
}

export interface ChainTokenList {
  [chainId: string]: {
    [tokenSymbol: string]: ChainTokenInfo;
  };
}

// Base token definitions (chain-agnostic)
export const TOKENS: TokenList = {
  BTC: {
    symbol: 'BTC',
    name: 'Bitcoin',
    decimals: 8,
    coingeckoId: 'bitcoin',
    logo: 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png',
  },
  ETH: {
    symbol: 'ETH',
    name: 'Ethereum',
    decimals: 18,
    coingeckoId: 'ethereum',
    logo: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png',
  },
  USDT: {
    symbol: 'USDT',
    name: 'Tether',
    decimals: 6,
    coingeckoId: 'tether',
    logo: 'https://assets.coingecko.com/coins/images/325/small/Tether.png',
    isStablecoin: true,
  },
  USDC: {
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    coingeckoId: 'usd-coin',
    logo: 'https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png',
    isStablecoin: true,
  },
  INJ: {
    symbol: 'INJ',
    name: 'Injective',
    decimals: 18,
    coingeckoId: 'injective-protocol',
    logo: 'https://assets.coingecko.com/coins/images/12220/small/injective-protocol.png',
  },
  APT: {
    symbol: 'APT',
    name: 'Aptos',
    decimals: 8,
    coingeckoId: 'aptos',
    logo: 'https://assets.coingecko.com/coins/images/26455/small/apt.png',
  },
  SONIC: {
    symbol: 'SONIC',
    name: 'Sonic',
    decimals: 9,
    coingeckoId: 'sonic-svm',
    logo: 'https://assets.coingecko.com/coins/images/30493/small/Sonic_logomark.png',
  },
};

// Chain-specific token configurations
export const CHAIN_TOKENS: ChainTokenList = {
  ethereum: {
    ETH: {
      ...TOKENS.ETH,
      address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', // Special address for native ETH
      isNative: true,
    },
    USDT: {
      ...TOKENS.USDT,
      address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', // Ethereum mainnet USDT
    },
    USDC: {
      ...TOKENS.USDC,
      address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // Ethereum mainnet USDC
    },
  },
  polygon: {
    MATIC: {
      symbol: 'MATIC',
      name: 'Polygon',
      decimals: 18,
      coingeckoId: 'polygon',
      logo: 'https://assets.coingecko.com/coins/images/4713/small/polygon.png',
      address: '0x0000000000000000000000000000000000001010',
      isNative: true,
    },
    USDT: {
      ...TOKENS.USDT,
      address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', // Polygon mainnet USDT
    },
    USDC: {
      ...TOKENS.USDC,
      address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', // Polygon mainnet USDC
    },
  },
  injective: {
    INJ: {
      ...TOKENS.INJ,
      address: INJECTIVE_CONSTANTS.INJ_DENOM,
      isNative: true,
    },
    USDT: {
      ...TOKENS.USDT,
      address: INJECTIVE_CONSTANTS.USDT_DENOM,
    },
  },
  aptos: {
    APT: {
      ...TOKENS.APT,
      address: APTOS_CONSTANTS.APT_ADDRESS,
      isNative: true,
    },
    USDC: {
      ...TOKENS.USDC,
      address: APTOS_CONSTANTS.USDC_ADDRESS,
    },
  },
  sonic: {
    SONIC: {
      ...TOKENS.SONIC,
      address: SONIC_CONSTANTS.SONIC_MINT,
      isNative: true,
    },
    USDC: {
      ...TOKENS.USDC,
      address: SONIC_CONSTANTS.USDC_MINT,
    },
  },
};

// Helper functions for token management
export const getSupportedChains = (): string[] => {
  return Object.keys(CHAIN_TOKENS);
};

export const getSupportedTokens = (): string[] => {
  return Object.keys(TOKENS);
};

export const getTokensForChain = (chainId: string): ChainTokenInfo[] => {
  const chainTokens = CHAIN_TOKENS[chainId];
  return chainTokens ? Object.values(chainTokens) : [];
};

export const isTokenSupportedOnChain = (chainId: string, tokenSymbol: string): boolean => {
  return !!(CHAIN_TOKENS[chainId] && CHAIN_TOKENS[chainId][tokenSymbol]);
};

export const getTokenInfoForChain = (
  chainId: string,
  tokenSymbol: string
): ChainTokenInfo | null => {
  if (isTokenSupportedOnChain(chainId, tokenSymbol)) {
    return CHAIN_TOKENS[chainId][tokenSymbol];
  }
  return null;
};

export const getNativeTokenForChain = (chainId: string): ChainTokenInfo | null => {
  const chainTokens = CHAIN_TOKENS[chainId];
  if (!chainTokens) return null;

  const nativeToken = Object.values(chainTokens).find(token => token.isNative);
  return nativeToken || null;
};

export const getStablecoinsForChain = (chainId: string): ChainTokenInfo[] => {
  const chainTokens = CHAIN_TOKENS[chainId];
  if (!chainTokens) return [];

  return Object.values(chainTokens).filter(token => token.isStablecoin);
};
