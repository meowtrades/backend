import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../../models/User';
import { logger } from '../../utils/logger';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/dca-service-mock';

async function setupMockData() {
  try {
    await mongoose.connect(MONGODB_URI);
    logger.info('Connected to MongoDB for mock setup');
    
    // Create a mock user
    const mockUser = await User.findOneAndUpdate(
      { address: 'mock-user-address' },
      { address: 'mock-user-address' },
      { upsert: true, new: true }
    );
    
    logger.info(`Mock user created with ID: ${mockUser._id}`);
    logger.info('Mock data setup complete');
    
    return mockUser;
  } catch (error) {
    logger.error('Error setting up mock data:', error);
  } finally {
    await mongoose.disconnect();
  }
}

setupMockData()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });