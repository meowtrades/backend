import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import routes from './routes/index.routes';
import { logger } from './utils/logger';
import { PluginFactory } from './core/strategies/s-dca/chains/factory';
import { TransactionRecoveryService } from './core/services/TransactionRecoveryService';

dotenv.config();

const app = express();
const PORT = process.env.PORT;
const MONGODB_URI = process.env.MONGODB_URI;

if (!PORT || !MONGODB_URI) {
  logger.error('PORT or MONGODB_URI is not defined');
  process.exit(1);
}

app.use(express.json());

app.use('/api', routes);

// Initialize plugins
PluginFactory.initializePlugins();
logger.info('Plugins initialized successfully');

// Initialize transaction recovery service
TransactionRecoveryService.getInstance();
logger.info('Transaction recovery service initialized');

mongoose.connect(MONGODB_URI)
  .then(() => {
    logger.info('Connected to MongoDB');
    
    app.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    logger.error('Failed to connect to MongoDB:', error);
    process.exit(1);
  }); 