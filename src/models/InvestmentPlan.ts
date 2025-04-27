import mongoose, { Schema, Document, Types } from 'mongoose';
import { RiskLevel, Frequency } from '../core/types';

const InvestmentPlanSchema = new Schema(
  {
    userId: { type: String, required: true },
    amount: { type: Number, required: true },
    initialAmount: { type: Number, required: true },
    initialInvestment: { type: Number, required: true, default: 100 }, // Added from MockTrade schema
    frequency: {
      type: String,
      required: true,
      enum: Object.values(Frequency),
    },
    userWalletAddress: { type: String },
    isActive: { type: Boolean, default: true },
    lastExecutionTime: { type: Date, default: null },
    totalInvested: { type: Number, default: 0 },
    executionCount: { type: Number, default: 0 },
    riskLevel: {
      type: String,
      enum: Object.values(RiskLevel),
      default: RiskLevel.NO_RISK,
      required: true,
    },
    chain: { type: String, required: true },
    strategyId: { type: String, required: true }, // Added from MockTrade schema
    tokenSymbol: { type: String, required: true, uppercase: true, trim: true }, // Added from MockTrade schema
    startDate: { type: Date, default: Date.now }, // Added from MockTrade schema
    endDate: { type: Date }, // Added from MockTrade schema
    status: {
      type: String,
      enum: ['active', 'stopped'],
      default: 'active',
      required: true,
    }, // Added from MockTrade schema
    mockData: {
      type: Array, // Store the mock chart data
      default: [],
    },
    mockDataLastUpdated: {
      type: Date, // Timestamp of the last update
    },
  },
  {
    timestamps: true,
  }
);

export interface IInvestmentPlan extends Document {
  _id: Types.ObjectId;
  userId: string;
  amount: number;
  initialAmount: number;
  initialInvestment: number;
  frequency: string; // 'minute', 'hour', 'day'
  userWalletAddress: string;
  isActive: boolean;
  lastExecutionTime: Date;
  totalInvested: number;
  createdAt: Date;
  updatedAt: Date;
  executionCount: number;
  riskLevel: RiskLevel;
  chain: string;
  strategyId: string;
  tokenSymbol: string;
  startDate: Date;
  endDate?: Date;
  status: 'active' | 'stopped';
  mockData: any[]; // Define a proper type later based on price data structure
  mockDataLastUpdated: Date;
}

export const InvestmentPlan = mongoose.model<IInvestmentPlan>(
  'InvestmentPlan',
  InvestmentPlanSchema
);
