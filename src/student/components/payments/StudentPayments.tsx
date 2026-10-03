// src/student/components/payments/StudentPayments.tsx
// Student-only "Kosmik maktab" version of the shared PaymentsView: stats,
// search, status/type filters, list with "show more", per-payment details.
import { useMemo, useState } from "react";
import { CreditCard, ReceiptText } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { usePaymentsQuery } from "@/hooks/queries/usePayments";
import type { RawPayment } from "@/services/paymentService";
import { formatDate, formatTime } from "@/utilist/formatData";
import { getErrorMessage } from "@/lib/toast";
import {
  EmptyState,
  ErrorState,
  Modal,
  PageHeader,
  SearchBox,
  Skel,
} from "../ui";
import "../../theme/payments.css";

type Status = RawPayment["status"];
type PayType = RawPayment["paymentType"];

const STATUS: Record<
  Status,
  { labelKey: string; badge: string; emoji: string }
> = {
  paid: { labelKey: "payments.statusPaid", badge: "sp-badge", emoji: "✅" },
  pending: {
    labelKey: "payments.statusPending",
    badge: "sp-badge sp-sun",
    emoji: "⏳",
  },
  overdue: {
    labelKey: "payments.statusOverdue",
    badge: "sp-badge sp-pink",
    emoji: "⚠️",
  },
  cancelled: {
    labelKey: "payments.statusCancelled",
    badge: "sp-badge sp-mute",
    emoji: "✖️",
  },
};

const TYPES: Record<
  PayType,
  { labelKey?: string; label?: string; emoji: string }
> = {
  cash: { labelKey: "payments.typeCash", emoji: "💵" },
  click: { label: "Click", emoji: "📱" },
  payme: { label: "Payme", emoji: "📲" },
  bank: { labelKey: "payments.typeBank", emoji: "🏦" },
  uzum: { label: "Uzum", emoji: "🍇" },
};

const PAGE_SIZE = 10;

const PaymentsSkeleton = () => (
  <div className="sp-page" aria-busy="true">
    <Skel className="mt-5 h-9 w-2/3" />
    <Skel className="mt-2 mb-5 h-4 w-1/2" />
    <div className="sp-sums">
      <Skel className="h-24" />
      <Skel className="h-24" />
      <Skel className="h-24" />
    </div>
    <div className="sp-frow">
      <Skel className="h-12 flex-1" />
      <Skel className="h-12 w-28" />
    </div>
    <div className="sp-panel">
      <Skel className="mb-4 h-6 w-48" />
      {Array.from({ length: 4 }, (_, i) => (
        <Skel key={i} className="mb-2.5 h-20" />
      ))}
    </div>
  </div>
);

