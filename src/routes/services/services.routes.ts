import express from 'express';
import dca from './dca/dca.routes';

const router = express.Router();

// Smart DCA notebook service routes
router.use('/dca', dca);

export default router;