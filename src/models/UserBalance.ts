import mongoose, { Document, Schema } from 'mongoose';

// Interface for chain-specific balance
interface IChainBalance {
  chainId: string;
  tokenSymbol: string;
  balance: string; // Using string for precision with decimal numbers
  lastUpdated: Date;
}

// Interface for token allocation
interface ITokenAllocation {
  chainId: string;
  strategyId: string;
  amount: string;
  status: 'pending' | 'active' | 'completed' | 'failed';
  startDate: Date;
  endDate?: Date;
  tokenSymbol: string;
  tokenAddress?: string;
}

// Main user balance interface
export interface IUserBalance extends Document {
  userId: string;
  balances: IChainBalance[];
  allocations: ITokenAllocation[];
  totalDeposited: string;
  totalWithdrawn: string;
  lastUpdated: Date;
}

// Schema for chain-specific balance
const ChainBalanceSchema = new Schema({
  chainId: {
    type: String,
    required: true,
  },
  tokenSymbol: {
    type: String,
    required: true,
  },
  balance: {
    type: String,
    required: true,
    default: '0',
  },
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
});

// Schema for token allocation
const TokenAllocationSchema = new Schema({
  chainId: {
    type: String,
    required: true,
  },
  strategyId: {
    type: String,
    required: true,
  },
  amount: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'completed', 'failed'],
    default: 'pending',
  },
  startDate: {
    type: Date,
    default: Date.now,
  },
  endDate: {
    type: Date,
  },
  tokenSymbol: {
    type: String,
    required: true,
  },
  tokenAddress: {
    type: String,
  },
});

// Main user balance schema
const UserBalanceSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    balances: [ChainBalanceSchema],
    allocations: [TokenAllocationSchema],
    totalDeposited: {
      type: String,
      default: '0',
    },
    totalWithdrawn: {
      type: String,
      default: '0',
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes for faster queries
UserBalanceSchema.index({ userId: 1 });
UserBalanceSchema.index({ 'balances.chainId': 1 });
UserBalanceSchema.index({ 'balances.tokenSymbol': 1 });
UserBalanceSchema.index({ 'balances.chainId': 1, 'balances.tokenSymbol': 1 });
UserBalanceSchema.index({ 'allocations.strategyId': 1 });
UserBalanceSchema.index({ 'allocations.status': 1 });

export const UserBalance = mongoose.model<IUserBalance>('UserBalance', UserBalanceSchema);
