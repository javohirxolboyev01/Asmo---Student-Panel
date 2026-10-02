// src/student/pages/CoinsPage.tsx
// "Kosmik maktab" coin balance: hero, earned/spent tiles and full history.
import { useCoinsQuery } from "@/hooks/queries/useCoins";
import { useTranslation } from "@/hooks/useTranslation";
import { getErrorMessage } from "@/lib/toast";
import { formatDate } from "@/utilist/formatData";
import type { CoinRecord } from "@/types/coin";
import { EmptyState, ErrorState, PageHeader, Skel } from "../components/ui";

/** Emoji by source (backend reasons: "Missiya: …", "Kunlik sandiq", "Do'kondan xarid") or sign. */
const coinEmoji = ({ reason, amount }: CoinRecord) => {
  const r = reason.toLowerCase();
  if (r.startsWith("missiya")) return "🎯";
  if (r.includes("sandiq")) return "🛸";
  if (r.includes("do'kon") || r.includes("dokon")) return "🛍";
  return amount >= 0 ? "🪙" : "💸";
};

const CoinsSkeleton = () => (
  <div className="sp-page" aria-busy="true">
    <Skel className="mt-5 h-9 w-2/3" />
    <Skel className="mt-2 h-4 w-1/2" />
    <Skel className="mt-4 h-52 rounded-[30px]" />
    <div className="sp-g3 mt-3">
      <Skel className="h-20" />
      <Skel className="h-20" />
      <Skel className="h-20" />
    </div>
    <div className="sp-panel mt-3.5">
      <Skel className="h-6 w-32" />
      {Array.from({ length: 5 }, (_, i) => (
        <Skel key={i} className="mt-3 h-12" />
      ))}
    </div>
  </div>
);

export const CoinsPage = () => {
  const { t } = useTranslation();
  const { data, isLoading, error, refetch } = useCoinsQuery();

  if (isLoading) return <CoinsSkeleton />;

  // Cached data wins over a failed background refetch (offline, flaky network).
  if (!data) {
    return (
      <div className="sp-page">
        <ErrorState
          message={error ? getErrorMessage(error, t("common.notFound")) : t("common.notFound")}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const { transactions } = data;
  const totalEarned = transactions.filter((h) => h.amount > 0).reduce((sum, h) => sum + h.amount, 0);
  const totalSpent = transactions.filter((h) => h.amount < 0).reduce((sum, h) => sum + Math.abs(h.amount), 0);

  return (
    <div className="sp-page">
      <PageHeader title={t("coins.title")} subtitle={t("coins.subtitle")} />

      <div className="sp-bal">
        <div style={{ fontSize: 48 }} aria-hidden="true">
          💎
        </div>
        <div className="sp-big">{data.balance}</div>
        <div>{t("coins.totalBalance")}</div>
        <div className="sp-bs">
          <span style={{ color: "var(--sp-lime-ink)" }}>↗ +{totalEarned}</span>
          <span style={{ color: "var(--sp-pink-ink)" }}>↘ -{totalSpent}</span>
        </div>
      </div>

      <div className="sp-g3 mt-3">
        <div className="sp-s">
          <b style={{ color: "var(--sp-lime-ink)" }}>+{totalEarned}</b>
          <small>{t("coins.earned")}</small>
        </div>
        <div className="sp-s">
          <b style={{ color: "var(--sp-pink-ink)" }}>-{totalSpent}</b>
          <small>{t("coins.spent")}</small>
        </div>
        <div className="sp-s">
          <b>{transactions.length}</b>
          <small>{t("coins.operations")}</small>
        </div>
      </div>

      <div className="sp-panel mt-3.5">
        <h2>{t("coins.history")}</h2>
        {transactions.length === 0 ? (
          <EmptyState panel={false} emoji="💎" title={t("coins.noTransactions")} text={t("space.coins.noTransactionsHint")} />
        ) : (
          <div>
            {transactions.map((record) => {
              const plus = record.amount > 0;
              return (
                <div key={record.id} className="sp-hr">
                  <span className="text-2xl" aria-hidden="true">
                    {coinEmoji(record)}
                  </span>
                  <span>
                    <span className="block truncate">{record.reason}</span>
                    <small>{formatDate(record.createdAt)}</small>
                  </span>
                  <b style={{ color: plus ? "var(--sp-lime-ink)" : "var(--sp-pink-ink)" }}>
                    {plus ? "+" : ""}
                    {record.amount}
                  </b>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
