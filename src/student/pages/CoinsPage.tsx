// src/student/pages/CoinsPage.tsx
// Coin balance: big balance with the two next steps (spend in the shop /
// earn with missions), earned/spent/operations tiles and the full history.
import { useCoinsQuery } from "@/hooks/queries/useCoins";
import { useTranslation } from "@/hooks/useTranslation";
import { getErrorMessage } from "@/lib/toast";
import { humanDateTime } from "@/lib/humanDate";
import type { CoinRecord } from "@/types/coin";
import { Link } from "react-router-dom";
import { FlaskConical, Gift, Plus, ShoppingBag, Target, Minus, Gem } from "lucide-react";
import { EmptyState, ErrorState, PageHeader, Skel } from "../components/ui";
import { CoinGlyph, IconTile, type Tint } from "../components/icons";
import type { LucideIcon } from "lucide-react";

/** Symbol by source (backend reasons: "Test: …", "Missiya: …", "Kunlik sandiq", "Do'kondan xarid") or sign. */
const coinIcon = ({ reason, amount }: CoinRecord): { icon: LucideIcon; tint: Tint } => {
  const r = reason.toLowerCase();
  if (r.startsWith("test:")) return { icon: FlaskConical, tint: "blue" };
  if (r.startsWith("missiya")) return { icon: Target, tint: "indigo" };
  if (r.includes("sandiq")) return { icon: Gift, tint: "purple" };
  if (r.includes("do'kon") || r.includes("dokon")) return { icon: ShoppingBag, tint: "orange" };
  return amount >= 0 ? { icon: Plus, tint: "green" } : { icon: Minus, tint: "red" };
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
        <IconTile icon={Gem} tint="teal" size="lg" />
        <div className="sp-big">{data.balance}</div>
        <div>{t("coins.totalBalance")}</div>
        <div className="sp-coins-acts">
          <Link to="/shop" className="sp-cta">
            <ShoppingBag aria-hidden="true" /> {t("space.coins.toShop")}
          </Link>
          <Link to="/" className="sp-cta sp-ghost">
            <Target aria-hidden="true" /> {t("space.coins.earn")}
          </Link>
        </div>
      </div>

      <div className="sp-g3 mt-3">
        <div className="sp-s">
          <b style={{ color: "var(--sp-lime-ink)" }}>+{totalEarned}</b>
          <small>{t("space.coins.earnedLabel")}</small>
        </div>
        <div className="sp-s">
          <b style={{ color: "var(--sp-pink-ink)" }}>-{totalSpent}</b>
          <small>{t("space.coins.spentLabel")}</small>
        </div>
        <div className="sp-s">
          <b>{transactions.length}</b>
          <small>{t("space.coins.opsLabel")}</small>
        </div>
      </div>

      <div className="sp-panel mt-3.5">
        <h2>{t("coins.history")}</h2>
        {transactions.length === 0 ? (
          <EmptyState panel={false} icon={Gem} title={t("coins.noTransactions")} text={t("space.coins.noTransactionsHint")} />
        ) : (
          <div>
            {transactions.map((record) => {
              const plus = record.amount > 0;
              return (
                <div key={record.id} className="sp-hr">
                  <IconTile {...coinIcon(record)} size="sm" />
                  <span>
                    <span className="block truncate">{record.reason}</span>
                    <small>{humanDateTime(record.createdAt, t)}</small>
                  </span>
                  <b style={{ color: plus ? "var(--sp-lime-ink)" : "var(--sp-pink-ink)" }}>
                    {plus ? "+" : ""}
                    {record.amount} <CoinGlyph />
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
