import { Router } from 'express';
import { getAvailableStrategies, getAvailableTokens } from './details.controllers';

const router = Router();

router.get('/', (req, res) => {
  res.status(200).json({
    message: 'Details API',
    description: 'This API provides details about available strategies and tokens.',
    availableEndpoints: [
      { method: 'GET', path: '/strategies', description: 'Get available strategies' },
      { method: 'GET', path: '/tokens', description: 'Get available tokens' },
    ],
  });
});

router.get('/strategies', getAvailableStrategies);
router.get('/tokens', getAvailableTokens);

export default router;
