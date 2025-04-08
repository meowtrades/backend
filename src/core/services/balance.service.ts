import { UserBalance, IUserBalance } from '../../models/UserBalance';
import mongoose from 'mongoose';
import { ethers } from 'ethers'; // Using ethers.js for safe math operations
import { 
  getTokenInfoForChain, 
  getSupportedChains,
  getNativeTokenForChain,
  isTokenSupportedOnChain,
  ChainTokenInfo
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
      decimals: nativeToken.decimals
    };
  }
});

/**
 * Initialize or get a user's balance record
 */
export const getUserBalanceRecord = async (userId: mongoose.Types.ObjectId): Promise<IUserBalance> => {
  let userBalance = await UserBalance.findOne({ userId });
  
  if (!userBalance) {
    // Create a new balance record for the user with zero balances for all supported chains
    const initialBalances = Object.keys(SUPPORTED_CHAINS).map(chainId => ({
      chainId,
      balance: '0',
      lastUpdated: new Date()
    }));
    
    userBalance = await UserBalance.create({
      userId,
      balances: initialBalances,
      allocations: [],
      totalDeposited: '0',
      totalWithdrawn: '0',
      lastUpdated: new Date()
    });
  }
  
  return userBalance;
};

/**
 * Process a user deposit
 */
export const processDeposit = async (
  userId: mongoose.Types.ObjectId,
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
    throw new Error(`Unable to get token information for ${tokenSymbol || 'native token'} on chain ${chainId}`);
  }
  
  const userBalance = await getUserBalanceRecord(userId);
  
  // Find the chain-specific balance
  const chainBalance = userBalance.balances.find(b => b.chainId === chainId);
  
  if (chainBalance) {
    // Update existing balance
    const currentBalance = ethers.BigNumber.from(chainBalance.balance);
    const depositAmount = ethers.BigNumber.from(amount);
    chainBalance.balance = currentBalance.add(depositAmount).toString();
    chainBalance.lastUpdated = new Date();
  } else {
    // Add new chain balance
    userBalance.balances.push({
      chainId,
      balance: amount,
      lastUpdated: new Date()
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
  userId: mongoose.Types.ObjectId,
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
    throw new Error(`Unable to get token information for ${tokenSymbol || 'native token'} on chain ${chainId}`);
  }
  
  const userBalance = await getUserBalanceRecord(userId);
  
  // Find the chain-specific balance
  const chainBalance = userBalance.balances.find(b => b.chainId === chainId);
  
  if (!chainBalance) {
    return { success: false, error: `No balance found for chain ${chainId}` };
  }
  
  // Check if the user has sufficient balance
  const currentBalance = ethers.BigNumber.from(chainBalance.balance);
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
  const mockTxHash = `0x${Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('')}`;
  
  // Update user's balance
  chainBalance.balance = currentBalance.sub(withdrawalAmount).toString();
  chainBalance.lastUpdated = new Date();
  
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
  userId: mongoose.Types.ObjectId,
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
    throw new Error(`Unable to get token information for ${tokenSymbol || 'native token'} on chain ${chainId}`);
  }
  
  const userBalance = await getUserBalanceRecord(userId);
  
  // Find the chain-specific balance
  const chainBalance = userBalance.balances.find(b => b.chainId === chainId);
  
  if (!chainBalance) {
    return { success: false, error: `No balance found for chain ${chainId}` };
  }
  
  // Check if the user has sufficient balance
  const currentBalance = ethers.BigNumber.from(chainBalance.balance);
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
    tokenSymbol: tokenInfo.symbol, // Store the token symbol for this allocation
    tokenAddress: tokenInfo.address // Store the token address
  };
  
  // Update user's balance
  chainBalance.balance = currentBalance.sub(allocationAmount).toString();
  chainBalance.lastUpdated = new Date();
  
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
export const getAllBalances = async (userId: mongoose.Types.ObjectId): Promise<any[]> => {
  const userBalance = await getUserBalanceRecord(userId);
  
  // Format the balances for display with additional metadata
  return userBalance.balances.map(balance => {
    const chain = SUPPORTED_CHAINS[balance.chainId] || {
      id: balance.chainId,
      name: balance.chainId,
      symbol: 'UNKNOWN',
      decimals: 18
    };
    
    // Get the native token for this chain
    const nativeToken = getNativeTokenForChain(balance.chainId);
    
    // TODO: Get current price data to calculate USD value
    const mockUsdValue = '0.0';
    
    return {
      chainId: balance.chainId,
      name: chain.name,
      symbol: nativeToken?.symbol || chain.symbol,
      balance: balance.balance,
      usdValue: mockUsdValue,
      lastUpdated: balance.lastUpdated
    };
  });
};

/**
 * Get balance for a specific chain
 */
export const getChainBalance = async (userId: mongoose.Types.ObjectId, chainId: string): Promise<any> => {
  if (!SUPPORTED_CHAINS[chainId]) {
    throw new Error(`Chain ${chainId} is not supported`);
  }
  
  const userBalance = await getUserBalanceRecord(userId);
  
  // Find the chain-specific balance
  const chainBalance = userBalance.balances.find(b => b.chainId === chainId);
  
  // Get the native token info for this chain
  const nativeToken = getNativeTokenForChain(chainId);
  
  if (!nativeToken) {
    throw new Error(`No native token found for chain ${chainId}`);
  }
  
  if (!chainBalance) {
    return {
      chainId,
      name: nativeToken.name,
      symbol: nativeToken.symbol,
      balance: '0',
      usdValue: '0.0',
      lastUpdated: new Date()
    };
  }
  
  // TODO: Get current price data to calculate USD value
  const mockUsdValue = '0.0';
  
  return {
    chainId: chainBalance.chainId,
    name: nativeToken.name,
    symbol: nativeToken.symbol,
    balance: chainBalance.balance,
    usdValue: mockUsdValue,
    lastUpdated: chainBalance.lastUpdated
  };
}; 