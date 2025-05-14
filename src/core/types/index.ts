export interface DCAPlugin {
  name: string;
  sendSwapTransaction(amount: number, fromAddress: string): Promise<string>;
  withdrawTokens(amount: number, toAddress: string): Promise<string>;
  getUSDTBalance(address: string): Promise<number>;
  getNativeBalance(address: string): Promise<number>;
  getNativeTokenValueInUSDT(amount: number): Promise<number>;
}

export enum SupportedDCAChains {
  INJ = 'injective',
  APTOS = 'aptos',
  SONIC = 'sonic',
}

export enum RiskLevel {
  NO_RISK = 'no_risk',
  LOW_RISK = 'low_risk',
  MEDIUM_RISK = 'medium_risk',
  HIGH_RISK = 'high_risk',
}

export enum Frequency {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  TEST_MINUTE = 'test_minute',
  TEST_10_SECONDS = 'test_10_seconds',
}

export interface ITransactionService {
  sendTransaction(amount: number, fromAddress: string, userWalletAddress: string): Promise<string>;
}

// export type Range = '7D' | '1M' | '3M' | 'ALL';

export enum Range {
  ONE_WEEK = '1W',
  ONE_MONTH = '1M',
  THREE_MONTHS = '3M',
  ALL_TIME = 'ALL', // 1 year
}

export type OpenAIBatchOutput = {
  id: string;
  custom_id: string;
  response: {
    status_code: number;
    request_id: string;
    body: {
      id: string;
      object: string;
      created: number;
      model: string;
      choices: Array<{
        index: number;
        message: {
          role: string;
          content: string;
          refusal: string | null;
          annotations: Array<any>;
        };
        logprobs: any | null;
        finish_reason: string;
      }>;
      usage: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
        prompt_tokens_details: {
          cached_tokens: number;
          audio_tokens: number;
        };
        completion_tokens_details: {
          reasoning_tokens: number;
          audio_tokens: number;
          accepted_prediction_tokens: number;
          rejected_prediction_tokens: number;
        };
      };
      service_tier: string;
      system_fingerprint: string | null;
    };
  };
  error: any | null;
};

export type Transaction = {
  id: string;
  /**
   * Type of transaction
   */
  type: 'buy' | 'sell' | 'swap';
  /**
   * Date of the transaction
   */
  createdAt: Date;
  /**
   * Token being sold
   */
  from: {
    /**
     * Token being sold
     */
    token: string;
    /**
     * Amount of tokens being sold
     */
    amount: number;
  };
  /**
   * Token being bought
   */
  to: {
    /**
     * Token being bought
     */
    token: string;
    /**
     * Amount of tokens being bought
     */
    amount: number;
  };
  /**
   * Price of the token at the time of the transaction
   */
  price: number;
  /**
   * Value of the transaction in USD
   */
  value: number;
  /**
   * Amount of money invested in the transaction (in USD)
   */
  invested: number;
  /**
   * ID of the plan that the transaction belongs to
   */
  planId: string;
  /**
   * ID of the user that the transaction belongs to
   */
  userId: string;
  /**
   * Status of the transaction
   */
  status: 'pending' | 'completed' | 'failed';
  /**
   * Hash of the transaction
   */
  txHash: string;
};
