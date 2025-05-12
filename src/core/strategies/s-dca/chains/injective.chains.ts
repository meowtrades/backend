import {
  MsgExecuteContract,
  MsgSend,
  BaseAccount,
  ChainRestAuthApi,
  createTransaction,
  ChainRestTendermintApi,
  PrivateKey,
  ChainGrpcBankApi,
  TxRestApi,
  ChainGrpcExchangeApi,
} from '@injectivelabs/sdk-ts';
import { BigNumberInBase } from '@injectivelabs/utils';
import { DEFAULT_BLOCK_TIMEOUT_HEIGHT } from '@injectivelabs/utils';
import { ChainId } from '@injectivelabs/ts-types';
import { Network, getNetworkEndpoints } from '@injectivelabs/networks';
import dotenv from 'dotenv';
import { DCAPlugin } from '../../../types';
import { logger } from '../../../../utils/logger';
import { INJECTIVE_CONSTANTS } from '../../../../constants';
import axios from 'axios';

dotenv.config();

export class InjectivePlugin implements DCAPlugin {
  name = 'injective';
  private readonly CONTRACT_ADDRESS: string;
  private readonly USDT_DENOM: string;
  private readonly INJ_DENOM: string;
  private readonly restEndpoint: string;
  private readonly grpcEndpoint: string;
  private readonly chainId: string;

  constructor() {
    const network = Network.TestnetK8s;
    const endpoints = getNetworkEndpoints(network);
    this.restEndpoint = endpoints.rest;
    this.grpcEndpoint = endpoints.grpc;
    this.chainId = ChainId.Testnet;

    // Initialize addresses from constants
    this.CONTRACT_ADDRESS = INJECTIVE_CONSTANTS.CONTRACT_ADDRESS;
    this.USDT_DENOM = INJECTIVE_CONSTANTS.USDT_DENOM;
    this.INJ_DENOM = INJECTIVE_CONSTANTS.INJ_DENOM;
  }

  async sendSwapTransaction(amount: number, fromAddress: string): Promise<string> {
    try {
      // Using private key from environment variables
      const privateKeyHex = process.env.PRIVATE_KEY_INJECTIVE;
      if (!privateKeyHex) {
        throw new Error('Private key not found in environment variables (PRIVATE_KEY_INJECTIVE)');
      }

      // Create private key from hex string
      const privateKey = PrivateKey.fromHex(privateKeyHex);
      const walletAddress = privateKey.toBech32();

      logger.info(`Using wallet address: ${walletAddress}`);
      logger.info(`Swap amount: ${amount} USDT`);

      // For this implementation, we'll swap USDT to INJ
      const fromDenom = this.USDT_DENOM;
      const toDenom = this.INJ_DENOM;

      // Convert amount to proper decimals (USDT has 6 decimals)
      const amountInBaseUnits = new BigNumberInBase(amount)
        .times(new BigNumberInBase(10).pow(6))
        .toFixed(0);

      // Prepare the swap message
      const swapMsg = {
        swap_min_output: {
          target_denom: toDenom,
          min_output_quantity: '0.5', // Minimum INJ to receive
        },
      };

      // Create the execute contract message
      const msg = MsgExecuteContract.fromJSON({
        sender: walletAddress,
        contractAddress: this.CONTRACT_ADDRESS,
        msg: swapMsg,
        funds: [
          {
            denom: fromDenom,
            amount: amountInBaseUnits,
          },
        ],
      });

      /** Account Details **/
      const chainRestAuthApi = new ChainRestAuthApi(this.restEndpoint);
      const accountDetailsResponse = await chainRestAuthApi.fetchAccount(walletAddress);

      /** Block Details */
      const chainRestTendermintApi = new ChainRestTendermintApi(this.restEndpoint);
      const latestBlock = await chainRestTendermintApi.fetchLatestBlock();
      const latestHeight = latestBlock.header.height;
      const timeoutHeight = new BigNumberInBase(latestHeight).plus(DEFAULT_BLOCK_TIMEOUT_HEIGHT);

      // Updated fee structure for better gas estimation
      const customFee = {
        amount: [
          {
            denom: 'inj',
            amount: '5000000000000000', // 0.005 INJ (increased)
          },
        ],
        gas: '2000000', // 2,000,000 gas units (increased)
      };

      const baseAccount = BaseAccount.fromRestApi(accountDetailsResponse);
      /** Prepare the Transaction **/
      const { txRaw, signDoc, signBytes } = createTransaction({
        pubKey: privateKey.toPublicKey().toBase64(),
        chainId: this.chainId,
        fee: customFee,
        message: msg,
        sequence: baseAccount.sequence,
        timeoutHeight: timeoutHeight.toNumber(),
        accountNumber: baseAccount.accountNumber,
      });

      const bytesToSign = signBytes ? signBytes : Buffer.from(signDoc.bodyBytes);
      const signature = await privateKey.sign(Buffer.from(bytesToSign));
      txRaw.signatures = [Buffer.from(signature)];

      // Initialize the txClient
      const txClient = new TxRestApi(this.restEndpoint);

      // Broadcast the transaction
      const txResponse = await txClient.broadcast(txRaw);

      if (txResponse.txHash) {
        logger.info(`Swap transaction successful: ${txResponse.txHash}`);
        return txResponse.txHash;
      } else {
        throw new Error(`Broadcast response missing txHash: ${JSON.stringify(txResponse)}`);
      }
    } catch (error) {
      console.log((error as Error).stack);
      logger.error(`Failed to execute swap transaction: ${error}`);
      throw new Error(`Failed to execute swap transaction: ${error}`);
    }
  }

