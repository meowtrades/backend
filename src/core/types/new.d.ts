/**
 * Represents a transaction from one token to another
 */
type Transaction = {
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
