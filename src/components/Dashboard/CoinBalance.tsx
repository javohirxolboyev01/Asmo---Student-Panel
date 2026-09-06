// src/components/Dashboard/CoinBalance.tsx
import { Coins, TrendingUp } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

interface CoinBalanceProps {
  balance: number;
  thisMonth: number;
}

export const CoinBalance = ({ balance, thisMonth }: CoinBalanceProps) => {
  const { t } = useTranslation();
  return (
    <div className="stat-card bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-500/10 dark:to-amber-500/10 border-yellow-200/50 dark:border-yellow-500/20">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-text-secondary mb-1">{t("dashboardWidgets.totalCoins")}</p>
          <p className="text-3xl font-bold text-yellow-600">{balance}</p>
        </div>
        <div className="w-14 h-14 bg-yellow-200/50 dark:bg-yellow-500/20 rounded-full flex items-center justify-center">
          <Coins className="w-8 h-8 text-yellow-500" />
        </div>
      </div>
      <div className="flex items-center gap-1.5 mt-3 text-sm text-green-600">
        <TrendingUp className="w-4 h-4" />
        <span>+{thisMonth} {t("dashboard.thisMonth")}</span>
      </div>
    </div>
  );
};
