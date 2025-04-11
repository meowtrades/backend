import { Request, Response } from 'express';
import { User } from '../../models/User';
import { logger } from '../../utils/logger';
import { z } from 'zod';

export const createOrUpdateUserSchema = z.object({
  body: z.object({
    userId: z.string().trim().min(1, 'User ID is required'),
    address: z.string().trim().min(1, 'Wallet address is required'),
  }),
});

export const getUserByAddressSchema = z.object({
  params: z.object({
    address: z.string().trim().min(1, 'Wallet address is required'),
  }),
});

export const getUserByIdSchema = z.object({
  params: z.object({
    userId: z.string().trim().min(1, 'User ID is required'),
  }),
});

export const createOrUpdateUser = async (req: Request, res: Response) => {
  try {
    const { body } = createOrUpdateUserSchema.parse(req);
    const { address } = body;

    const userId = req.user?.id;

    let user = await User.findOne({ userId });

    if (user) {
      if (user.address !== address) {
        user.address = address;
        await user.save();
        logger.info(`Updated address for user ${userId} to ${address}`);
      }
      return res.json(user);
    }

    user = await User.create({ userId, address });
    logger.info(`New user created with ID: ${userId} and address: ${address}`);

    res.status(201).json(user);
  } catch (error) {
    if (error instanceof Error) {
      logger.error('Failed to create/update user:', error);
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to create/update user' });
  }
};

export const getUserByAddress = async (req: Request, res: Response) => {
  try {
    const { params } = getUserByAddressSchema.parse(req);
    const { address } = params;

    const user = await User.findOne({ address });

    if (!user) {
      logger.warn(`User not found for address: ${address}`);
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    if (error instanceof Error) {
      logger.error('Failed to get user by address:', error);
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to get user' });
  }
};

export const getUserById = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    const user = await User.findOne({ userId });

    if (!user) {
      logger.warn(`User not found for ID: ${userId}`);
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    if (error instanceof Error) {
      logger.error('Failed to get user by ID:', error);
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to get user by ID' });
  }
};
