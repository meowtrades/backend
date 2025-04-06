import { Request, Response } from 'express';
import { User } from '../../models/User';
import { logger } from '../../utils/logger';
import mongoose from 'mongoose';

export const createOrUpdateUser = async (req: Request, res: Response) => {
  try {
    let { address } = req.body;

    if (!address || typeof address !== 'string') {
      return res.status(400).json({ error: 'Wallet address is required and must be a string' });
    }

    address = address.trim();

    let user = await User.findOne({ address });

    if (user) {
      logger.info(`Existing user logged in: ${address}`);
      return res.json(user);
    }

    user = await User.create({ address });
    logger.info(`New user created: ${address}`);

    res.status(201).json(user);
  } catch (error) {
    logger.error('Failed to create/update user:', error);
    res.status(500).json({ error: 'Failed to create/update user' });
  }
};

export const getUserByAddress = async (req: Request, res: Response) => {
  try {
    let { address } = req.params;

    if (!address || typeof address !== 'string') {
      return res.status(400).json({ error: 'Valid wallet address is required' });
    }

    address = address.trim();

    const user = await User.findOne({ address });

    if (!user) {
      logger.warn(`User not found for address: ${address}`);
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    logger.error('Failed to get user by address:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
};

export const getUserById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      logger.warn(`Invalid user ID format: ${id}`);
      return res.status(400).json({ error: 'Invalid user ID format' });
    }

    const user = await User.findById(id);

    if (!user) {
      logger.warn(`User not found for ID: ${id}`);
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    logger.error('Failed to get user by ID:', error);
    res.status(500).json({ error: 'Failed to get user by ID' });
  }
}; 