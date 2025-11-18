import { logger } from '../logger';

export interface CurrencyTransaction {
  memberId: string;
  currencyCode: string;
  amount: number;
  reason: string;
  metadata?: Record<string, unknown>;
}

export interface ICurrencyAdapter {
  grantCurrency(transaction: CurrencyTransaction): Promise<void>;
  getBalance(memberId: string, currencyCode: string): Promise<number>;
}

/**
 * In-memory stub implementation for local development
 * In production, this would call the Currency Economy Core API
 */
export class InMemoryCurrencyAdapter implements ICurrencyAdapter {
  private balances: Map<string, Map<string, number>> = new Map();
  private transactions: CurrencyTransaction[] = [];

  async grantCurrency(transaction: CurrencyTransaction): Promise<void> {
    logger.info('Granting currency (in-memory stub)', {
      memberId: transaction.memberId,
      currencyCode: transaction.currencyCode,
      amount: transaction.amount,
      reason: transaction.reason,
    });

    // Update balance
    if (!this.balances.has(transaction.memberId)) {
      this.balances.set(transaction.memberId, new Map());
    }

    const memberBalances = this.balances.get(transaction.memberId)!;
    const currentBalance = memberBalances.get(transaction.currencyCode) || 0;
    memberBalances.set(transaction.currencyCode, currentBalance + transaction.amount);

    // Store transaction
    this.transactions.push({
      ...transaction,
      metadata: {
        ...transaction.metadata,
        processedAt: new Date().toISOString(),
      },
    });
  }

  async getBalance(memberId: string, currencyCode: string): Promise<number> {
    const memberBalances = this.balances.get(memberId);
    if (!memberBalances) return 0;
    return memberBalances.get(currencyCode) || 0;
  }

  // Helper methods for testing/debugging
  getAllBalances(): Map<string, Map<string, number>> {
    return this.balances;
  }

  getTransactions(): CurrencyTransaction[] {
    return [...this.transactions];
  }

  clear(): void {
    this.balances.clear();
    this.transactions = [];
  }
}

// Singleton instance
export const currencyAdapter: ICurrencyAdapter = new InMemoryCurrencyAdapter();
