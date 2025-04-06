import express from 'express';
import sdca from './s-dca/s-dca.routes';

const router = express.Router();

// Smart DCA notebook service routes
router.use('/s-dca', sdca);

export default router;