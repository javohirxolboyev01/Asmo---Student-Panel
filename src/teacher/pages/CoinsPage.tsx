// src/teacher/pages/CoinsPage.tsx
import { useState } from "react";
import { useTeacherCoinTransactionsQuery, useAwardCoinsMutation } from "@/hooks/queries/useCoins";
import { useStudentsQuery } from "@/hooks/queries/useStudents";
import { Coins } from "lucide-react";

import { formatDate } from "@/utilist/formatData";
import { cn } from "@/lib/utils";
import { Skeleton, SkeletonHeader, SkeletonList } from "@/components/common/Skeleton";
import { Button, Input, Select } from "@/components/ui";
import { useTranslation } from "@/hooks/useTranslation";

export const CoinsPage = () => {
  const { t } = useTranslation();
  const { data: transactions = [], isLoading: transactionsLoading } = useTeacherCoinTransactionsQuery();
  const { data: students = [], isLoading: studentsLoading } = useStudentsQuery();
  const awardCoins = useAwardCoinsMutation();
  const [form, setForm] = useState({ studentId: "", amount: "", reason: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleGive = async () => {
    if (!form.studentId || !form.amount || !form.reason) return;
    setIsSubmitting(true);
    setMessage(null);
    try {
      await awardCoins.mutateAsync({ studentId: form.studentId, amount: Number(form.amount), reason: form.reason });
      setMessage(t("coins.givenSuccess"));
      setForm({ studentId: "", amount: "", reason: "" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (transactionsLoading || studentsLoading) {
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
