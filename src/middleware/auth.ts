import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { fromNodeHeaders } from 'better-auth/node';
import { auth } from '../lib/auth';
// import { User } from '../models/User';

import { User } from 'better-auth';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user: User;
    }
  }
}

export const authenticateAdmin = (req: Request, res: Response, next: NextFunction) => {
  const adminToken = req.headers['x-admin-token'];

  if (!adminToken || adminToken !== '14-E') {
    logger.warn('Unauthorized admin access attempt');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  next();
};

export const getSession = async (req: Request, res: Response, next: NextFunction) => {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });

  if (!session) {
    res.status(401).json({ error: 'Missing session' });

    return;
  }

  const user = session.user;

  if (!user) {
    res.status(401).json({ error: 'User not found' });

    return;
  }

  req.user = user;
  next();
};
