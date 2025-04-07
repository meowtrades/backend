import { AptosClient, AptosAccount } from "aptos";
import dotenv from "dotenv";
import { logger } from '../../../../utils/logger';
import { DCAPlugin } from "../../../types";
import { APTOS_CONSTANTS } from '../../../../constants';
import axios from 'axios';

dotenv.config();

export class AptosPlugin implements DCAPlugin {
  name = "aptos";
  private readonly CONTRACT_ADDRESS: string;
  private readonly USDC_ADDRESS: string;
  private readonly APT_ADDRESS: string;
  private readonly client: AptosClient;

  constructor() {
    // Use testnet by default, can be overridden by environment variable
    const nodeUrl = process.env.APTOS_NODE_URL;
    if (!nodeUrl) {
      throw new Error("APTOS_NODE_URL not found in environment variables");
    } 
    this.client = new AptosClient(nodeUrl);

    // Initialize addresses from constants
    this.CONTRACT_ADDRESS = APTOS_CONSTANTS.CONTRACT_ADDRESS;
    this.USDC_ADDRESS = APTOS_CONSTANTS.USDC_ADDRESS;
    this.APT_ADDRESS = APTOS_CONSTANTS.APT_ADDRESS;
  }

  private getAccount(): AptosAccount {
    const privateKeyHex = "3481a0b0f58b784f0ee81b7f5c94a67d0becaf1fb55e9b7d244151e65f158efa";
    if (!privateKeyHex) {
      throw new Error("Private key not found in environment variables (PRIVATE_KEY_APTOS)");
    }

    // Convert hex string to byte array
    const privateKeyBytes = Uint8Array.from(
      Buffer.from(privateKeyHex.replace(/^0x/, ""), "hex")
    );

    return new AptosAccount(privateKeyBytes);
  }

  async sendSwapTransaction(
    amount: number,
    fromAddress: string
  ): Promise<string> {
    try {
      // For Aptos, we'll use our configured account for transactions
      const account = this.getAccount();

      logger.info(`Aptos Plugin: Swapping ${amount} USDC to APT`);

      // Create swap transaction payload
      const payload = {
        function: `${this.CONTRACT_ADDRESS}::pool::swap_x_to_y`,
        type_arguments: [this.USDC_ADDRESS, this.APT_ADDRESS],
        arguments: [BigInt(amount * 1000000).toString(), "0"] // Convert to smallest units (6 decimals)
      };

      // Generate the transaction
      const rawTxn = await this.client.generateTransaction(account.address(), payload);
      
      // Sign the transaction
      const signedTxn = await this.client.signTransaction(account, rawTxn);
      
      // Submit the transaction
      const swapResult = await this.client.submitTransaction(signedTxn);
      
      logger.info(`Swap transaction submitted: ${swapResult.hash}`);
      await this.client.waitForTransaction(swapResult.hash);
      
      return swapResult.hash;
    } catch (error) {
      logger.error(`Aptos Plugin: Failed to execute swap transaction: ${error}`);
      throw new Error(`Failed to execute swap transaction: ${error}`);
    }
  }

  async getUSDTBalance(address: string): Promise<number> {
    try {
      const formattedAddress = address.startsWith("0x") ? address : `0x${address}`;
      
      // Query USDC balance
      const resource = await this.client.getAccountResource(
        formattedAddress,
        `0x1::coin::CoinStore<${this.USDC_ADDRESS}>`
      );
      
      // Convert to human-readable format with 6 decimals
      const balance = Number((resource.data as any).coin.value) / 1000000;
      return balance;
    } catch (error) {
      // If no balance found or error occurs, return 0
      logger.error(`Aptos Plugin: Failed to get USDC balance: ${error}`);
      return 0;
    }
  }

  async getNativeBalance(address: string): Promise<number> {
    try {
      const formattedAddress = address.startsWith("0x") ? address : `0x${address}`;
      
      // Query APT balance
      const resource = await this.client.getAccountResource(
        formattedAddress,
        "0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>"
      );
      
      // Convert to human-readable format with 8 decimals
      const balance = Number((resource.data as any).coin.value) / 100000000;
      return balance;
    } catch (error) {
      // If no balance found or error occurs, return 0
      logger.error(`Aptos Plugin: Failed to get APT balance: ${error}`);
      return 0;
    }
  }

  async withdrawTokens(amount: number, toAddress: string): Promise<string> {
    try {
      const account = this.getAccount();
      const recipientAddress = toAddress.startsWith("0x") ? toAddress : `0x${toAddress}`;

      logger.info(`Aptos Plugin: Withdrawing ${amount} APT to ${recipientAddress}`);

      // Convert to smallest units (8 decimals for APT)
      const transferAmount = BigInt(Math.floor(amount * 100000000)).toString();
      
      // Create transfer transaction
      const transferPayload = {
        function: "0x1::aptos_account::transfer",
        type_arguments: [],
        arguments: [recipientAddress, transferAmount]
      };
      
      const transferTxn = await this.client.generateTransaction(account.address(), transferPayload);
      const signedTransferTxn = await this.client.signTransaction(account, transferTxn);
      const transferResult = await this.client.submitTransaction(signedTransferTxn);
      
      logger.info(`Withdrawal transaction submitted: ${transferResult.hash}`);
      await this.client.waitForTransaction(transferResult.hash);
      
      return transferResult.hash;
    } catch (error) {
      logger.error(`Aptos Plugin: Failed to withdraw tokens: ${error}`);
      throw new Error(`Failed to withdraw tokens: ${error}`);
    }
  }

  async getNativeTokenValueInUSDT(amount: number): Promise<number> {
    try {
      // Get current APT price from CoinGecko
      const response = await axios.get('https://api.coingecko.com/api/v3/simple/price', {
        params: {
          ids: 'aptos',
          vs_currencies: 'usd'
        }
      });
      
      const currentPrice = response.data.aptos.usd;
      return amount * currentPrice;
    } catch (error) {
      logger.error(`Failed to get APT value in USDT: ${error}`);
      return 0;
    }
  }
}