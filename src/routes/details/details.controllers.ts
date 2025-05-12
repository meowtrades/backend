import { Request, Response } from 'express';
import { StrategyFactory } from '../../core/factories/strategy.factory';
import { TokenRepository } from '../../core/factories/tokens.repository';

export const getAvailableStrategies = async (req: Request, res: Response) => {
  const strategies = Object.keys(StrategyFactory.strategies);

  res.status(200).json({
    message: 'Available strategies',
    strategies,
  });
};

export const getAvailableTokens = async (req: Request, res: Response) => {
  const tokens = Object.keys(TokenRepository.tokens);

  res.status(200).json({
    message: 'Available tokens',
    tokens,
  });
};
