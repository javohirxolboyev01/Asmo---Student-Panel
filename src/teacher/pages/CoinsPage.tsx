// src/teacher/pages/CoinsPage.tsx
// Mock `coin` view: 3-step quick award (who / how many / why) + recent operations by day.
import { useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, Coins, Search, Users } from "lucide-react";
import { useTeacherCoinTransactionsQuery, useAwardCoinsMutation } from "@/hooks/queries/useCoins";
import { useStudentsQuery } from "@/hooks/queries/useStudents";
import { Button, Input } from "@/components/ui";
import { useTranslation } from "@/hooks/useTranslation";
import { toast, getErrorMessage } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { Avatar, EmptyBox, PageHeader, Skel } from "../components/ui";
import { humanDay } from "@/lib/humanDate";
import { COIN_REASON_KEYS } from "../components/sheets";

const PRESETS = [1, 5, 10, 20, -5];
/** Show a name filter above the pickers once the row gets long. */
const SEARCH_FROM = 9;

export const CoinsPage = () => {
  const { t } = useTranslation();
  const {
    data: transactions = [],
    isLoading: transactionsLoading,
    error: transactionsError,
    refetch: refetchTransactions,
  } = useTeacherCoinTransactionsQuery();
  const { data: students = [], isLoading: studentsLoading } = useStudentsQuery();
  const awardCoins = useAwardCoinsMutation();
  const [studentId, setStudentId] = useState("");
  const [amount, setAmount] = useState("5");
  const [reason, setReason] = useState(() => t(COIN_REASON_KEYS[0]));
  const [query, setQuery] = useState("");

  const fullName = (s: { firstName: string; lastName: string }) => `${s.firstName} ${s.lastName}`.trim();
  const selected = students.find((s) => s.id === studentId);
  const n = Math.trunc(Number(amount)) || 0;

  const pickers = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return students;
    return students.filter((s) => fullName(s).toLowerCase().includes(q) || s.id === studentId);
  }, [students, query, studentId]);

  const byId = useMemo(() => new Map(students.map((s) => [s.id, s])), [students]);

  // Operations grouped by calendar day, newest first (API order).
  const days = useMemo(() => {
    const out: [string, typeof transactions][] = [];
    for (const tx of transactions) {
      const day = humanDay(tx.createdAt, t);
      const last = out[out.length - 1];
      if (last && last[0] === day) last[1].push(tx);
      else out.push([day, [tx]]);
    }
    return out;
  }, [transactions, t]);

  const handleGive = async (e: FormEvent) => {
    e.preventDefault();
    if (!selected) return toast.error(t("us.people.pickFirst"));
    if (!n) return toast.error(t("us.people.enterAmount"));
    if (!reason.trim()) return toast.error(t("us.people.enterReason"));
    try {
      await awardCoins.mutateAsync({ studentId: selected.id, amount: n, reason: reason.trim() });
      const name = fullName(selected);
      toast.success(n > 0 ? t("us.people.coinGiven", { name, n }) : t("us.people.coinTaken", { name, n: -n }));
    } catch (err) {
      toast.error(getErrorMessage(err, t("common.error")));
    }
  };

  const signed = (v: number) => `${v > 0 ? "+" : ""}${v}`;

  return (
    <>
      <PageHeader title={t("us.coin.title")} subtitle={t("us.people.coinSubtitle")} />
      <div className="u-two">
        {/* Award */}
        <form className="u-card u-stack gap-[18px]" onSubmit={handleGive}>
          <div className="min-w-0">
            <h3 className="mb-2.5">{t("us.people.who")}</h3>
            {students.length >= SEARCH_FROM && (
              <div className="mb-2">
                <Input
                  type="search"
                  leftIcon={<Search className="u-i" strokeWidth={2} aria-hidden="true" />}
                  placeholder={t("us.people.search")}
                  aria-label={t("us.people.search")}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
            )}
            {studentsLoading ? (
              <div className="u-chips sc" aria-busy="true">
                {Array.from({ length: 5 }, (_, i) => (
                  <Skel key={i} className="h-[74px] w-[76px] flex-none rounded-2xl" />
                ))}
              </div>
            ) : students.length === 0 ? (
              <p className="u-sub m-0">{t("us.people.noStudents")}</p>
            ) : pickers.length === 0 ? (
              <p className="u-sub m-0">{t("us.people.notFound")}</p>
            ) : (
              <div className="u-chips sc" role="radiogroup" aria-label={t("us.people.who")}>
                {pickers.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    role="radio"
                    aria-checked={studentId === s.id}
                    title={fullName(s)}
                    className={cn("u-pk", studentId === s.id && "sel")}
                    onClick={() => setStudentId(s.id)}
                  >
                    <Avatar name={fullName(s)} src={s.avatar} seed={s.id} />
                    <span>{s.firstName}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <h3 className="mb-2.5">{t("us.people.howMuch")}</h3>
            <div className="u-chips items-center">
              {PRESETS.map((p) => (
                <button
                  key={p}
                  type="button"
                  className={cn("u-preset", n === p && "sel")}
                  aria-pressed={n === p}
                  onClick={() => setAmount(String(p))}
                >
                  {signed(p)}
                </button>
              ))}
              <Input
                type="number"
                step={1}
                aria-label={t("us.people.otherAmount")}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                containerClassName="w-24"
                className="!py-2.5 !px-3.5"
              />
            </div>
          </div>

          <div>
            <h3 className="mb-2.5">{t("us.people.why")}</h3>
            <div className="u-chips">
              {COIN_REASON_KEYS.map((key) => {
                const label = t(key);
                return (
                  <button
                    key={key}
                    type="button"
                    className={cn("u-chip", reason === label && "sel")}
                    aria-pressed={reason === label}
                    onClick={() => setReason(label)}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            <Input
              containerClassName="mt-2.5"
              placeholder={t("us.people.ownReason")}
              aria-label={t("us.coin.reason")}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>

          <button type="submit" className="u-btn block" disabled={awardCoins.isPending}>
            <Coins className="u-i m" strokeWidth={2} aria-hidden="true" />
            <span className="truncate">
              {selected ? t("us.people.giveTo", { name: fullName(selected), n: signed(n) }) : t("us.coin.title")}
            </span>
          </button>
          {!selected && students.length > 0 && (
            <p className="u-sub -mt-2 m-0 text-center">{t("us.people.pickFirst")}</p>
          )}
        </form>

        {/* Recent operations */}
        <div className="u-card">
          <h2 className="mb-1.5">{t("coins.recentTransactions")}</h2>
          {transactionsError ? (
            <EmptyBox
              card={false}
              tone="er"
              icon={AlertTriangle}
              title={getErrorMessage(transactionsError, t("common.error"))}
              action={<Button onClick={() => refetchTransactions()}>{t("common.retry")}</Button>}
            />
          ) : transactionsLoading ? (
            <div className="u-stack mt-4" aria-busy="true">
              {Array.from({ length: 5 }, (_, i) => (
                <Skel key={i} className="h-[62px] rounded-[18px]" />
              ))}
            </div>
          ) : days.length === 0 ? (
            <EmptyBox card={false} tone="mu" icon={Users} title={t("coins.noTransactions")} />
          ) : (
            days.map(([day, list]) => (
              <div key={day}>
                <div className="u-day">{day}</div>
                <div className="u-stack">
                  {list.map((tx) => {
                    const s = byId.get(tx.userId);
                    return (
                      <Link key={tx.id} to={`/students/${tx.userId}`} className="u-row min-w-0">
                        <Avatar name={tx.studentName} src={s?.avatar} seed={tx.userId} size="s" />
                        <div className="g">
                          <b className="truncate">{tx.studentName}</b>
                          <small className="block break-words">{tx.reason}</small>
                        </div>
                        <b
                          className="flex-none font-fd text-[19px]"
                          style={{ color: tx.amount > 0 ? "var(--ok)" : "var(--er)" }}
                        >
                          {signed(tx.amount)} <small className="text-[13px] font-bold">{t("unit.coin")}</small>
                        </b>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
};
