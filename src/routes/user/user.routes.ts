// src/routes/user.ts
import express from 'express';
import { createOrUpdateUser, getUserByAddress, getUserById } from './user.controller';
import analytics from './analytics/analytics.routes';
import balance from './balance/balance.routes';

const router = express.Router();

// Create or update user
router.post('/', createOrUpdateUser);

// Get user by address
router.get('/address/:address', getUserByAddress);

// Get user by ID
router.get('/:userId', getUserById);

// Analytics routes
router.use('/analytics', analytics);

// Balance routes
router.use('/balance', balance);

export default router;