// src/pages/StudentDetailPage.tsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Phone, Mail, Plus, X, CreditCard, Pencil } from "lucide-react";
import { useStudentsStore } from "@/stores/studentsStore";
import { useGroupStore } from "@/stores/groupStore";
import { teacherService } from "@/services/teacherService";
import { paymentService } from "@/services/paymentService";
import { Skeleton, SkeletonCard } from "@/components/common/Skeleton";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Modal } from "@/components/common/Modal";
import { Button, IconButton, Input, Select } from "@/components/ui";
import { getAvatarUrl, cn } from "@/lib/utils";
import { formatDate } from "@/utilist/formatData";
import { useTranslation } from "@/hooks/useTranslation";
import { toast, getErrorMessage } from "@/lib/toast";
import { useConfirm } from "@/hooks/useConfirm";

const PAYMENT_STATUS_KEYS: Record<string, "payments.statusPaid" | "payments.statusPending" | "payments.statusOverdue" | "payments.statusCancelled"> = {
  paid: "payments.statusPaid",
  pending: "payments.statusPending",
  overdue: "payments.statusOverdue",
  cancelled: "payments.statusCancelled",
};

export const StudentDetailPage = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const selectedStudent = useStudentsStore((state) => state.selectedStudent);
  const isLoading = useStudentsStore((state) => state.isLoading);
  const error = useStudentsStore((state) => state.error);
  const fetchStudentDetail = useStudentsStore((state) => state.fetchStudentDetail);
  const updateStudent = useStudentsStore((state) => state.updateStudent);
  const clearSelectedStudent = useStudentsStore((state) => state.clearSelectedStudent);
  const groups = useGroupStore((state) => state.groups);
  const fetchGroups = useGroupStore((state) => state.fetchGroups);

  const [isCoinModalOpen, setIsCoinModalOpen] = useState(false);
  const [coinForm, setCoinForm] = useState({ amount: "", reason: "" });
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentForm, setPaymentForm] = useState({ amountNumber: "", paymentType: "CASH", status: "PENDING", description: "" });
  const [enrollGroupId, setEnrollGroupId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({ firstName: "", lastName: "", phone: "", status: "ACTIVE" });
  const [isSavingStudent, setIsSavingStudent] = useState(false);
  const { confirm, confirmModal } = useConfirm();

  useEffect(() => {
    if (id) fetchStudentDetail(id);
    fetchGroups();
    return () => clearSelectedStudent();
  }, [id, fetchStudentDetail, fetchGroups, clearSelectedStudent]);

  useEffect(() => {
    if (!selectedStudent) return;
    setEditForm({
      firstName: selectedStudent.student.firstName,
      lastName: selectedStudent.student.lastName,
      phone: selectedStudent.student.phone ?? "",
      status: selectedStudent.student.status.toUpperCase(),
    });
  }, [selectedStudent]);

  const refresh = () => id && fetchStudentDetail(id);

  const handleSaveStudent = async () => {
    if (!id || !editForm.firstName || !editForm.lastName) return;
    setIsSavingStudent(true);
    try {
      await updateStudent(id, {
        firstName: editForm.firstName,
        lastName: editForm.lastName,
        phone: editForm.phone || null,
        status: editForm.status,
      });
      setIsEditModalOpen(false);
      toast.success(t("common.updateSuccess"));
    } catch (err) {
      toast.error(getErrorMessage(err, t("common.error")));
    } finally {
      setIsSavingStudent(false);
    }
  };

  const handleAwardCoins = async () => {
    if (!id || !coinForm.amount || !coinForm.reason) return;
    setIsSubmitting(true);
    try {
      await teacherService.awardCoins(id, { amount: Number(coinForm.amount), reason: coinForm.reason });
      setIsCoinModalOpen(false);
      setCoinForm({ amount: "", reason: "" });
      refresh();
      toast.success(t("common.createSuccess"));
    } catch (err) {
      toast.error(getErrorMessage(err, t("common.error")));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddPayment = async () => {
    if (!id || !paymentForm.amountNumber) return;
    setIsSubmitting(true);
    try {
      await paymentService.addPayment(id, {
        amountNumber: Number(paymentForm.amountNumber),
        paymentType: paymentForm.paymentType,
        status: paymentForm.status,
        description: paymentForm.description || undefined,
      });
      setIsPaymentModalOpen(false);
      setPaymentForm({ amountNumber: "", paymentType: "CASH", status: "PENDING", description: "" });
      refresh();
      toast.success(t("common.createSuccess"));
    } catch (err) {
      toast.error(getErrorMessage(err, t("common.error")));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEnroll = async () => {
    if (!id || !enrollGroupId) return;
    try {
      await teacherService.enrollStudent(enrollGroupId, id);
      setEnrollGroupId("");
      refresh();
      toast.success(t("common.createSuccess"));
    } catch (err) {
      toast.error(getErrorMessage(err, t("common.error")));
    }
  };

  const handleUnenroll = async (groupId: string) => {
    if (!id) return;
    const confirmed = await confirm(t("common.deleteConfirm"));
    if (!confirmed) return;
    try {
      await teacherService.unenrollStudent(groupId, id);
      refresh();
      toast.success(t("common.deleteSuccess"));
    } catch (err) {
      toast.error(getErrorMessage(err, t("common.error")));
    }
  };

  if (isLoading || !selectedStudent) {
    if (error) {
      return (
        <div className="card p-8 text-center">
          <p className="text-red-500">{error}</p>
        </div>
      );
    }
    return (
      <div className="space-y-4 md:space-y-6">
        <Skeleton className="w-32 h-4" />
        <SkeletonCard lines={4} />
      </div>
    );
  }

  const { student, groups: studentGroups, attendance, coinTransactions, payments, submissions } = selectedStudent;
  const availableGroups = groups.filter((g) => !studentGroups.some((sg) => sg.id === g.id));

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Profile */}
      <div className="card p-5 md:p-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
          <img
            src={getAvatarUrl(student.avatar, `${student.firstName} ${student.lastName}`)}
            alt={student.firstName}
            className="w-20 h-20 rounded-full border-4 border-warning/20"
          />
          <div className="flex-1">
            <div className="flex items-center gap-2 justify-center sm:justify-start">
              <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                {student.firstName} {student.lastName}
              </h1>
              <span
                className={cn(
                  "text-xs font-medium px-2 py-0.5 rounded-full",
                  student.status === "active" ? "bg-[#E8F5E9] text-[#2E7D32]" : "bg-gray-100 dark:bg-white/10 text-gray-500",
                )}
              >
                {student.status === "active" ? t("students.active") : t("students.inactive")}
              </span>
              <IconButton size="sm" onClick={() => setIsEditModalOpen(true)}>
                <Pencil className="w-3.5 h-3.5" />
              </IconButton>
            </div>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-2 text-sm text-gray-500">
              <div className="flex items-center gap-1.5">
                <Mail className="w-4 h-4" />
                <span>{student.email}</span>
              </div>
              {student.phone && (
                <div className="flex items-center gap-1.5">
                  <Phone className="w-4 h-4" />
                  <span>{student.phone}</span>
                </div>
              )}
            </div>
          </div>
          <div className="bg-gradient-to-br from-[#FFF8E1] to-[#FFECB3] dark:from-warning/15 dark:to-warning/5 rounded-2xl px-5 py-3 text-center border border-[#FFE082]/30 dark:border-warning/20">
            <p className="text-2xl font-bold text-warning">{student.coinBalance}</p>
            <p className="text-xs text-gray-500">{t("students.coinBalance")}</p>
          </div>
        </div>
      </div>

      {/* Groups */}
      <div className="card p-5">
        <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-3">{t("students.groupsTitle")}</h3>
        {studentGroups.length === 0 ? (
          <p className="text-sm text-gray-400">{t("students.noGroups")}</p>
        ) : (
          <div className="flex flex-wrap gap-2 mb-3">
            {studentGroups.map((g) => (
              <span
                key={g.id}
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-50 dark:bg-white/5 rounded-full text-sm"
              >
                {g.name}
                <IconButton
                  variant="danger"
                  size="sm"
                  onClick={() => handleUnenroll(g.id)}
                >
                  <X className="w-3.5 h-3.5" />
                </IconButton>
              </span>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <Select
            value={enrollGroupId}
            onChange={(e) => setEnrollGroupId(e.target.value)}
            containerClassName="flex-1"
          >
            <option value="">{t("students.enrollGroup")}</option>
            {availableGroups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </Select>
          <Button variant="outline" onClick={handleEnroll} disabled={!enrollGroupId}>
            {t("common.add")}
          </Button>
        </div>
      </div>

      {/* Attendance */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-800 dark:text-gray-100">{t("students.attendanceTitle")}</h3>
          <span className="text-sm font-semibold text-[#2E7D32]">{attendance.stats.percentage}%</span>
        </div>
        {attendance.records.length === 0 ? (
          <p className="text-sm text-gray-400">{t("students.noAttendance")}</p>
        ) : (
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {attendance.records.map((r) => (
              <div key={r.id} className="flex items-center justify-between py-1.5 text-sm">
                <div>
                  <p className="text-gray-800 dark:text-gray-100">{r.lessonTopic ?? t("students.lessonFallback")}</p>
                  <p className="text-xs text-gray-400">{formatDate(r.lessonDate ?? r.markedAt)}</p>
                </div>
                <StatusBadge status={r.status} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Grades */}
      <div className="card p-5">
        <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-3">{t("students.gradesTitle")}</h3>
        {submissions.length === 0 ? (
          <p className="text-sm text-gray-400">{t("students.noGrades")}</p>
        ) : (
          <div className="space-y-2">
            {submissions.map((s) => (
              <div key={s.id} className="flex items-center justify-between py-1.5 text-sm">
                <div className="min-w-0">
                  <p className="text-gray-800 dark:text-gray-100 truncate">{s.homeworkTitle}</p>
                  <p className="text-xs text-gray-400">{s.lessonTopic}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <StatusBadge status={s.status} />
                  {s.status === "graded" && (
                    <span className="font-semibold text-warning">
                      {s.score ?? 0}/{s.maxScore}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Coins */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-800 dark:text-gray-100">{t("students.coinsTitle")}</h3>
          <Button size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />} onClick={() => setIsCoinModalOpen(true)}>
            {t("students.awardCoins")}
          </Button>
        </div>
        {coinTransactions.length === 0 ? (
          <p className="text-sm text-gray-400">{t("students.noCoins")}</p>
        ) : (
          <div className="space-y-2">
            {coinTransactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between py-1.5 text-sm">
                <div>
                  <p className="text-gray-800 dark:text-gray-100">{tx.reason}</p>
                  <p className="text-xs text-gray-400">{formatDate(tx.createdAt)}</p>
                </div>
                <span className={cn("font-bold", tx.amount > 0 ? "text-[#2E7D32]" : "text-[#C62828]")}>
                  {tx.amount > 0 ? "+" : ""}
                  {tx.amount}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Payments */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-800 dark:text-gray-100">{t("students.paymentsTitle")}</h3>
          <Button size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />} onClick={() => setIsPaymentModalOpen(true)}>
            {t("students.addPayment")}
          </Button>
        </div>
        {payments.length === 0 ? (
          <p className="text-sm text-gray-400">{t("students.noPayments")}</p>
        ) : (
          <div className="space-y-2">
            {payments.map((p) => (
              <div key={p.id} className="flex items-center justify-between py-1.5 text-sm">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-800 dark:text-gray-100">
                    {new Intl.NumberFormat("uz-UZ").format(p.amountNumber)} so'm
                  </span>
                </div>
                <StatusBadge status={p.status} label={t(PAYMENT_STATUS_KEYS[p.status] ?? "payments.statusPending")} />
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title={t("common.edit")}>
        <div className="space-y-3">
          <Input
            type="text"
            placeholder={t("students.firstName")}
            value={editForm.firstName}
            onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
          />
          <Input
            type="text"
            placeholder={t("students.lastName")}
            value={editForm.lastName}
            onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
          />
          <Input
            type="text"
            placeholder={t("students.phone")}
            value={editForm.phone}
            onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
          />
          <Select
            value={editForm.status}
            onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
          >
            <option value="ACTIVE">{t("students.active")}</option>
            <option value="INACTIVE">{t("students.inactive")}</option>
          </Select>
          <Button onClick={handleSaveStudent} isLoading={isSavingStudent} fullWidth>
            {t("common.update")}
          </Button>
        </div>
      </Modal>

      <Modal isOpen={isCoinModalOpen} onClose={() => setIsCoinModalOpen(false)} title={t("students.awardCoins")}>
        <div className="space-y-3">
          <Input
            type="number"
            placeholder={t("coins.amount")}
            value={coinForm.amount}
            onChange={(e) => setCoinForm({ ...coinForm, amount: e.target.value })}
          />
          <Input
            type="text"
            placeholder={t("coins.reason")}
            value={coinForm.reason}
            onChange={(e) => setCoinForm({ ...coinForm, reason: e.target.value })}
          />
          <Button onClick={handleAwardCoins} isLoading={isSubmitting} fullWidth>
            {t("coins.give")}
          </Button>
        </div>
      </Modal>

      <Modal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} title={t("students.addPayment")}>
        <div className="space-y-3">
          <Input
            type="number"
            placeholder={t("payments.amount")}
            value={paymentForm.amountNumber}
            onChange={(e) => setPaymentForm({ ...paymentForm, amountNumber: e.target.value })}
          />
          <Select
            value={paymentForm.paymentType}
            onChange={(e) => setPaymentForm({ ...paymentForm, paymentType: e.target.value })}
          >
            {["CASH", "CLICK", "PAYME", "BANK", "UZUM"].map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </Select>
          <Select
            value={paymentForm.status}
            onChange={(e) => setPaymentForm({ ...paymentForm, status: e.target.value })}
          >
            {["PENDING", "PAID", "OVERDUE", "CANCELLED"].map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </Select>
          <Input
            type="text"
            placeholder={t("common.optional")}
            value={paymentForm.description}
            onChange={(e) => setPaymentForm({ ...paymentForm, description: e.target.value })}
          />
          <Button onClick={handleAddPayment} isLoading={isSubmitting} fullWidth>
            {t("common.create")}
          </Button>
        </div>
      </Modal>
      {confirmModal}
    </div>
  );
};
