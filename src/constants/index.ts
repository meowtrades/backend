// Injective Chain Constants
export const INJECTIVE_CONSTANTS = {
    CONTRACT_ADDRESS: 'inj1wdx4lnl4amctfgwgujhepf7tjn3ygk37a3sgfj',
    USDT_DENOM: 'peggy0x87aB3B4C8661e07D6372361211B96ed4Dc36B1B5',
    INJ_DENOM: 'inj'
};

// Aptos Chain Constants
export const APTOS_CONSTANTS = {
    CONTRACT_ADDRESS: '0xa5d3ac4d429052674ed38adc62d010e52d7c24ca159194d17ddc196ddb7e480b',
    USDC_ADDRESS: '0x498d8926f16eb9ca90cab1b3a26aa6f97a080b3fcbe6e83ae150b7243a00fb68::devnet_coins::DevnetUSDC',
    APT_ADDRESS: '0x1::aptos_coin::AptosCoin'
};

// Sonic Chain Constants
export const SONIC_CONSTANTS = {
    PROGRAM_ID: 'HoGLe4rmFQ25oNNiRQ4rueYsKzEJdnoLFhoVtafjcC66',
    POOL_ACCOUNT: 'BbLDYff58ov1rBPgjyoUPXPpDc5wn57Y2qyoYXdBuMVK',
    USDC_MINT: '7kdH6DvwPSxov7pGUrDwta6CNsosZuH1HVbxSdLH57AU',
    SONIC_MINT: '8GgYcsRw6WCtAXvcuvLmeHH3jA6WAMrecXQu3UcMRTQ6',
    RPC_ENDPOINT: 'https://api.testnet.sonic.game'
};

export const CHAIN_TO_TOKEN_ID: Record<string, string> = {
    'injective': 'injective-protocol',
    'aptos': 'aptos',
    'sonic': 'sonic-svm'
};