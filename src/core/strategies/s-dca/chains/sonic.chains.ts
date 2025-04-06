import { DCAPlugin } from "../../../types";
import { 
    Connection, 
    PublicKey, 
    Keypair, 
    Transaction, 
    TransactionInstruction
} from '@solana/web3.js';
import { 
    TOKEN_PROGRAM_ID, 
    getOrCreateAssociatedTokenAccount
} from '@solana/spl-token';
import dotenv from 'dotenv';
import { logger } from '../../../../utils/logger';
import bs58 from 'bs58';
import { SONIC_CONSTANTS } from '../../../../constants';

dotenv.config();

export class SonicPlugin implements DCAPlugin {
    name = "sonic";
    
    private readonly connection: Connection;

    constructor() {
        this.connection = new Connection(SONIC_CONSTANTS.RPC_ENDPOINT, 'confirmed');
        logger.info('Initialized Sonic.game plugin with testnet connection');
    }

    async sendTransaction(
        amount: number,
        fromAddress: string,
        userWalletAddress: string,
        options: { slippageTolerance?: number } = {}
    ): Promise<string> {
        try {
            if (!process.env.PRIVATE_KEY_SONIC) {
                throw new Error("Private key not found in environment variables (PRIVATE_KEY_SONIC)");
            }

            // Parse private key and create wallet
            const privateKeyBytes = bs58.decode(process.env.PRIVATE_KEY_SONIC);
            const wallet = Keypair.fromSecretKey(privateKeyBytes);
            
            // Get token accounts
            const tokenAMint = new PublicKey(SONIC_CONSTANTS.USDC_MINT);
            const tokenBMint = new PublicKey(SONIC_CONSTANTS.SONIC_MINT);
            const poolAccount = new PublicKey(SONIC_CONSTANTS.POOL_ACCOUNT);
            
            // Get user token accounts
            const userUsdcAccount = await getOrCreateAssociatedTokenAccount(
                this.connection, wallet, tokenAMint, wallet.publicKey
            );
            const userSonicAccount = await getOrCreateAssociatedTokenAccount(
                this.connection, wallet, tokenBMint, wallet.publicKey
            );
            
            // Convert amount to proper format (USDC has 6 decimals)
            const amountInBaseUnits = Math.floor(amount * 1000000);
            
            // Create swap instruction
            const data = Buffer.alloc(1 + 8);
            data.writeUInt8(1, 0); // Instruction index for swap
            data.writeBigUInt64LE(BigInt(amountInBaseUnits), 1);
            
            // Create the swap instruction
            const instruction = new TransactionInstruction({
                keys: [
                    { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
                    { pubkey: poolAccount, isSigner: false, isWritable: true },
                    { pubkey: userUsdcAccount.address, isSigner: false, isWritable: true },
                    { pubkey: userSonicAccount.address, isSigner: false, isWritable: true },
                    { pubkey: tokenAMint, isSigner: false, isWritable: false },
                    { pubkey: tokenBMint, isSigner: false, isWritable: false },
                    { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
                ],
                programId: new PublicKey(SONIC_CONSTANTS.PROGRAM_ID),
                data
            });
            
            // Create and send transaction
            const transaction = new Transaction().add(instruction);
            const { blockhash } = await this.connection.getLatestBlockhash();
            transaction.recentBlockhash = blockhash;
            transaction.feePayer = wallet.publicKey;
            
            // Sign and send transaction
            transaction.sign(wallet);
            const signature = await this.connection.sendTransaction(transaction, [wallet]);
            
            logger.info(`Swap transaction sent: ${signature}`);
            return signature;

        } catch (error) {
            logger.error(`Swap failed: ${error}`);
            throw error;
        }
    }

    // Simple balance check methods
    async getUSDTBalance(address: string): Promise<number> {
        try {
            const tokenAccounts = await this.connection.getParsedTokenAccountsByOwner(
                new PublicKey(address),
                { mint: new PublicKey(SONIC_CONSTANTS.USDC_MINT) }
            );
            return tokenAccounts.value[0]?.account.data.parsed.info.tokenAmount.uiAmount || 0;
        } catch (error) {
            logger.error(`Failed to get USDT balance: ${error}`);
            return 0;
        }
    }

    async getNativeBalance(address: string): Promise<number> {
        try {
            const tokenAccounts = await this.connection.getParsedTokenAccountsByOwner(
                new PublicKey(address),
                { mint: new PublicKey(SONIC_CONSTANTS.SONIC_MINT) }
            );
            return tokenAccounts.value[0]?.account.data.parsed.info.tokenAmount.uiAmount || 0;
        } catch (error) {
            logger.error(`Failed to get SONIC balance: ${error}`);
            return 0;
        }
    }
}