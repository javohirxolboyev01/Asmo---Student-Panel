// src/student/pages/PaymentsPage.tsx
import { ChevronRight, Eye } from "lucide-react";
import { IconButton } from "@/components/ui";
import { PaymentsView } from "@/components/Payments/PaymentsView";

export const PaymentsPage = () => (
  <PaymentsView
    renderPaymentActions={() => (
      <>
        <IconButton size="sm">
          <Eye className="w-4 h-4" />
        </IconButton>
        <ChevronRight className="w-5 h-5 text-gray-300 flex-shrink-0 hover:text-warning transition-colors cursor-pointer" />
      </>
    )}
  />
);
