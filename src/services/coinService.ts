// src/services/coinService.ts
import { apiGet } from "./apiClient";
import { CoinData } from "@/types/coin";
import { normalizeCoinTransaction } from "./normalizers";

interface RawCoinData {
  balance: number;
  transactions?: unknown[];
  history?: unknown[];
}

export const coinService = {
  getCoins: async (): Promise<CoinData> => {
    const data = await apiGet<RawCoinData>("/coins");
    const rawTransactions = data.transactions ?? data.history ?? [];
    return {
      balance: data.balance ?? 0,
      transactions: (rawTransactions as Parameters<typeof normalizeCoinTransaction>[0][]).map(
        normalizeCoinTransaction,
      ),
    };
  },
};
