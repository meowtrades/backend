import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import routes from './routes/index.routes';
import { logger } from './utils/logger';
import { PluginFactory } from './core/strategies/sdca/chains/factory';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/dca-service';

app.use(express.json());

app.use('/api', routes);

// Initialize plugins
PluginFactory.initializePlugins();
logger.info('Plugins initialized successfully');

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