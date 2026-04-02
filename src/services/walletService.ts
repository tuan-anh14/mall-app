import { api } from './api';
import type { Wallet, WalletStats, WalletTransactionsResponse } from '@typings/wallet';

const BASE = '/api/v1/wallet';

export const walletService = {
  getWallet: async (): Promise<Wallet> => {
    const res = await api.get<Wallet>(BASE);
    return res.data;
  },

  getTransactions: async (params?: {
    page?: number;
    limit?: number;
  }): Promise<WalletTransactionsResponse> => {
    const res = await api.get<WalletTransactionsResponse>(`${BASE}/transactions`, { params });
    return res.data;
  },

  getStats: async (): Promise<WalletStats> => {
    const res = await api.get<WalletStats>(`${BASE}/stats`);
    return res.data;
  },

  createDeposit: async (dto: {
    amount: number;
    gateway: 'VNPAY';
    returnUrl?: string;
  }): Promise<{ paymentUrl: string }> => {
    const res = await api.post<{ paymentUrl: string }>(`${BASE}/deposit`, dto);
    return res.data;
  },

  withdraw: async (dto: {
    amount: number;
    paymentMethodId?: string;
    bankName?: string;
    bankAccount?: string;
    accountHolder?: string;
  }): Promise<void> => {
    await api.post(`${BASE}/withdraw`, dto);
  },
};
