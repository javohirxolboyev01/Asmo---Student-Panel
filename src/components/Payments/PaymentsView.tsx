// src/components/Payments/PaymentsView.tsx
// Teacher panel payments ("Ustoz paneli" look): summary, search, status/type
// filters and the list. Row actions and modals come from the page.
import { ReactNode, useEffect, useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  Banknote,
  Calendar,
  CircleCheck,
  CircleX,
  Clock as ClockIcon,
  CreditCard as CardIcon,
  Receipt,
  Search,
  Smartphone,
  User,
  type LucideIcon,
} from "lucide-react";
import { usePaymentsQuery } from "@/hooks/queries/usePayments";
import { formatDate, formatTime } from "@/utilist/formatData";
import { useTranslation } from "@/hooks/useTranslation";
import { Button, Input } from "@/components/ui";
import { getErrorMessage } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { EmptyBox, PageHeader, SectionHead, Seg, Skel, Tag, type Tone } from "@/teacher/components/ui";

export interface Payment {
  id: string;
  orderNumber: number;
  amount: string;
  amountNumber: number;
  status: "paid" | "pending" | "overdue" | "cancelled";
  paymentType: "cash" | "click" | "payme" | "bank" | "uzum";
  date: string;
  time: string;
  teacherName: string;
  description?: string;
  receiptNumber?: string;
  userId?: string;
  studentName?: string;
}

interface RawPayment {
  id: string;
  orderNumber: number;
  amountNumber: number;
  status: Payment["status"];
  paymentType: Payment["paymentType"];
  paidAt: string | null;
  teacherName: string;
  description?: string;
  receiptNumber?: string;
  userId?: string;
  studentName?: string;
}

export const paymentTypeConfig: Record<
  Payment["paymentType"],
  { icon: LucideIcon; tone: Tone; label?: string; labelKey?: string }
> = {
  cash: { icon: Banknote, labelKey: "payments.typeCash", tone: "ok" },
  click: { icon: Smartphone, label: "Click", tone: "pr" },
  payme: { icon: Smartphone, label: "Payme", tone: "pr" },
  bank: { icon: CardIcon, labelKey: "payments.typeBank", tone: "gd" },
  uzum: { icon: Smartphone, label: "Uzum", tone: "mu" },
};

export const statusConfig = {
  paid: { labelKey: "payments.statusPaid" as const, tone: "ok" as Tone, icon: CircleCheck },
  pending: { labelKey: "payments.statusPending" as const, tone: "gd" as Tone, icon: ClockIcon },
  overdue: { labelKey: "payments.statusOverdue" as const, tone: "er" as Tone, icon: AlertCircle },
  cancelled: { labelKey: "payments.statusCancelled" as const, tone: "mu" as Tone, icon: CircleX },
};

/** Tone → (background, foreground) mock colours. */
const TONE_COLORS: Record<Tone, { background: string; color: string }> = {
  ok: { background: "var(--okt)", color: "var(--ok)" },
  er: { background: "var(--ert)", color: "var(--er)" },
  gd: { background: "var(--gdt)", color: "var(--gdx)" },
  pr: { background: "var(--prt)", color: "var(--pr)" },
  mu: { background: "var(--sf2)", color: "var(--mu)" },
};

/** Rows shown before "Barchasini ko'rish". */
/** Rows rendered at first and added per "show more" click (keeps the DOM small). */
const PAGE_SIZE = 30;

export const formatAmount = (amount: number) => new Intl.NumberFormat("uz-UZ").format(amount) + " so'm";

interface PaymentsViewProps {
  /** Rendered at the right of the page header. */
  headerActions?: ReactNode;
  /** Rendered at the right of each payment row. */
  renderPaymentActions: (payment: Payment) => ReactNode;
  /** Show the student's name on each row instead of the teacher's. */
  showStudentName?: boolean;
  /** Rendered after the list (e.g. modals). */
  children?: ReactNode;
}