  async withdrawTokens(amount: number, toAddress: string): Promise<string> {
    try {
      // Using private key from environment variables
      const privateKeyHex = process.env.PRIVATE_KEY_INJECTIVE;
      if (!privateKeyHex) {
        throw new Error('Private key not found in environment variables (PRIVATE_KEY_INJECTIVE)');
      }

      // Create private key from hex string
      const privateKey = PrivateKey.fromHex(privateKeyHex);
      const walletAddress = privateKey.toBech32();

      logger.info(`Withdrawing ${amount} INJ from ${walletAddress} to ${toAddress}`);

      // Convert to base units (INJ has 18 decimals)
      const amountInBaseUnits = new BigNumberInBase(amount)
        .times(new BigNumberInBase(10).pow(18))
        .toFixed(0);

      // Get account details
      const chainRestAuthApi = new ChainRestAuthApi(this.restEndpoint);
      const accountDetailsResponse = await chainRestAuthApi.fetchAccount(walletAddress);
      const baseAccount = BaseAccount.fromRestApi(accountDetailsResponse);

      // Get block details
      const chainRestTendermintApi = new ChainRestTendermintApi(this.restEndpoint);
      const latestBlock = await chainRestTendermintApi.fetchLatestBlock();
      const latestHeight = latestBlock.header.height;
      const timeoutHeight = new BigNumberInBase(latestHeight).plus(DEFAULT_BLOCK_TIMEOUT_HEIGHT);

      // Create the transfer message
      const amountInToken = {
        amount: amountInBaseUnits,
        denom: this.INJ_DENOM,
      };

      const sendMsg = MsgSend.fromJSON({
        amount: amountInToken,
        srcInjectiveAddress: walletAddress,
        dstInjectiveAddress: toAddress,
      });

      // Prepare the transfer transaction
      const transferFee = {
        amount: [
          {
            denom: 'inj',
            amount: '2000000000000000', // 0.002 INJ
          },
        ],
        gas: '150000', // 150,000 gas units
      };

      const transferTx = createTransaction({
        pubKey: privateKey.toPublicKey().toBase64(),
        chainId: this.chainId,
        fee: transferFee,
        message: sendMsg,
        sequence: baseAccount.sequence,
        timeoutHeight: timeoutHeight.toNumber(),
        accountNumber: baseAccount.accountNumber,
      });

      // Sign the transfer transaction
      const transferBytesToSign = transferTx.signBytes
        ? transferTx.signBytes
        : Buffer.from(transferTx.signDoc.bodyBytes);

      const transferSignature = await privateKey.sign(Buffer.from(transferBytesToSign));
      transferTx.txRaw.signatures = [Buffer.from(transferSignature)];

      // Broadcast the transfer transaction
      const txClient = new TxRestApi(this.restEndpoint);
      const transferResponse = await txClient.broadcast(transferTx.txRaw);

      if (transferResponse.txHash) {
        logger.info(`Withdrawal transaction successful: ${transferResponse.txHash}`);
        return transferResponse.txHash;
      } else {
        throw new Error(`Withdrawal response missing txHash: ${JSON.stringify(transferResponse)}`);
      }
    } catch (error) {
      logger.error(`Failed to withdraw tokens: ${error}`);
      throw new Error(`Failed to withdraw tokens: ${error}`);
    }
  }

  async getUSDTBalance(address: string): Promise<number> {
    try {
      const bankClient = new ChainGrpcBankApi(this.grpcEndpoint);

      // Query USDT balance
      const response = await bankClient.fetchBalance({
        accountAddress: address,
        denom: this.USDT_DENOM,
      });

      // Convert to human-readable format with 6 decimals
      const balance = new BigNumberInBase(response.amount)
        .dividedBy(new BigNumberInBase(10).pow(6))
        .toNumber();

      return balance;
    } catch (error) {
      // If no balance found or error occurs, return 0
      logger.error(`Failed to get USDT balance: ${error}`);
      return 0;
    }
  }

  async getNativeBalance(address: string): Promise<number> {
    try {
      const bankClient = new ChainGrpcBankApi(this.grpcEndpoint);

      // Query INJ balance
      const response = await bankClient.fetchBalance({
        accountAddress: address,
        denom: this.INJ_DENOM,
      });

      // Convert to human-readable format with 18 decimals
      const balance = new BigNumberInBase(response.amount)
        .dividedBy(new BigNumberInBase(10).pow(18))
        .toNumber();

      return balance;
    } catch (error) {
      // If no balance found or error occurs, return 0
      logger.error(`Failed to get INJ balance: ${error}`);
      return 0;
    }
  }

  async getNativeTokenValueInUSDT(amount: number): Promise<number> {
    try {
      // Get current INJ price from CoinGecko
      const response = await axios.get('https://api.coingecko.com/api/v3/simple/price', {
        params: {
          ids: 'injective-protocol',
          vs_currencies: 'usd',
        },
      });

      const currentPrice = response.data['injective-protocol'].usd;
      return amount * currentPrice;
    } catch (error) {
      logger.error(`Failed to get INJ value in USDT: ${error}`);
      return 0;
    }
  }
}
