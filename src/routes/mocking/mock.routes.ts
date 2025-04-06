import { MockController } from './mock.controller';

const mockController = new MockController();

export const mockAnalyzeTokenPrice = mockController.analyzeTokenPrice.bind(mockController);
export const mockGetRiskMultiplier = mockController.getRiskMultiplier.bind(mockController);