export const PaymentsView = ({
  headerActions,
  renderPaymentActions,
  showStudentName = false,
  children,
}: PaymentsViewProps) => {
  const { t } = useTranslation();
  const getLabel = (item: { label?: string; labelKey?: string }) =>
    item.labelKey ? t(item.labelKey) : (item.label ?? "");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  // A new search or filter starts again from the first page of rows.
  useEffect(() => setVisibleCount(PAGE_SIZE), [searchQuery, filterStatus, filterType]);

  const { data: rawPayments = [], isLoading, error, refetch, isFetching } = usePaymentsQuery();

  if (isLoading) {
    return (
      <div aria-busy="true">
        <Skel className="mt-2 h-8 w-1/2 rounded-xl" />
        <Skel className="mt-2 h-4 w-1/3 rounded-lg" />
        <Skel className="mt-5 h-[150px]" />
        <div className="u-stats3 mt-3">
          {[0, 1, 2].map((i) => (
            <Skel key={i} className="h-[76px] rounded-[18px]" />
          ))}
        </div>
        <Skel className="mt-5 h-[52px] rounded-[14px]" />
        <div className="u-stack mt-5">
          {[0, 1, 2, 3].map((i) => (
            <Skel key={i} className="h-[88px] rounded-[20px]" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <>
        <PageHeader title={t("payments.title")} right={headerActions} />
        <EmptyBox
          icon={AlertTriangle}
          tone="er"
          title={getErrorMessage(error, t("payments.loadError"))}
          action={
            <Button onClick={() => refetch()} isLoading={isFetching}>
              {t("common.retry")}
            </Button>
          }
        />
        {children}
      </>
    );
  }

  const payments: Payment[] = (rawPayments as RawPayment[]).map((p) => ({
    id: p.id,
    orderNumber: p.orderNumber,
    amount: formatAmount(p.amountNumber),
    amountNumber: p.amountNumber,
    status: p.status,
    paymentType: p.paymentType,
    date: formatDate(p.paidAt),
    time: formatTime(p.paidAt),
    teacherName: p.teacherName,
    description: p.description,
    receiptNumber: p.receiptNumber,
    userId: p.userId,
    studentName: p.studentName,
  }));

  const query = searchQuery.trim().toLowerCase();
  const filteredPayments = payments
    .filter(
      (p) =>
        !query ||
        p.teacherName?.toLowerCase().includes(query) ||
        p.studentName?.toLowerCase().includes(query) ||
        p.amount.includes(searchQuery.trim()) ||
        String(p.amountNumber).includes(query.replace(/\s/g, "")) ||
        p.description?.toLowerCase().includes(query) ||
        p.receiptNumber?.toLowerCase().includes(query),
    )
    .filter((p) => filterStatus === "all" || p.status === filterStatus)
    .filter((p) => filterType === "all" || p.paymentType === filterType);

  const sumOf = (list: Payment[]) => list.reduce((sum, p) => sum + p.amountNumber, 0);
  const byStatus = (status: Payment["status"]) => payments.filter((p) => p.status === status);
  const totalPaid = sumOf(byStatus("paid"));
  const debt = sumOf([...byStatus("pending"), ...byStatus("overdue")]);
  const lastPayment = payments.find((p) => p.status === "paid");
  // Totals above use the full list; only the rendered rows are limited.
  const visible = filteredPayments.slice(0, visibleCount);
  const remaining = filteredPayments.length - visible.length;

  const statusOptions = [
    { value: "all", label: t("us.manage.all") },
    ...Object.entries(statusConfig).map(([key, value]) => ({ value: key, label: getLabel(value) })),
  ];

  return (
    <>
      <PageHeader
        title={t("payments.title")}
        subtitle={`${t("us.manage.paySub")} · ${t("payments.countSuffix", { count: payments.length })}`}
        right={headerActions}
      />

      {/* Summary: total paid + debt state, then counts per status */}
      <section className="u-card">
        <div className="flex items-start gap-3.5">
          <span className="u-mi" style={TONE_COLORS.ok}>
            <Receipt className="u-i" strokeWidth={2} aria-hidden="true" />
          </span>
          <div className="flex-1 min-w-0">
            <p className="u-sub !mt-0 text-sm font-bold">{t("payments.totalPaid")}</p>
            <p className="font-fd text-[28px] font-extrabold leading-tight break-words">{formatAmount(totalPaid)}</p>
            {lastPayment && <p className="u-sub text-sm">{t("payments.lastPayment", { date: lastPayment.date })}</p>}
          </div>
        </div>
        <div className="mt-3.5 flex flex-wrap items-center gap-2">
          {debt > 0 ? (
            <Tag tone="er">
              <AlertCircle className="u-i s" strokeWidth={2} aria-hidden="true" />
              {t("us.manage.debt", { sum: formatAmount(debt) })}
            </Tag>
          ) : (
            <>
              <Tag tone="ok">
                <CircleCheck className="u-i s" strokeWidth={2} aria-hidden="true" />
                {t("payments.noDebt")}
              </Tag>
              {payments.length > 0 && <span className="u-sub !mt-0 text-sm">{t("payments.allPaidDesc")}</span>}
            </>
          )}
        </div>
      </section>

      <div className="u-stats3 mt-3">
        {(["paid", "pending", "overdue"] as const).map((key) => (
          <button
            key={key}
            type="button"
            aria-pressed={filterStatus === key}
            onClick={() => setFilterStatus(filterStatus === key ? "all" : key)}
            className={cn(
              "min-h-[44px] px-2 py-3.5 text-center transition-shadow",
              filterStatus === key && "shadow-[inset_0_0_0_2px_rgb(var(--u-pr))]",
            )}
          >
            <b style={{ color: TONE_COLORS[statusConfig[key].tone].color }}>{byStatus(key).length}</b>
            <span>{getLabel(statusConfig[key])}</span>
          </button>
        ))}
      </div>

      {/* Search + filters */}
      <div className="u-sec">
        <Input
          type="search"
          placeholder={t("us.manage.paySearch")}
          aria-label={t("us.manage.paySearch")}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          leftIcon={<Search className="w-[18px] h-[18px]" />}
          uiSize="lg"
        />
        <div className="mt-3.5 grid gap-2.5">
          <Seg
            value={filterStatus}
            options={statusOptions}
            onChange={setFilterStatus}
            small
            label={t("payments.filterByStatus")}
            className="justify-self-start"
          />
          <div className="u-chips sc" role="radiogroup" aria-label={t("payments.filterByType")}>
            <button
              type="button"
              role="radio"
              aria-checked={filterType === "all"}
              className={cn("u-chip", filterType === "all" && "sel")}
              onClick={() => setFilterType("all")}
            >
              {t("us.manage.all")}
            </button>
            {Object.entries(paymentTypeConfig).map(([key, value]) => (
              <button
                key={key}
                type="button"
                role="radio"
                aria-checked={filterType === key}
                className={cn("u-chip", filterType === key && "sel")}
                onClick={() => setFilterType(key)}
              >
                <value.icon className="u-i s" strokeWidth={2} aria-hidden="true" />
                {getLabel(value)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* List */}
      <section className="u-sec">
        <SectionHead
          title={t("payments.list")}
          right={<Tag tone="mu">{t("payments.countSuffix", { count: filteredPayments.length })}</Tag>}
        />

        {filteredPayments.length === 0 ? (
          <EmptyBox
            icon={Receipt}
            tone="mu"
            title={t("payments.notFound")}
            text={searchQuery ? t("payments.noSearchResults", { query: searchQuery }) : t("payments.noPaymentsYet")}
          />
        ) : (
          <>
            <div className="u-stack">
              {visible.map((payment) => {
                const status = statusConfig[payment.status] ?? statusConfig.pending;
                const StatusIcon = status.icon;
                const type = paymentTypeConfig[payment.paymentType] ?? paymentTypeConfig.cash;
                const TypeIcon = type.icon;
                const who = showStudentName && payment.studentName ? payment.studentName : payment.teacherName;
                const hasDate = payment.date !== "-";

                return (
                  <div key={payment.id} className="u-les flex-wrap !items-start sm:!items-center">
                    <span className="u-mi" style={TONE_COLORS[type.tone]} aria-hidden="true">
                      <TypeIcon className="u-i" strokeWidth={2} />
                    </span>
                    <div className="flex-1 min-w-[170px]">
                      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                        <b className="font-fd text-[19px] font-extrabold leading-tight">{payment.amount}</b>
                        <Tag tone={status.tone}>
                          <StatusIcon className="u-i s" strokeWidth={2} aria-hidden="true" />
                          {getLabel(status)}
                        </Tag>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[13.5px] font-semibold text-u-mu">
                        <span className="inline-flex items-center gap-1.5 min-w-0 text-u-tx">
                          <User className="u-i s flex-none" strokeWidth={2} aria-hidden="true" />
                          <span className="truncate">{who}</span>
                        </span>
                        <span>{getLabel(type)}</span>
                        {hasDate && (
                          <span className="inline-flex items-center gap-1.5">
                            <Calendar className="u-i s" strokeWidth={2} aria-hidden="true" />
                            {payment.date}, {payment.time}
                          </span>
                        )}
                        <span>#{payment.orderNumber}</span>
                        {payment.receiptNumber && <span>№ {payment.receiptNumber}</span>}
                      </div>
                      {payment.description && (
                        <p className="mt-1 text-[13.5px] text-u-mu break-words">{payment.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-none ml-auto">{renderPaymentActions(payment)}</div>
                  </div>
                );
              })}
            </div>

            {remaining > 0 && (
              <button
                type="button"
                className="u-btn soft block mt-3"
                onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}
              >
                {t("us.list.showMore", { count: remaining })}
              </button>
            )}
          </>
        )}
      </section>

      {children}
    </>
  );
};
