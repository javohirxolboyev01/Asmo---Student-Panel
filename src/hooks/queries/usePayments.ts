// src/hooks/queries/usePayments.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { paymentService } from "@/services/paymentService";
import { queryKeys } from "@/lib/queryClient";

export const usePaymentsQuery = () =>
  useQuery({ queryKey: queryKeys.payments, queryFn: paymentService.getPayments });

export const useAddPaymentMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      studentId,
      payload,
    }: {
      studentId: string;
      payload: Parameters<typeof paymentService.addPayment>[1];
    }) => paymentService.addPayment(studentId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.payments });
      queryClient.invalidateQueries({ queryKey: ["students"] });
    },
  });
};

export const useUpdatePaymentMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Parameters<typeof paymentService.updatePayment>[1];
    }) => paymentService.updatePayment(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.payments }),
  });
};

export const useDeletePaymentMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => paymentService.deletePayment(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.payments }),
  });
};
