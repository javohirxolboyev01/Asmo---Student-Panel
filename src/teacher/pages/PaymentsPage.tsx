// src/teacher/pages/PaymentsPage.tsx
// Teacher payments: list (PaymentsView) + add / edit sheet, quick status change, delete.
import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import {
  useAddPaymentMutation,
  useUpdatePaymentMutation,
  useDeletePaymentMutation,
} from "@/hooks/queries/usePayments";
import { useStudentsQuery } from "@/hooks/queries/useStudents";
import { Modal } from "@/components/common/Modal";
import { useTranslation } from "@/hooks/useTranslation";
import { Button, Input, Select, DateField } from "@/components/ui";
import { toast, getErrorMessage } from "@/lib/toast";
import { useConfirm } from "@/hooks/useConfirm";
import { PaymentsView, paymentTypeConfig, statusConfig, type Payment } from "@/components/Payments/PaymentsView";
import { dueInputToIso, isoToDueInput, todayInput } from "@/lib/dueDate";

const PAYMENT_TYPES = ["CASH", "CLICK", "PAYME", "BANK", "UZUM"] as const;
const PAYMENT_STATUSES = ["PENDING", "PAID", "OVERDUE", "CANCELLED"] as const;

interface PaymentForm {
  studentId: string;
  amountNumber: string;
  paymentType: string;
  status: string;
  description: string;
  receiptNumber: string;
  /** yyyy-mm-dd or "". */
  dueDate: string;
}

const EMPTY_FORM: PaymentForm = {
  studentId: "",
  amountNumber: "",
  paymentType: "CASH",
  status: "PENDING",
  description: "",
  receiptNumber: "",
  dueDate: "",
};

