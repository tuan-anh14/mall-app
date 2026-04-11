export type WalletTransactionType =
  | 'DEPOSIT'
  | 'WITHDRAW'
  | 'PAYMENT'
  | 'REFUND'
  | 'SELLER_INCOME'
  | 'SELLER_FEE_DEDUCTED'
  | 'ADJUSTMENT';

export type WalletTransactionStatus = 'PENDING' | 'COMPLETED' | 'FAILED';

export interface WalletTransaction {
  id: string;
  type: WalletTransactionType;
  status: WalletTransactionStatus;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  orderId: string | null;
  description: string | null;
  gatewayTxnId: string | null;
  createdAt: string;
}

export interface Wallet {
  id: string;
  balance: number;
  updatedAt: string;
}

export interface WalletTransactionsResponse {
  transactions: WalletTransaction[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface WalletStats {
  balance: number;
  totalIncome: number;
  netIncome: number;
  totalFees: number;
  totalSpent: number;
  totalWithdrawn: number;
  totalRefunded: number;
}
