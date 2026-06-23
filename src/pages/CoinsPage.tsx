// src/pages/CoinsPage.tsx
import { useEffect, useState } from "react";
import { coinService } from "@/services/coinService";
import { Coins, TrendingUp, TrendingDown } from "lucide-react";

import { formatDate } from "@/utilist/formatData";
import { cn } from "@/lib/utils";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";

interface CoinRecord {
  id: string;
  amount: number;
  reason: string;
  sourceType: string;
  sourceId: string;
  createdAt: string;
}

interface CoinData {
  balance: number;
  history: CoinRecord[];
}

export const CoinsPage = () => {
  const [data, setData] = useState<CoinData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await coinService.getCoins();
        setData(result);
      } catch (err) {
        setError("Ma'lumotlarni yuklashda xatolik yuz berdi");
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" text="Yuklanmoqda..." />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="card p-8 text-center">
        <p className="text-red-500">{error || "Ma'lumotlar topilmadi"}</p>
        <button
          onClick={() => window.location.reload()}
          className="btn-primary mt-4"
        >
          Qayta urinish
        </button>
      </div>
    );
  }

  const totalEarned = data.history
    .filter((h: CoinRecord) => h.amount > 0)
    .reduce((sum: number, h: CoinRecord) => sum + h.amount, 0);
  const totalSpent = data.history
    .filter((h: CoinRecord) => h.amount < 0)
    .reduce((sum: number, h: CoinRecord) => sum + Math.abs(h.amount), 0);

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#1A1D26]">
            Coin balansim
          </h1>
          <p className="text-gray-500 text-sm md:text-base">
            Balans va operatsiyalar tarixi
          </p>
        </div>
      </div>

      {/* Balance Card */}
      <div className="bg-gradient-to-br from-[#FFF8E1] to-[#FFECB3] rounded-2xl p-6 md:p-8 text-center border border-[#FFE082]/30">
        <div className="flex items-center justify-center mb-3">
          <Coins className="w-12 h-12 text-[#F59E0B]" />
        </div>
        <p className="text-5xl font-bold text-[#F59E0B]">{data.balance}</p>
        <p className="text-gray-600 mt-1">Jami coin balansi</p>
        <div className="flex items-center justify-center gap-6 mt-3 text-sm">
          <div className="flex items-center gap-1.5 text-[#2E7D32]">
            <TrendingUp className="w-4 h-4" />
            <span>+{totalEarned}</span>
          </div>
          <div className="flex items-center gap-1.5 text-[#C62828]">
            <TrendingDown className="w-4 h-4" />
            <span>-{totalSpent}</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card p-4 text-center">
          <p className="text-lg font-bold text-[#2E7D32]">+{totalEarned}</p>
          <p className="text-xs text-gray-500">Yig'ilgan</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-lg font-bold text-[#C62828]">-{totalSpent}</p>
          <p className="text-xs text-gray-500">Sarflangan</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-lg font-bold text-[#1A1D26]">
            {data.history.length}
          </p>
          <p className="text-xs text-gray-500">Amallar</p>
        </div>
      </div>

      {/* History */}
      <div className="card">
        <div className="p-5">
          <h3 className="font-semibold text-[#1A1D26] mb-4">📋 Coin tarixi</h3>
          <div className="space-y-3">
            {data.history.map((record: CoinRecord) => (
              <div
                key={record.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
                      record.amount > 0 ? "bg-[#E8F5E9]" : "bg-[#FFEBEE]",
                    )}
                  >
                    {record.amount > 0 ? (
                      <TrendingUp className="w-5 h-5 text-[#2E7D32]" />
                    ) : (
                      <TrendingDown className="w-5 h-5 text-[#C62828]" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[#1A1D26] truncate">
                      {record.reason}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDate(record.createdAt)}
                    </p>
                  </div>
                </div>
                <span
                  className={cn(
                    "text-base font-bold flex-shrink-0",
                    record.amount > 0 ? "text-[#2E7D32]" : "text-[#C62828]",
                  )}
                >
                  {record.amount > 0 ? "+" : ""}
                  {record.amount}
                </span>
              </div>
            ))}
            {data.history.length === 0 && (
              <div className="text-center py-8">
                <Coins className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Hali operatsiyalar yo'q</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