export const PaymentsPage = () => {
  const { t } = useTranslation();
  const getLabel = (item: { label?: string; labelKey?: string }) => (item.labelKey ? t(item.labelKey) : item.label ?? "");
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  /** null = adding a new payment. */
  const [editing, setEditing] = useState<Payment | null>(null);
  const [paymentForm, setPaymentForm] = useState<PaymentForm>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusBusyId, setStatusBusyId] = useState<string | null>(null);
  const { confirm, confirmModal } = useConfirm();
  const { data: students = [] } = useStudentsQuery();
  const addPayment = useAddPaymentMutation();
  const updatePayment = useUpdatePaymentMutation();
  const deletePayment = useDeletePaymentMutation();

  const set = (key: keyof PaymentForm) => (e: { target: { value: string } }) => {
    setPaymentForm((f) => ({ ...f, [key]: e.target.value }));
    setFormError(null);
  };

  const openAdd = () => {
    setEditing(null);
    setPaymentForm(EMPTY_FORM);
    setFormError(null);
    setIsPaymentModalOpen(true);
  };

  const openEdit = (payment: Payment) => {
    setEditing(payment);
    setPaymentForm({
      studentId: payment.userId ?? "",
      amountNumber: String(payment.amountNumber),
      paymentType: payment.paymentType.toUpperCase(),
      status: payment.status.toUpperCase(),
      description: payment.description ?? "",
      receiptNumber: payment.receiptNumber ?? "",
      dueDate: isoToDueInput(payment.dueDate),
    });
    setFormError(null);
    setIsPaymentModalOpen(true);
  };

  const closeModal = () => {
    if (isSubmitting) return;
    setIsPaymentModalOpen(false);
  };

  const handleSubmit = async () => {
    if ((!editing && !paymentForm.studentId) || !paymentForm.amountNumber) {
      setFormError(t("us.fillRequired"));
      return;
    }
    const amount = Number(paymentForm.amountNumber);
    if (!Number.isInteger(amount) || amount <= 0) {
      setFormError(t("us.manage.amountError"));
      return;
    }
    setIsSubmitting(true);
    try {
      if (editing) {
        await updatePayment.mutateAsync({
          id: editing.id,
          payload: {
            amountNumber: amount,
            paymentType: paymentForm.paymentType,
            status: paymentForm.status,
            description: paymentForm.description.trim(),
            receiptNumber: paymentForm.receiptNumber.trim(),
            // Only sent when changed, so saving doesn't re-arm the reminder.
            ...(paymentForm.dueDate !== isoToDueInput(editing.dueDate)
              ? { dueDate: dueInputToIso(paymentForm.dueDate) ?? null }
              : {}),
          },
        });
        toast.success(t("common.updateSuccess"));
      } else {
        await addPayment.mutateAsync({
          studentId: paymentForm.studentId,
          payload: {
            amountNumber: amount,
            paymentType: paymentForm.paymentType,
            status: paymentForm.status,
            description: paymentForm.description.trim() || undefined,
            receiptNumber: paymentForm.receiptNumber.trim() || undefined,
            dueDate: paymentForm.status === "PAID" ? undefined : dueInputToIso(paymentForm.dueDate),
          },
        });
        setPaymentForm(EMPTY_FORM);
        toast.success(t("common.createSuccess"));
      }
      setIsPaymentModalOpen(false);
    } catch (err) {
      const message = getErrorMessage(err, t("common.error"));
      setFormError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (paymentId: string, status: string) => {
    setStatusBusyId(paymentId);
    try {
      await updatePayment.mutateAsync({ id: paymentId, payload: { status } });
      toast.success(t("common.updateSuccess"));
    } catch (err) {
      toast.error(getErrorMessage(err, t("common.error")));
    } finally {
      setStatusBusyId(null);
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
        <button type="button" className="u-btn" onClick={openAdd} aria-label={t("payments.addPayment")}>
          <Plus className="u-i m" strokeWidth={2} aria-hidden="true" />
          {t("us.manage.payBtn")}
        </button>
      }
      renderPaymentActions={(payment) => (
        <>
          <div aria-label={t("us.manage.changeStatus")}>
            <Select
              value={payment.status}
              onChange={(e) => handleStatusChange(payment.id, e.target.value.toUpperCase())}
              disabled={statusBusyId === payment.id}
              className="!py-2 !pl-3 !text-sm"
              containerClassName="w-[158px]"
            >
              {Object.keys(statusConfig).map((key) => (
                <option key={key} value={key}>
                  {getLabel(statusConfig[key as keyof typeof statusConfig])}
                </option>
              ))}
            </Select>
          </div>
          <button type="button" className="u-ib" onClick={() => openEdit(payment)} aria-label={t("us.manage.payEdit")}>
            <Pencil className="u-i s" strokeWidth={2} aria-hidden="true" />
          </button>
          <button
            type="button"
            className="u-ib"
            onClick={() => handleDeletePayment(payment.id)}
            aria-label={t("common.delete")}
          >
            <Trash2 className="u-i s" strokeWidth={2} aria-hidden="true" />
          </button>
        </>
      )}
    >
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={closeModal}
        title={editing ? t("us.manage.payEdit") : t("payments.addPayment")}
      >
        <div className="grid gap-3.5">
          {editing ? (
            <Input label={t("payments.student")} value={editing.studentName ?? editing.teacherName} disabled readOnly />
          ) : (
            <Select label={t("payments.student")} value={paymentForm.studentId} onChange={set("studentId")}>
              <option value="">—</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.firstName} {s.lastName}
                </option>
              ))}
            </Select>
          )}
          <Input
            label={t("payments.amount")}
            type="number"
            inputMode="numeric"
            min={1}
            placeholder="0"
            value={paymentForm.amountNumber}
            onChange={set("amountNumber")}
          />
          <div className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-3.5">
            <Select label={t("payments.paymentTypeLabel")} value={paymentForm.paymentType} onChange={set("paymentType")}>
              {PAYMENT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {getLabel(paymentTypeConfig[type.toLowerCase() as keyof typeof paymentTypeConfig])}
                </option>
              ))}
            </Select>
            <Select label={t("payments.status")} value={paymentForm.status} onChange={set("status")}>
              {PAYMENT_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {getLabel(statusConfig[status.toLowerCase() as keyof typeof statusConfig])}
                </option>
              ))}
            </Select>
          </div>
          {paymentForm.status !== "PAID" && paymentForm.status !== "CANCELLED" && (
            <div className="grid gap-1.5">
              <DateField
                label={t("us.pay.dueDate")}
                min={editing ? undefined : todayInput()}
                value={paymentForm.dueDate}
                onChange={set("dueDate")}
              />
              <p className="text-[12.5px] font-semibold text-u-mu">{t("us.pay.dueHint")}</p>
            </div>
          )}
          <Input label={t("us.manage.payNote")} type="text" value={paymentForm.description} onChange={set("description")} />
          <Input
            label={t("us.manage.payReceipt")}
            type="text"
            value={paymentForm.receiptNumber}
            onChange={set("receiptNumber")}
          />
          {formError && <p className="text-[13px] font-bold text-u-er">{formError}</p>}
          <div className="flex gap-2.5">
            <Button variant="outline" onClick={closeModal}>
              {t("common.cancel")}
            </Button>
            <Button className="flex-1" onClick={handleSubmit} isLoading={isSubmitting}>
              {editing ? t("common.save") : t("common.create")}
            </Button>
          </div>
        </div>
      </Modal>
      {confirmModal}
    </PaymentsView>
  );
};
