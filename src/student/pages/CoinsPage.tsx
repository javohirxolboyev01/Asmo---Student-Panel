// src/student/pages/CoinsPage.tsx
import { useCoinsQuery } from "@/hooks/queries/useCoins";
import { Coins, TrendingUp, TrendingDown } from "lucide-react";

import { formatDate } from "@/utilist/formatData";
import { cn } from "@/lib/utils";
import { Skeleton, SkeletonHeader, SkeletonStatGrid, SkeletonList } from "@/components/common/Skeleton";
import { Button } from "@/components/ui";
import { useTranslation } from "@/hooks/useTranslation";
import { getErrorMessage } from "@/lib/toast";

interface CoinRecord {
  id: string;
  amount: number;
  reason: string;
  createdAt: string;
}

export const CoinsPage = () => {
  const { t } = useTranslation();
  const { data, isLoading, error, refetch } = useCoinsQuery();

  if (isLoading) {
    return (
      <div className="space-y-4 md:space-y-6">
        <SkeletonHeader />
        <Skeleton className="w-full h-40 rounded-2xl" />
        <SkeletonStatGrid count={3} />
        <div className="card p-5">
          <Skeleton className="w-32 h-5 mb-4" />
          <SkeletonList rows={5} withAvatar />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="card p-8 text-center">
        <p className="text-red-500">{error ? getErrorMessage(error, t("common.notFound")) : t("common.notFound")}</p>
        <Button onClick={() => refetch()} className="mt-4">
          {t("common.retry")}
        </Button>
      </div>
    );
  }

  const totalEarned = data.transactions
    .filter((h: CoinRecord) => h.amount > 0)
    .reduce((sum: number, h: CoinRecord) => sum + h.amount, 0);
  const totalSpent = data.transactions
    .filter((h: CoinRecord) => h.amount < 0)
    .reduce((sum: number, h: CoinRecord) => sum + Math.abs(h.amount), 0);

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-lg md:text-xl font-bold text-gray-800 dark:text-gray-100">
            {t("coins.title")}
          </h1>
          <p className="text-gray-500 text-sm md:text-base">
            {t("coins.subtitle")}
          </p>
        </div>
      </div>

      {/* Balance Card */}
      <div className="bg-gradient-to-br from-[#FFF8E1] to-[#FFECB3] dark:from-warning/15 dark:to-warning/5 rounded-2xl p-6 md:p-8 text-center border border-[#FFE082]/30 dark:border-warning/20">
        <div className="flex items-center justify-center mb-3">
          <Coins className="w-12 h-12 text-warning" />
        </div>
        <p className="text-5xl font-bold text-warning">{data.balance}</p>
        <p className="text-gray-600 dark:text-gray-300 mt-1">{t("coins.totalBalance")}</p>
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
          <p className="text-xs text-gray-500">{t("coins.earned")}</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-lg font-bold text-[#C62828]">-{totalSpent}</p>
          <p className="text-xs text-gray-500">{t("coins.spent")}</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-lg font-bold text-gray-800 dark:text-gray-100">
            {data.transactions.length}
          </p>
          <p className="text-xs text-gray-500">{t("coins.operations")}</p>
        </div>
      </div>

      {/* History */}
      <div className="card">
        <div className="p-5">
          <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-4">
            {t("coins.history")}
          </h3>
          <div className="space-y-3">
            {data.transactions.map((record: CoinRecord) => (
              <div
                key={record.id}
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/5 rounded-2xl"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
                      record.amount > 0
                        ? "bg-[#E8F5E9] dark:bg-[#2E7D32]/15"
                        : "bg-[#FFEBEE] dark:bg-[#C62828]/15",
                    )}
                  >
                    {record.amount > 0 ? (
                      <TrendingUp className="w-5 h-5 text-[#2E7D32]" />
                    ) : (
                      <TrendingDown className="w-5 h-5 text-[#C62828]" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">
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
            {data.transactions.length === 0 && (
              <div className="text-center py-8">
                <Coins className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">{t("coins.noTransactions")}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
