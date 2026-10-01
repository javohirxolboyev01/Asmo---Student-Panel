// src/teacher/pages/PaymentsPage.tsx
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import {
  useAddPaymentMutation,
  useUpdatePaymentMutation,
  useDeletePaymentMutation,
} from "@/hooks/queries/usePayments";
import { useStudentsQuery } from "@/hooks/queries/useStudents";
import { Modal } from "@/components/common/Modal";
import { useTranslation } from "@/hooks/useTranslation";
import { Button, IconButton, Input, Select } from "@/components/ui";
import { toast, getErrorMessage } from "@/lib/toast";
import { useConfirm } from "@/hooks/useConfirm";
import { PaymentsView, statusConfig } from "@/components/Payments/PaymentsView";

export const PaymentsPage = () => {
  const { t } = useTranslation();
  const getLabel = (item: { label?: string; labelKey?: string }) =>
    item.labelKey ? t(item.labelKey) : item.label ?? "";
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentForm, setPaymentForm] = useState({ studentId: "", amountNumber: "", paymentType: "CASH", status: "PENDING", description: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { confirm, confirmModal } = useConfirm();
  const { data: students = [] } = useStudentsQuery();
  const addPayment = useAddPaymentMutation();
  const updatePayment = useUpdatePaymentMutation();
  const deletePayment = useDeletePaymentMutation();

  const handleAddPayment = async () => {
    if (!paymentForm.studentId || !paymentForm.amountNumber) return;
    setIsSubmitting(true);
    try {
      await addPayment.mutateAsync({
        studentId: paymentForm.studentId,
        payload: {
          amountNumber: Number(paymentForm.amountNumber),
          paymentType: paymentForm.paymentType,
          status: paymentForm.status,
          description: paymentForm.description || undefined,
        },
      });
      setIsPaymentModalOpen(false);
      setPaymentForm({ studentId: "", amountNumber: "", paymentType: "CASH", status: "PENDING", description: "" });
      toast.success(t("common.createSuccess"));
    } catch (err) {
      toast.error(getErrorMessage(err, t("common.error")));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (paymentId: string, status: string) => {
    try {
      await updatePayment.mutateAsync({ id: paymentId, payload: { status } });
      toast.success(t("common.updateSuccess"));
    } catch (err) {
      toast.error(getErrorMessage(err, t("common.error")));
    }
  };

  const handleDeletePayment = async (paymentId: string) => {
    const confirmed = await confirm(t("payments.deleteConfirm"));
    if (!confirmed) return;
    try {
      await deletePayment.mutateAsync(paymentId);
      toast.success(t("common.deleteSuccess"));
    } catch (err) {
      toast.error(getErrorMessage(err, t("common.error")));
    }
  };

  return (
    <PaymentsView
      showStudentName
      headerActions={
        <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => setIsPaymentModalOpen(true)}>
          <span className="hidden sm:inline">{t("payments.addPayment")}</span>
        </Button>
      }
      renderPaymentActions={(payment) => (
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
      )}
    >
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
      {confirmModal}
    </PaymentsView>
  );
};
