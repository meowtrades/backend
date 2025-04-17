import { UserBalance, IUserBalance } from '../../models/UserBalance';
import mongoose from 'mongoose';
import { ethers } from 'ethers'; // Using ethers.js for safe math operations
import {
  getTokenInfoForChain,
  getSupportedChains,
  getNativeTokenForChain,
  isTokenSupportedOnChain,
  ChainTokenInfo,
  CHAIN_TOKENS,
  ChainTokenList,
} from '../../constants';

// Define a mapping of supported chains with index signature
interface ChainInfo {
  id: string;
  name: string;
  symbol: string;
  decimals: number;
}

interface SupportedChains {
  [key: string]: ChainInfo;
}

// Create chain info object from supported chains
const SUPPORTED_CHAINS: SupportedChains = {};
getSupportedChains().forEach(chainId => {
  const nativeToken = getNativeTokenForChain(chainId);
  if (nativeToken) {
    SUPPORTED_CHAINS[chainId] = {
      id: chainId,
      name: nativeToken.name,
      symbol: nativeToken.symbol,
      decimals: nativeToken.decimals,
    };
  }
});

/**
 * Initialize or get a user's balance record
 */
export const getUserBalanceRecord = async (userId: string): Promise<IUserBalance> => {
  let userBalance = await UserBalance.findOne({ userId });

  if (!userBalance) {
    // Create a new balance record for the user with zero balances for all supported tokens on all chains
    const initialBalances: {
      chainId: string;
      tokenSymbol: string;
      balance: string;
      lastUpdated: Date;
    }[] = [];

    // For each chain, add a balance entry for each supported token
    Object.keys(CHAIN_TOKENS).forEach(chainId => {
      const chainTokens = CHAIN_TOKENS[chainId];
      Object.keys(chainTokens).forEach(tokenSymbol => {
        initialBalances.push({
          chainId,
          tokenSymbol,
          balance: tokenSymbol === 'USDT' ? '500' : '0',
          lastUpdated: new Date(),
        });
      });

      // Also add native token if not already included
      const nativeToken = getNativeTokenForChain(chainId);
      if (nativeToken && !Object.keys(chainTokens).includes(nativeToken.symbol)) {
        initialBalances.push({
          chainId,
          tokenSymbol: nativeToken.symbol,
          balance: '0',
          lastUpdated: new Date(),
        });
      }
    });

    userBalance = await UserBalance.create({
      userId,
      balances: initialBalances,
      allocations: [],
      totalDeposited: '0',
      totalWithdrawn: '0',
      lastUpdated: new Date(),
    });
  }

  return userBalance;
};

/**
 * Process a user deposit
 */
export const processDeposit = async (
  userId: string,
  chainId: string,
  amount: string,
  txHash: string,
  tokenSymbol?: string // Optional - default to native token if not specified
): Promise<IUserBalance> => {
  if (!SUPPORTED_CHAINS[chainId]) {
    throw new Error(`Chain ${chainId} is not supported`);
  }

  // If tokenSymbol is provided, verify it's supported on this chain
  if (tokenSymbol && !isTokenSupportedOnChain(chainId, tokenSymbol)) {
    throw new Error(`Token ${tokenSymbol} is not supported on chain ${chainId}`);
  }

  // Get the token info - use native token if not specified
  const tokenInfo = tokenSymbol
    ? getTokenInfoForChain(chainId, tokenSymbol)
    : getNativeTokenForChain(chainId);

  if (!tokenInfo) {
    throw new Error(
      `Unable to get token information for ${tokenSymbol || 'native token'} on chain ${chainId}`
    );
  }

  const userBalance = await getUserBalanceRecord(userId);
  const actualTokenSymbol = tokenInfo.symbol;

  // Find the specific token balance for this chain
  const tokenBalance = userBalance.balances.find(
    b => b.chainId === chainId && b.tokenSymbol === actualTokenSymbol
  );

  if (tokenBalance) {
    // Update existing balance
    const currentBalance = ethers.BigNumber.from(tokenBalance.balance);
    const depositAmount = ethers.BigNumber.from(amount);
    tokenBalance.balance = currentBalance.add(depositAmount).toString();
    tokenBalance.lastUpdated = new Date();
  } else {
    // Add new token balance
    userBalance.balances.push({
      chainId,
      tokenSymbol: actualTokenSymbol,
      balance: amount,
      lastUpdated: new Date(),
    });
  }

  // Update total deposited
  const totalDeposited = ethers.BigNumber.from(userBalance.totalDeposited);
  userBalance.totalDeposited = totalDeposited.add(ethers.BigNumber.from(amount)).toString();
  userBalance.lastUpdated = new Date();

  // Save the updated balance
  await userBalance.save();

  return userBalance;
};

/**
 * Process a user withdrawal
 */
