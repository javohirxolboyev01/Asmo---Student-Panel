// src/pages/CoinsPage.tsx
import { useEffect, useState } from "react";
import { coinService } from "@/services/coinService";
import { teacherService } from "@/services/teacherService";
import { studentService } from "@/services/studentService";
import { Coins, TrendingUp, TrendingDown } from "lucide-react";

import { formatDate } from "@/utilist/formatData";
import { cn } from "@/lib/utils";
import { Skeleton, SkeletonHeader, SkeletonStatGrid, SkeletonList } from "@/components/common/Skeleton";
import { Button, Input, Select } from "@/components/ui";
import { useTranslation } from "@/hooks/useTranslation";
import { useAuthStore } from "@/stores/authStore";
import { StudentSummary, TeacherCoinTransaction } from "@/types/teacher";

const TeacherCoinsView = () => {
  const { t } = useTranslation();
  const [transactions, setTransactions] = useState<TeacherCoinTransaction[]>([]);
  const [students, setStudents] = useState<StudentSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [form, setForm] = useState({ studentId: "", amount: "", reason: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const load = async () => {
    setIsLoading(true);
    try {
      const [tx, st] = await Promise.all([teacherService.getTeacherCoins(), studentService.getStudents()]);
      setTransactions(tx);
      setStudents(st);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleGive = async () => {
    if (!form.studentId || !form.amount || !form.reason) return;
    setIsSubmitting(true);
    setMessage(null);
    try {
      await teacherService.awardCoins(form.studentId, { amount: Number(form.amount), reason: form.reason });
      setMessage(t("coins.givenSuccess"));
      setForm({ studentId: "", amount: "", reason: "" });
      load();
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4 md:space-y-6">
        <SkeletonHeader />
        <Skeleton className="w-full h-40 rounded-2xl" />
        <div className="card p-5">
          <Skeleton className="w-32 h-5 mb-4" />
          <SkeletonList rows={5} withAvatar />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h1 className="text-lg md:text-xl font-bold text-gray-800 dark:text-gray-100">{t("coins.manageTitle")}</h1>
        <p className="text-gray-500 text-sm md:text-base">{t("coins.manageSubtitle")}</p>
      </div>

      <div className="card p-5 space-y-3">
        <Select value={form.studentId} onChange={(e) => setForm({ ...form, studentId: e.target.value })}>
          <option value="">{t("coins.selectStudent")}</option>
          {students.map((s) => (
            <option key={s.id} value={s.id}>
              {s.firstName} {s.lastName}
            </option>
          ))}
        </Select>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            type="number"
            placeholder={t("coins.amount")}
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
          />
          <Input
            type="text"
            placeholder={t("coins.reason")}
            value={form.reason}
            onChange={(e) => setForm({ ...form, reason: e.target.value })}
          />
        </div>
        <Button onClick={handleGive} isLoading={isSubmitting} size="sm">
          {t("coins.give")}
        </Button>
        {message && <p className="text-sm text-[#2E7D32]">{message}</p>}
      </div>

      <div className="card">
        <div className="p-5">
          <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-4">{t("coins.recentTransactions")}</h3>
          <div className="space-y-3">
            {transactions.length === 0 ? (
              <div className="text-center py-8">
                <Coins className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">{t("coins.noTransactions")}</p>
              </div>
            ) : (
              transactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/5 rounded-2xl">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">{tx.studentName}</p>
                    <p className="text-xs text-gray-500 truncate">{tx.reason}</p>
                    <p className="text-xs text-gray-400">{formatDate(tx.createdAt)}</p>
                  </div>
                  <span className={cn("text-base font-bold flex-shrink-0", tx.amount > 0 ? "text-[#2E7D32]" : "text-[#C62828]")}>
                    {tx.amount > 0 ? "+" : ""}
                    {tx.amount}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

interface CoinRecord {
  id: string;
  amount: number;
  reason: string;
  createdAt: string;
}

interface CoinData {
  balance: number;
  transactions: CoinRecord[];
}

const StudentCoinsView = () => {
  const { t } = useTranslation();
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
        setError(t("common.loadError"));
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

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
        <p className="text-red-500">{error || t("common.notFound")}</p>
        <Button onClick={() => window.location.reload()} className="mt-4">
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

export const CoinsPage = () => {
  const user = useAuthStore((state) => state.user);
  const isTeacher = user?.role === "teacher" || user?.role === "admin";
  return isTeacher ? <TeacherCoinsView /> : <StudentCoinsView />;
};
