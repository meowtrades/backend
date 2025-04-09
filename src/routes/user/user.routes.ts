// src/routes/user.ts
import express from 'express';
import { createOrUpdateUser, getUserByAddress, getUserById } from './user.controllers';
import analytics from './analytics/analytics.routes';
import balance from './balance/balance.routes';

import { fromNodeHeaders } from 'better-auth/node';
import { auth } from '../../lib/auth'; //your better auth instance

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

router.get('/me', async (req, res) => {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });
  return res.json(session);
});

export default router;