export const StudentPayments = () => {
  const { t } = useTranslation();
  const { data, isLoading, error, refetch, isRefetching } = usePaymentsQuery();
  const raw = data ?? [];

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<Status | "all">("all");
  const [type, setType] = useState<PayType | "all">("all");
  const [showFilters, setShowFilters] = useState(false);
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [openId, setOpenId] = useState<string | null>(null);

  const money = (n: number) =>
    t("space.payments.sum", { n: new Intl.NumberFormat("uz-UZ").format(n) });
  const typeLabel = (k: PayType) => {
    const cfg = TYPES[k] ?? TYPES.cash;
    return cfg.labelKey ? t(cfg.labelKey) : (cfg.label ?? k);
  };

  const payments = raw as RawPayment[];

  const stats = useMemo(() => {
    const paid = payments.filter((p) => p.status === "paid");
    const unpaid = payments.filter(
      (p) => p.status === "pending" || p.status === "overdue",
    );
    // Payments come newest first; pick the most recent paid date defensively.
    const last = paid
      .filter((p) => p.paidAt)
      .sort(
        (a, b) => new Date(b.paidAt!).getTime() - new Date(a.paidAt!).getTime(),
      )[0];
    return {
      totalPaid: paid.reduce((s, p) => s + (p.amountNumber || 0), 0),
      paidCount: paid.length,
      debt: unpaid.reduce((s, p) => s + (p.amountNumber || 0), 0),
      unpaidCount: unpaid.length,
      lastPaidAt: last?.paidAt ?? null,
    };
  }, [payments]);

  const countBy = useMemo(() => {
    const byStatus: Partial<Record<Status, number>> = {};
    const byType: Partial<Record<PayType, number>> = {};
    for (const p of payments) {
      byStatus[p.status] = (byStatus[p.status] ?? 0) + 1;
      byType[p.paymentType] = (byType[p.paymentType] ?? 0) + 1;
    }
    return { byStatus, byType };
  }, [payments]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const qDigits = q.replace(/\D/g, "");
    return payments.filter((p) => {
      if (status !== "all" && p.status !== status) return false;
      if (type !== "all" && p.paymentType !== type) return false;
      if (!q) return true;
      return (
        (p.teacherName ?? "").toLowerCase().includes(q) ||
        money(p.amountNumber).toLowerCase().includes(q) ||
        (qDigits !== "" && String(p.amountNumber).includes(qDigits)) ||
        String(p.orderNumber).includes(q.replace(/^#/, "")) ||
        (p.description ?? "").toLowerCase().includes(q) ||
        (p.receiptNumber ?? "").toLowerCase().includes(q.replace(/^#/, ""))
      );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payments, query, status, type, t]);

  const activeFilters = (status !== "all" ? 1 : 0) + (type !== "all" ? 1 : 0);
  const clearFilters = () => {
    setStatus("all");
    setType("all");
    setLimit(PAGE_SIZE);
  };
  const onQuery = (v: string) => {
    setQuery(v);
    setLimit(PAGE_SIZE);
  };

  if (isLoading) return <PaymentsSkeleton />;

  // Cached data wins over a failed background refetch (offline, flaky network).
  if (error && !data) {
    return (
      <div className="sp-page">
        <ErrorState
          message={getErrorMessage(error, t("payments.loadError"))}
          onRetry={() => refetch()}
        />
        {isRefetching && (
          <p className="sp-msg text-center">{t("common.loading")}</p>
        )}
      </div>
    );
  }

  const visible = filtered.slice(0, limit);
  const rest = filtered.length - visible.length;
  const selected = openId
    ? (payments.find((p) => p.id === openId) ?? null)
    : null;

  return (
    <div className="sp-page">
      <PageHeader
        title={t("payments.title")}
        subtitle={t("payments.subtitle")}
        right={
          <div className="sp-pill">
            🧾 {t("payments.countSuffix", { count: payments.length })}
          </div>
        }
      />

      <div className="sp-sums">
        <div className="sp-s sp-sm">
          <small>{t("payments.totalPaid")}</small>
          <b>{money(stats.totalPaid)}</b>
          {stats.lastPaidAt && (
            <small>
              {t("payments.lastPayment", {
                date: formatDate(stats.lastPaidAt),
              })}
            </small>
          )}
        </div>
        <div className="sp-s sp-sm">
          <small>{t("payments.status")}</small>
          {stats.debt > 0 ? (
            <>
              <b style={{ color: "var(--sp-pink-ink)" }}>{money(stats.debt)}</b>
              <small>
                {t("space.payments.debtSub", { count: stats.unpaidCount })}
              </small>
            </>
          ) : (
            <>
              <b style={{ color: "var(--sp-lime-ink)" }}>
                {t("payments.noDebt")}
              </b>
              <small>{t("payments.allPaidDesc")}</small>
            </>
          )}
        </div>
        <div className="sp-s sp-sm">
          <small>{t("payments.totalTransactions")}</small>
          <b>{t("payments.countSuffix", { count: payments.length })}</b>
          <small>
            {t("payments.paidCountSuffix", { count: stats.paidCount })}
          </small>
        </div>
      </div>

      <div className="sp-frow">
        <SearchBox
          className="flex-1"
          value={query}
          onChange={onQuery}
          placeholder={t("payments.searchPlaceholder")}
        />
        <button
          type="button"
          className={activeFilters > 0 ? "sp-btn on" : "sp-btn"}
          onClick={() => setShowFilters((v) => !v)}
          aria-expanded={showFilters}
          aria-controls="sp-pay-filters"
        >
          ⚙ {t("payments.filter")}
          {activeFilters > 0 && (
            <span className="sp-pay-fdot" aria-hidden="true" />
          )}
        </button>
      </div>

      {showFilters && (
        <div id="sp-pay-filters" className="sp-panel sp-pay-filters">
          <div>
            <span className="sp-pay-flabel">
              {t("payments.filterByStatus")}
            </span>
            <div
              className="sp-chipbar"
              role="group"
              aria-label={t("payments.filterByStatus")}
            >
              <button
                type="button"
                className={status === "all" ? "on" : undefined}
                aria-pressed={status === "all"}
                onClick={() => {
                  setStatus("all");
                  setLimit(PAGE_SIZE);
                }}
              >
                {t("common.all")}
              </button>
              {(Object.keys(STATUS) as Status[]).map((k) => (
                <button
                  key={k}
                  type="button"
                  className={status === k ? "on" : undefined}
                  aria-pressed={status === k}
                  onClick={() => {
                    setStatus(k);
                    setLimit(PAGE_SIZE);
                  }}
                >
                  {STATUS[k].emoji} {t(STATUS[k].labelKey)}
                  <span>{countBy.byStatus[k] ?? 0}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <span className="sp-pay-flabel">{t("payments.filterByType")}</span>
            <div
              className="sp-chipbar"
              role="group"
              aria-label={t("payments.filterByType")}
            >
              <button
                type="button"
                className={type === "all" ? "on" : undefined}
                aria-pressed={type === "all"}
                onClick={() => {
                  setType("all");
                  setLimit(PAGE_SIZE);
                }}
              >
                {t("common.all")}
              </button>
              {(Object.keys(TYPES) as PayType[]).map((k) => (
                <button
                  key={k}
                  type="button"
                  className={type === k ? "on" : undefined}
                  data-payment-type={k}
                  aria-pressed={type === k}
                  onClick={() => {
                    setType(k);
                    setLimit(PAGE_SIZE);
                  }}
                >
                  {k === "uzum" ? (
                    <span className="sp-pay-uzum-mark" aria-hidden="true">
                      <CreditCard />
                    </span>
                  ) : (
                    TYPES[k].emoji
                  )}{" "}
                  {typeLabel(k)}
                  <span>{countBy.byType[k] ?? 0}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="sp-pay-factions">
            <span>
              {activeFilters > 0
                ? t("space.payments.activeFilters", { count: activeFilters })
                : t("space.payments.noFilters")}
            </span>
            {activeFilters > 0 && (
              <button
                type="button"
                className="sp-mute-btn"
                onClick={clearFilters}
              >
                ✕ {t("space.payments.clearFilters")}
              </button>
            )}
          </div>
        </div>
      )}

      {payments.length === 0 ? (
        <EmptyState
          emoji="🧾"
          title={t("space.payments.emptyTitle")}
          text={t("space.payments.emptyHint")}
        />
      ) : (
        <div className="sp-panel">
          <h2 className="sp-pay-head">
            {t("space.payments.listTitle")}
            <small>
              ({t("payments.countSuffix", { count: filtered.length })})
            </small>
          </h2>

          {filtered.length === 0 ? (
            <EmptyState
              panel={false}
              emoji="🔭"
              title={t("space.payments.noResultsTitle")}
              text={
                query.trim()
                  ? t("space.payments.noResultsQuery", { query: query.trim() })
                  : t("space.payments.noResultsFilters")
              }
              action={
                <div className="flex flex-wrap justify-center gap-2">
                  {query && (
                    <button
                      type="button"
                      className="sp-cta sp-ghost"
                      onClick={() => onQuery("")}
                    >
                      ✕ {query.trim()}
                    </button>
                  )}
                  {activeFilters > 0 && (
                    <button
                      type="button"
                      className="sp-cta"
                      onClick={clearFilters}
                    >
                      {t("space.payments.clearFilters")}
                    </button>
                  )}
                </div>
              }
            />
          ) : (
            <>
              {visible.map((p) => {
                const st = STATUS[p.status] ?? STATUS.pending;
                const ty = TYPES[p.paymentType] ?? TYPES.cash;
                return (
                  <button
                    key={p.id}
                    type="button"
                    className="sp-row sp-pay-row"
                    onClick={() => setOpenId(p.id)}
                    aria-label={`${t("space.payments.open")} #${p.orderNumber}`}
                  >
                    <div className="sp-ic" aria-hidden="true">
                      {ty.emoji}
                    </div>
                    <div className="sp-t">
                      <b>{money(p.amountNumber)}</b>
                      <small>
                        👩‍🏫 {p.teacherName || "—"} · {typeLabel(p.paymentType)}
                      </small>
                      <small>
                        📅{" "}
                        {p.paidAt
                          ? `${formatDate(p.paidAt)} · ${formatTime(p.paidAt)}`
                          : t("space.payments.notPaidYet")}
                        {p.receiptNumber ? ` · 🧾 #${p.receiptNumber}` : ""}
                      </small>
                      {p.description && (
                        <small className="sp-pay-desc">{p.description}</small>
                      )}
                    </div>
                    <div className="sp-pay-end">
                      <span className={st.badge}>{t(st.labelKey)}</span>
                      <small>#{p.orderNumber}</small>
                    </div>
                  </button>
                );
              })}
              {rest > 0 && (
                <button
                  type="button"
                  className="sp-btn sp-pay-more"
                  onClick={() => setLimit((l) => l + PAGE_SIZE)}
                >
                  {t("space.payments.showMore", { count: rest })}
                </button>
              )}
            </>
          )}
        </div>
      )}

      <Modal
        open={Boolean(selected)}
        onClose={() => setOpenId(null)}
        wide
        labelledBy="sp-pay-title"
      >
        {selected && (
          <>
            <div className="sp-pay-modal-icon" aria-hidden="true">
              <ReceiptText
                size={42}
                strokeWidth={1.8}
                style={{ color: "var(--sp-ink)", opacity: 0.85 }}
              />
            </div>
            <h2 id="sp-pay-title" className="text-center">
              {t("space.payments.detailsTitle", { n: selected.orderNumber })}
            </h2>
            <div className="sp-pay-amount">{money(selected.amountNumber)}</div>
            <dl className="sp-pay-dl">
              <div>
                <dt>{t("space.payments.fieldStatus")}</dt>
                <dd>
                  <span
                    className={
                      (STATUS[selected.status] ?? STATUS.pending).badge
                    }
                  >
                    {t((STATUS[selected.status] ?? STATUS.pending).labelKey)}
                  </span>
                </dd>
              </div>
              <div>
                <dt>{t("space.payments.fieldType")}</dt>
                <dd>{typeLabel(selected.paymentType)}</dd>
              </div>
              <div>
                <dt>{t("space.payments.fieldTeacher")}</dt>
                <dd>{selected.teacherName || "—"}</dd>
              </div>
              <div>
                <dt>{t("space.payments.fieldDate")}</dt>
                <dd>
                  {selected.paidAt
                    ? formatDate(selected.paidAt)
                    : t("space.payments.notPaidYet")}
                </dd>
              </div>
              {selected.paidAt && (
                <div>
                  <dt>{t("space.payments.fieldTime")}</dt>
                  <dd>{formatTime(selected.paidAt)}</dd>
                </div>
              )}
              <div>
                <dt>{t("space.payments.fieldOrder")}</dt>
                <dd>#{selected.orderNumber}</dd>
              </div>
              {selected.receiptNumber && (
                <div>
                  <dt>{t("space.payments.fieldReceipt")}</dt>
                  <dd>#{selected.receiptNumber}</dd>
                </div>
              )}
              {selected.description && (
                <div>
                  <dt>{t("space.payments.fieldNote")}</dt>
                  <dd>{selected.description}</dd>
                </div>
              )}
            </dl>
            <div className="text-center">
              <button
                type="button"
                className="sp-cta"
                onClick={() => setOpenId(null)}
              >
                {t("nav.close")}
              </button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
};
