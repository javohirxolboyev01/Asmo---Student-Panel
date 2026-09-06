// src/types/coin.ts
export interface CoinRecord {
  id: string;
  amount: number;
  reason: string;
  createdAt: string;
}

export interface CoinData {
  balance: number;
  transactions: CoinRecord[];
}