export const processWithdrawal = async (
  userId: string,
  chainId: string,
  amount: string,
  destinationAddress: string,
  tokenSymbol?: string // Optional - default to native token if not specified
): Promise<{ success: boolean; txHash?: string; error?: string }> => {
  if (!SUPPORTED_CHAINS[chainId]) {
    throw new Error(`Chain ${chainId} is not supported`);
  }

  // If tokenSymbol is provided, verify it's supported on this chain
  if (tokenSymbol && !isTokenSupportedOnChain(chainId, tokenSymbol)) {
    throw new Error(`Token ${tokenSymbol} is not supported on chain ${chainId}`);
  }

  // Get the token info - use native token if not specified
  const tokenInfo = tokenSymbol
    ? getTokenInfoForChain(chainId, tokenSymbol)
    : getNativeTokenForChain(chainId);

  if (!tokenInfo) {
    throw new Error(
      `Unable to get token information for ${tokenSymbol || 'native token'} on chain ${chainId}`
    );
  }

  const userBalance = await getUserBalanceRecord(userId);
  const actualTokenSymbol = tokenInfo.symbol;

  // Find the specific token balance for this chain
  const tokenBalance = userBalance.balances.find(
    b => b.chainId === chainId && b.tokenSymbol === actualTokenSymbol
  );

  if (!tokenBalance) {
    return {
      success: false,
      error: `No balance found for token ${actualTokenSymbol} on chain ${chainId}`,
    };
  }

  // Check if the user has sufficient balance
  const currentBalance = ethers.BigNumber.from(tokenBalance.balance);
  const withdrawalAmount = ethers.BigNumber.from(amount);

  if (currentBalance.lt(withdrawalAmount)) {
    return { success: false, error: 'Insufficient balance' };
  }

  // TODO: Call blockchain service to initiate the actual transfer
  // const transferResult = await blockchainService.transfer(
  //   chainId,
  //   tokenInfo.address,
  //   destinationAddress,
  //   amount
  // );

  // For now, mock a successful transfer
  const mockTxHash = `0x${Array(64)
    .fill(0)
    .map(() => Math.floor(Math.random() * 16).toString(16))
    .join('')}`;

  // Update user's balance
  tokenBalance.balance = currentBalance.sub(withdrawalAmount).toString();
  tokenBalance.lastUpdated = new Date();

  // Update total withdrawn
  const totalWithdrawn = ethers.BigNumber.from(userBalance.totalWithdrawn);
  userBalance.totalWithdrawn = totalWithdrawn.add(withdrawalAmount).toString();
  userBalance.lastUpdated = new Date();

  // Save the updated balance
  await userBalance.save();

  return { success: true, txHash: mockTxHash };
};

/**
 * Allocate funds to a strategy
 */
export const allocateToStrategy = async (
  userId: string,
  chainId: string,
  amount: string,
  strategyId: string,
  tokenSymbol?: string // Optional - default to native token if not specified
): Promise<{ success: boolean; allocation?: any; error?: string }> => {
  if (!SUPPORTED_CHAINS[chainId]) {
    throw new Error(`Chain ${chainId} is not supported`);
  }

  // If tokenSymbol is provided, verify it's supported on this chain
  if (tokenSymbol && !isTokenSupportedOnChain(chainId, tokenSymbol)) {
    throw new Error(`Token ${tokenSymbol} is not supported on chain ${chainId}`);
  }

  // Get the token info - use native token if not specified
  const tokenInfo = tokenSymbol
    ? getTokenInfoForChain(chainId, tokenSymbol)
    : getNativeTokenForChain(chainId);

  if (!tokenInfo) {
    throw new Error(
      `Unable to get token information for ${tokenSymbol || 'native token'} on chain ${chainId}`
    );
  }

  const userBalance = await getUserBalanceRecord(userId);
  const actualTokenSymbol = tokenInfo.symbol;

  // Find the specific token balance for this chain
  const tokenBalance = userBalance.balances.find(
    b => b.chainId === chainId && b.tokenSymbol === actualTokenSymbol
  );

  if (!tokenBalance) {
    return {
      success: false,
      error: `No balance found for token ${actualTokenSymbol} on chain ${chainId}`,
    };
  }

  // Check if the user has sufficient balance
  const currentBalance = ethers.BigNumber.from(tokenBalance.balance);
  const allocationAmount = ethers.BigNumber.from(amount);

  if (currentBalance.lt(allocationAmount)) {
    return { success: false, error: 'Insufficient balance' };
  }

  // Create a new allocation
  const newAllocation = {
    chainId,
    strategyId,
    amount,
    status: 'active' as const,
    startDate: new Date(),
    tokenSymbol: actualTokenSymbol, // Store the token symbol for this allocation
    tokenAddress: tokenInfo.address, // Store the token address
  };

  // Update user's balance
  tokenBalance.balance = currentBalance.sub(allocationAmount).toString();
  tokenBalance.lastUpdated = new Date();

  // Add the allocation
  userBalance.allocations.push(newAllocation);
  userBalance.lastUpdated = new Date();

  // Save the updated balance
  await userBalance.save();

  return { success: true, allocation: newAllocation };
};

