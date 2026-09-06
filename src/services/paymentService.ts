// src/services/paymentService.ts
import { apiGet, apiPost, apiPatch, apiDelete } from "./apiClient";

export interface RawPayment {
  id: string;
  orderNumber: number;
  amountNumber: number;
  status: "paid" | "pending" | "overdue" | "cancelled";
  paymentType: "cash" | "click" | "payme" | "bank" | "uzum";
  paidAt: string | null;
  teacherName: string;
  description?: string;
  receiptNumber?: string;
  userId?: string;
  studentName?: string;
}

export const paymentService = {
  getPayments: async () => {
    const data = await apiGet<RawPayment[] | { payments: RawPayment[] }>("/payments");
    return Array.isArray(data) ? data : data.payments ?? [];
  },

  updatePayment: async (
    id: string,
    payload: Partial<{ amountNumber: number; status: string; paymentType: string; description: string; receiptNumber: string }>,
  ) => apiPatch(`/payments/${id}`, payload),

  deletePayment: async (id: string) => apiDelete(`/payments/${id}`),

  addPayment: async (
    studentId: string,
    payload: { amountNumber: number; status?: string; paymentType: string; description?: string; receiptNumber?: string },
  ) => apiPost(`/students/${studentId}/payments`, payload),
};
