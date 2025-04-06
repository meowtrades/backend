import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  userId: string;
  address: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema({
  userId: { type: String, required: true, unique: true },
  address: { type: String, required: true },
}, {
  timestamps: true
});

export const User = mongoose.model<IUser>('User', UserSchema); 