/**
 * Get all balances for a user
 */
export const getAllBalances = async (userId: string): Promise<any[]> => {
  const userBalance = await getUserBalanceRecord(userId);

  // Format the balances for display with additional metadata
  return userBalance.balances.map(balance => {
    const chain = SUPPORTED_CHAINS[balance.chainId] || {
      id: balance.chainId,
      name: balance.chainId,
      symbol: 'UNKNOWN',
      decimals: 18,
    };

    // Get token info for this balance
    const tokenInfo =
      balance.tokenSymbol === chain.symbol
        ? getNativeTokenForChain(balance.chainId)
        : getTokenInfoForChain(balance.chainId, balance.tokenSymbol);

    // TODO: Get current price data to calculate USD value
    const mockUsdValue = '0.0';

    return {
      chainId: balance.chainId,
      tokenSymbol: balance.tokenSymbol,
      tokenName: tokenInfo?.name || balance.tokenSymbol,
      chainName: chain.name,
      balance: balance.balance,
      usdValue: mockUsdValue,
      lastUpdated: balance.lastUpdated,
    };
  });
};

/**
 * Get balance for a specific token on a specific chain
 */
export const getTokenBalance = async (
  userId: string,
  chainId: string,
  tokenSymbol?: string
): Promise<any> => {
  if (!SUPPORTED_CHAINS[chainId]) {
    throw new Error(`Chain ${chainId} is not supported`);
  }

  // If tokenSymbol is provided, verify it's supported on this chain
  if (tokenSymbol && !isTokenSupportedOnChain(chainId, tokenSymbol)) {
    throw new Error(`Token ${tokenSymbol} is not supported on chain ${chainId}`);
  }

  // Get the token info - use native token if not specified
  const tokenInfo = tokenSymbol
    ? getTokenInfoForChain(chainId, tokenSymbol)
    : getNativeTokenForChain(chainId);

  if (!tokenInfo) {
    throw new Error(
      `Unable to get token information for ${tokenSymbol || 'native token'} on chain ${chainId}`
    );
  }

  const actualTokenSymbol = tokenInfo.symbol;
  const userBalance = await getUserBalanceRecord(userId);

  // Find the specific token balance for this chain
  const tokenBalance = userBalance.balances.find(
    b => b.chainId === chainId && b.tokenSymbol === actualTokenSymbol
  );

  // TODO: Get current price data to calculate USD value
  const mockUsdValue = '0.0';

  if (!tokenBalance) {
    return {
      chainId,
      tokenSymbol: actualTokenSymbol,
      tokenName: tokenInfo.name,
      chainName: SUPPORTED_CHAINS[chainId]?.name || chainId,
      balance: '0',
      usdValue: '0.0',
      lastUpdated: new Date(),
    };
  }

  return {
    chainId: tokenBalance.chainId,
    tokenSymbol: tokenBalance.tokenSymbol,
    tokenName: tokenInfo.name,
    chainName: SUPPORTED_CHAINS[chainId]?.name || chainId,
    balance: tokenBalance.balance,
    usdValue: mockUsdValue,
    lastUpdated: tokenBalance.lastUpdated,
  };
};

/**
 * Get all balances for a specific chain
 */
export const getChainBalances = async (userId: string, chainId: string): Promise<any[]> => {
  if (!SUPPORTED_CHAINS[chainId]) {
    throw new Error(`Chain ${chainId} is not supported`);
  }

  const userBalance = await getUserBalanceRecord(userId);

  // Find all token balances for this chain
  const chainBalances = userBalance.balances.filter(b => b.chainId === chainId);

  // Format the balances for display
  return chainBalances.map(balance => {
    // Get token info for this balance
    const tokenInfo =
      balance.tokenSymbol === SUPPORTED_CHAINS[chainId]?.symbol
        ? getNativeTokenForChain(chainId)
        : getTokenInfoForChain(chainId, balance.tokenSymbol);

    // TODO: Get current price data to calculate USD value
    const mockUsdValue = '0.0';

    return {
      chainId: balance.chainId,
      tokenSymbol: balance.tokenSymbol,
      tokenName: tokenInfo?.name || balance.tokenSymbol,
      chainName: SUPPORTED_CHAINS[chainId]?.name || chainId,
      balance: balance.balance,
      usdValue: mockUsdValue,
      lastUpdated: balance.lastUpdated,
    };
  });
};

export const getAllChainTokens = async (): Promise<ChainTokenList> => {
  return CHAIN_TOKENS;
};
