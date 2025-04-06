import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export const authenticateAdmin = (req: Request, res: Response, next: NextFunction) => {
    const adminToken = req.headers['x-admin-token'];
    
    if (!adminToken || adminToken !== "14-E") {
        logger.warn('Unauthorized admin access attempt');
        return res.status(401).json({ error: 'Unauthorized' });
    }
    
    next();
}; 