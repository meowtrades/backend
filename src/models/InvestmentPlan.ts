import mongoose, { Schema, Document, Types } from 'mongoose';
import { RiskLevel, Frequency } from '../core/types';

const InvestmentPlanSchema: Schema = new Schema({
  userId: { type: String, required: true },
  amount: { type: Number, required: true },
  initialAmount: { type: Number, required: true },
  frequency: { 
    type: String, 
    required: true,
    enum: Object.values(Frequency)
  },
  userWalletAddress: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  lastExecutionTime: { type: Date, default: null },
  totalInvested: { type: Number, default: 0 },
  executionCount: { type: Number, default: 0 },
  riskLevel: { 
    type: String, 
    enum: Object.values(RiskLevel),
    default: RiskLevel.NO_RISK,
    required: true 
  },
  chain: { type: String, required: true }
}, {
  timestamps: true
});

export interface IInvestmentPlan extends Document {
  _id: Types.ObjectId;
  userId: string;
  amount: number;
  frequency: string; // 'minute', 'hour', 'day'
  userWalletAddress: string;
  isActive: boolean;
  lastExecutionTime: Date;
  totalInvested: number;
  createdAt: Date;
  updatedAt: Date;
  executionCount: number;
  initialAmount: number;
  riskLevel: RiskLevel;
  chain: string;
}

export const InvestmentPlan = mongoose.model<IInvestmentPlan>('InvestmentPlan', InvestmentPlanSchema);