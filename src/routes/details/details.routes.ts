import { Router } from 'express';
import { getAvailableStrategies, getAvailableTokens } from './details.controllers';

const router = Router();

router.get('/strategies', getAvailableStrategies);
router.get('/tokens', getAvailableTokens);

export default router;
