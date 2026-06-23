// src/types/coin.ts
export interface CoinRecord {
  id: string;
  amount: number;
  reason: string;
  sourceType: "attendance" | "homework" | "bonus" | "penalty";
  sourceId: string;
  createdAt: string;
}

export interface CoinData {
  balance: number;
  history: CoinRecord[];
}
