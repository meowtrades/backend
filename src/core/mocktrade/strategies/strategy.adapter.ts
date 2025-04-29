import { PriceData } from '../../services/price.service';

export type PromptOutput = {
  role: string;
  content: string;
}[];

export type BatchInput = {
  custom_id: string;
  method: string;
  url: string;
  body: {
    model: string;
    messages: PromptOutput;
    max_tokens: number;
  };
};

export interface StrategyAdapter {
  execute(dataPoints: PriceData[]): BatchInput[];
  prepareIndicators(data: PriceData[]): any;
  generatePrompt(data: any): PromptOutput;
}
