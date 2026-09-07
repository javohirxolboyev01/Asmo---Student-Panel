// src/pages/PaymentsPage.tsx
import { useEffect, useState } from "react";
import {
  CreditCard,
  AlertCircle,
  ChevronRight,
  Receipt,
  Calendar,
  CircleCheck,
  CircleX,
  Clock as ClockIcon,
  TrendingUp,
  Filter,
  Search,
  Eye,
  User,
  Banknote,
  CreditCard as CardIcon,
  Smartphone,
  Plus,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { paymentService } from "@/services/paymentService";
import { studentService } from "@/services/studentService";
import { useAuthStore } from "@/stores/authStore";
import { StudentSummary } from "@/types/teacher";
import { Modal } from "@/components/common/Modal";
import { formatDate, formatTime } from "@/utilist/formatData";
import { Skeleton, SkeletonHeader, SkeletonStatGrid, SkeletonList } from "@/components/common/Skeleton";
import { useTranslation } from "@/hooks/useTranslation";
import { Button, IconButton, Input, Select } from "@/components/ui";
import { toast, getErrorMessage } from "@/lib/toast";
import { useConfirm } from "@/hooks/useConfirm";

interface Payment {
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

const paymentTypeIcons = {
  cash: {
    icon: Banknote,
    labelKey: "payments.typeCash" as const,
    color: "text-emerald-600",
    bgColor: "bg-emerald-50 dark:bg-emerald-500/10",
  },
  click: {
    icon: Smartphone,
    label: "Click",
    color: "text-blue-600",
    bgColor: "bg-blue-50 dark:bg-blue-500/10",
  },
  payme: {
    icon: Smartphone,
    label: "Payme",
    color: "text-purple-600",
    bgColor: "bg-purple-50 dark:bg-purple-500/10",
  },
  bank: {
    icon: CardIcon,
    labelKey: "payments.typeBank" as const,
    color: "text-orange-600",
    bgColor: "bg-orange-50 dark:bg-orange-500/10",
  },
  uzum: {
    icon: Smartphone,
    label: "Uzum",
    color: "text-pink-600",
    bgColor: "bg-pink-50 dark:bg-pink-500/10",
  },
};

const statusConfig = {
  paid: {
    labelKey: "payments.statusPaid" as const,
    color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30",
    icon: CircleCheck,
  },
  pending: {
    labelKey: "payments.statusPending" as const,
    color: "text-yellow-600 bg-yellow-50 dark:bg-yellow-500/10 border-yellow-200 dark:border-yellow-500/30",
    icon: ClockIcon,
  },
  overdue: {
    labelKey: "payments.statusOverdue" as const,
    color: "text-red-600 bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30",
    icon: AlertCircle,
  },
  cancelled: {
    labelKey: "payments.statusCancelled" as const,
    color: "text-gray-500 bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-gray-700",
    icon: CircleX,
  },
};

export const PaymentsPage = () => {
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);
  const isTeacher = user?.role === "teacher" || user?.role === "admin";
  const getLabel = (item: { label?: string; labelKey?: string }) =>
    item.labelKey ? t(item.labelKey) : item.label ?? "";
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [students, setStudents] = useState<StudentSummary[]>([]);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentForm, setPaymentForm] = useState({ studentId: "", amountNumber: "", paymentType: "CASH", status: "PENDING", description: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { confirm, confirmModal } = useConfirm();

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("uz-UZ").format(amount) + " so'm";
  };

  const loadPayments = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const raw: RawPayment[] = await paymentService.getPayments();
      setPayments(
        raw.map((p) => ({
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
        })),
      );
    } catch {
      setError(t("payments.loadError"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
    if (isTeacher) studentService.getStudents().then(setStudents);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAddPayment = async () => {
    if (!paymentForm.studentId || !paymentForm.amountNumber) return;
    setIsSubmitting(true);
    try {
      await paymentService.addPayment(paymentForm.studentId, {
        amountNumber: Number(paymentForm.amountNumber),
        paymentType: paymentForm.paymentType,
        status: paymentForm.status,
        description: paymentForm.description || undefined,
      });
      setIsPaymentModalOpen(false);
      setPaymentForm({ studentId: "", amountNumber: "", paymentType: "CASH", status: "PENDING", description: "" });
      loadPayments();
      toast.success(t("common.createSuccess"));
    } catch (err) {
      toast.error(getErrorMessage(err, t("common.error")));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (paymentId: string, status: string) => {
    try {
      await paymentService.updatePayment(paymentId, { status });
      loadPayments();
      toast.success(t("common.updateSuccess"));
    } catch (err) {
      toast.error(getErrorMessage(err, t("common.error")));
    }
  };

  const handleDeletePayment = async (paymentId: string) => {
    const confirmed = await confirm(t("payments.deleteConfirm"));
    if (!confirmed) return;
    try {
      await paymentService.deletePayment(paymentId);
      loadPayments();
      toast.success(t("common.deleteSuccess"));
    } catch (err) {
      toast.error(getErrorMessage(err, t("common.error")));
    }
  };

  const filteredPayments = payments
    .filter(
      (p) =>
        p.teacherName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.amount.includes(searchQuery) ||
        p.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.receiptNumber?.toLowerCase().includes(searchQuery.toLowerCase()),
    )
    .filter((p) => filterStatus === "all" || p.status === filterStatus)
    .filter((p) => filterType === "all" || p.paymentType === filterType);

  const totalPaid = payments
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + p.amountNumber, 0);

  const totalPayments = payments.length;
  const lastPayment = payments.find((p) => p.status === "paid");

  if (isLoading) {
    return (
      <div className="space-y-4 md:space-y-6 pb-24">
        <div>
          <Skeleton className="w-20 h-4 mb-3" />
          <SkeletonHeader />
        </div>
        <SkeletonStatGrid count={3} />
        <Skeleton className="w-full h-12 rounded-2xl" />
        <div className="card p-5">
          <Skeleton className="w-40 h-5 mb-4" />
          <SkeletonList rows={4} withAvatar={false} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card p-8 text-center">
        <p className="text-red-500">{error}</p>
        <Button onClick={() => window.location.reload()} className="mt-4">
          {t("common.retry")}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6 pb-24">
      {/* Header */}
      <div>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-lg md:text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
              <CreditCard className="w-7 h-7 text-warning" />
              {t("payments.title")}
            </h1>
            <p className="text-gray-500 text-sm md:text-base">
              {t("payments.subtitle")}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isTeacher && (
              <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => setIsPaymentModalOpen(true)}>
                <span className="hidden sm:inline">{t("payments.addPayment")}</span>
              </Button>
            )}
            <div className="bg-white dark:bg-card-dark px-4 py-2 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 flex items-center gap-2">
              <Receipt className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-bold text-gray-800 dark:text-gray-100">
                {t("payments.countSuffix", { count: totalPayments })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="card p-5 hover:shadow-card-hover transition-all duration-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">
                {t("payments.totalPaid")}
              </p>
              <p className="text-xl font-bold text-gray-800 dark:text-gray-100 mt-1.5">
                {formatAmount(totalPaid)}
              </p>
              {lastPayment && (
                <p className="text-xs text-gray-400 mt-1">
                  {t("payments.lastPayment", { date: lastPayment.date })}
                </p>
              )}
            </div>
            <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
            </div>
          </div>
        </div>

        <div className="card p-5 hover:shadow-card-hover transition-all duration-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">
                {t("payments.status")}
              </p>
              <p className="text-xl font-bold text-emerald-600 mt-1.5">
                {t("payments.noDebt")}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {t("payments.allPaidDesc")}
              </p>
            </div>
            <div className="w-10 h-10 bg-blue-50 dark:bg-blue-500/10 rounded-2xl flex items-center justify-center flex-shrink-0">
              <CircleCheck className="w-5 h-5 text-blue-500" />
            </div>
          </div>
        </div>

        <div className="card p-5 hover:shadow-card-hover transition-all duration-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">
                {t("payments.totalTransactions")}
              </p>
              <p className="text-xl font-bold text-gray-800 dark:text-gray-100 mt-1.5">
                {t("payments.countSuffix", { count: totalPayments })}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {t("payments.paidCountSuffix", {
                  count: payments.filter((p) => p.status === "paid").length,
                })}
              </p>
            </div>
            <div className="w-10 h-10 bg-purple-50 dark:bg-purple-500/10 rounded-2xl flex items-center justify-center flex-shrink-0">
              <Receipt className="w-5 h-5 text-purple-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Input
          type="text"
          placeholder={t("payments.searchPlaceholder")}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          leftIcon={<Search className="w-4 h-4" />}
          uiSize="lg"
          containerClassName="flex-1"
        />
        <Button variant="outline" size="lg" leftIcon={<Filter className="w-4 h-4" />} onClick={() => setShowFilters(!showFilters)}>
          {t("payments.filter")}
          {(filterStatus !== "all" || filterType !== "all") && (
            <span className="w-2 h-2 bg-warning rounded-full" />
          )}
        </Button>
      </div>

      {/* Filter Dropdown */}
      {showFilters && (
        <div className="card p-4 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t("payments.filterByStatus")}
              </label>
              <div className="flex flex-wrap gap-2 mt-2">
                <button
                  onClick={() => setFilterStatus("all")}
                  className={cn(
                    "px-2.5 py-1 text-[11px] rounded-full font-medium transition-all sm:px-3 sm:py-1.5 sm:text-xs",
                    filterStatus === "all"
                      ? "bg-warning text-white"
                      : "bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:bg-gray-700",
                  )}
                >
                  {t("common.all")}
                </button>
                {Object.entries(statusConfig).map(([key, value]) => (
                  <button
                    key={key}
                    onClick={() => setFilterStatus(key)}
                    className={cn(
                      "px-2.5 py-1 text-[11px] rounded-full font-medium transition-all flex items-center gap-1 sm:px-3 sm:py-1.5 sm:text-xs",
                      filterStatus === key
                        ? "bg-warning text-white"
                        : "bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:bg-gray-700",
                    )}
                  >
                    {getLabel(value)}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t("payments.filterByType")}
              </label>
              <div className="flex flex-wrap gap-2 mt-2">
                <button
                  onClick={() => setFilterType("all")}
                  className={cn(
                    "px-2.5 py-1 text-[11px] rounded-full font-medium transition-all sm:px-3 sm:py-1.5 sm:text-xs",
                    filterType === "all"
                      ? "bg-warning text-white"
                      : "bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:bg-gray-700",
                  )}
                >
                  {t("common.all")}
                </button>
                {Object.entries(paymentTypeIcons).map(([key, value]) => (
                  <button
                    key={key}
                    onClick={() => setFilterType(key)}
                    className={cn(
                      "px-2.5 py-1 text-[11px] rounded-full font-medium transition-all flex items-center gap-1 sm:px-3 sm:py-1.5 sm:text-xs",
                      filterType === key
                        ? "bg-warning text-white"
                        : "bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:bg-gray-700",
                    )}
                  >
                    <value.icon className="w-3 h-3" />
                    {getLabel(value)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payments List */}
      <div className="card">
        <div className="p-5">
          <h3 className="font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2 mb-4">
            {t("payments.list")}
            <span className="text-xs font-medium text-gray-400 ml-2">
              ({t("payments.countSuffix", { count: filteredPayments.length })})
            </span>
          </h3>

          <div className="space-y-3">
            {filteredPayments.map((payment) => {
              const status = statusConfig[payment.status] ?? statusConfig.pending;
              const StatusIcon = status.icon;
              const type = paymentTypeIcons[payment.paymentType] ?? paymentTypeIcons.cash;
              const TypeIcon = type.icon;

              return (
                <div
                  key={payment.id}
                  className="bg-gradient-to-r from-gray-50 to-white dark:from-white/5 dark:to-card-dark rounded-2xl p-4 hover:shadow-md transition-all duration-200 border border-gray-100/80 dark:border-gray-800 hover:border-gray-200 dark:border-gray-700"
                >
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <span className="text-xs font-medium text-gray-400">
                          #{payment.orderNumber}
                        </span>
                        <div
                          className={cn(
                            "px-2.5 py-0.5 rounded-full border text-xs font-medium flex items-center gap-1.5",
                            status.color,
                          )}
                        >
                          <StatusIcon className="w-3 h-3" />
                          {getLabel(status)}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-sm">
                        <span className="font-bold text-gray-800 dark:text-gray-100">
                          {payment.amount}
                        </span>
                        <span className="text-gray-300">•</span>
                        <div className="flex items-center gap-1.5 text-gray-500">
                          <TypeIcon className="w-3.5 h-3.5" />
                          <span className="font-medium text-gray-800 dark:text-gray-100">
                            {getLabel(type)}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-400">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5" />
                          <span>{isTeacher && payment.studentName ? payment.studentName : payment.teacherName}</span>
                        </div>
                        <span className="w-px h-3 bg-gray-200 dark:bg-gray-700" />
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{payment.date}</span>
                        </div>
                        <span className="w-px h-3 bg-gray-200 dark:bg-gray-700" />
                        <div className="flex items-center gap-1.5">
                          <ClockIcon className="w-3.5 h-3.5" />
                          <span>{payment.time}</span>
                        </div>
                        {payment.receiptNumber && (
                          <>
                            <span className="w-px h-3 bg-gray-200 dark:bg-gray-700" />
                            <span className="text-gray-400">
                              #{payment.receiptNumber}
                            </span>
                          </>
                        )}
                      </div>

                      {payment.description && (
                        <p className="text-xs text-gray-400 mt-1.5">
                          {payment.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {isTeacher ? (
                        <>
                          <Select
                            value={payment.status}
                            onChange={(e) => handleStatusChange(payment.id, e.target.value.toUpperCase())}
                            className="text-xs py-1.5"
                            containerClassName="w-auto"
                          >
                            {Object.keys(statusConfig).map((key) => (
                              <option key={key} value={key}>
                                {getLabel(statusConfig[key as keyof typeof statusConfig])}
                              </option>
                            ))}
                          </Select>
                          <IconButton size="sm" variant="danger" onClick={() => handleDeletePayment(payment.id)}>
                            <Trash2 className="w-4 h-4" />
                          </IconButton>
                        </>
                      ) : (
                        <>
                          <IconButton size="sm">
                            <Eye className="w-4 h-4" />
                          </IconButton>
                          <ChevronRight className="w-5 h-5 text-gray-300 flex-shrink-0 hover:text-warning transition-colors cursor-pointer" />
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredPayments.length === 0 && (
            <div className="text-center py-12">
              <Receipt className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-1">
                {t("payments.notFound")}
              </h3>
              <p className="text-gray-400 text-sm">
                {searchQuery
                  ? t("payments.noSearchResults", { query: searchQuery })
                  : t("payments.noPaymentsYet")}
              </p>
            </div>
          )}

          {filteredPayments.length > 0 && (
            <Button variant="ghost" fullWidth size="sm" className="mt-4">
              {t("payments.viewAll")}
            </Button>
          )}
        </div>
      </div>

      {/* Payment Summary */}
      {/* <div className="card bg-gradient-to-br from-warning to-warning text-white">
        <div className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-200 text-sm">Jami to'lovlar</p>
              <p className="text-2xl font-bold mt-1">
                {formatAmount(totalPaid)}
              </p>
              <p className="text-blue-200 text-sm mt-1">
                {totalPayments} ta tranzaksiya
              </p>
            </div>
            <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center">
              <CreditCard className="w-7 h-7 text-white" />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-white/20 grid grid-cols-3 gap-2 text-center text-sm">
            <div>
              <p className="text-blue-200">Oxirgi to'lov</p>
              <p className="font-medium">{lastPayment?.date || "-"}</p>
            </div>
            <div>
              <p className="text-blue-200">Holat</p>
              <p className="font-medium text-emerald-300">Qarz yo'q</p>
            </div>
            <div>
              <p className="text-blue-200">O'rtacha</p>
              <p className="font-medium">
                {totalPayments > 0
                  ? formatAmount(Math.round(totalPaid / totalPayments))
                  : "0 so'm"}
              </p>
            </div>
          </div>
        </div>
      </div> */}

      {isTeacher && (
        <Modal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} title={t("payments.addPayment")}>
          <div className="space-y-3">
            <Select
              value={paymentForm.studentId}
              onChange={(e) => setPaymentForm({ ...paymentForm, studentId: e.target.value })}
            >
              <option value="">{t("payments.student")}</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.firstName} {s.lastName}
                </option>
              ))}
            </Select>
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
      )}
      {confirmModal}

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};
