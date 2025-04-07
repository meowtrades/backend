import { MockPlanService } from './mockPlanService';
import mockRoutes from './mockRoutes';

// Export the mock plan service instance
export const mockPlanService = new MockPlanService();

// Export the mock routes
export { mockRoutes };

// Export types and interfaces
export * from './mockPlanService';