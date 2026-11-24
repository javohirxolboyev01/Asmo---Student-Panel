// src/components/Common/ErrorBoundary.tsx
import { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center py-12 px-4" role="alert">
          <div className="text-center">
            <div className="w-[84px] h-[84px] rounded-full bg-u-ert flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-9 h-9 text-u-er" aria-hidden="true" />
            </div>
            <h2 className="font-fd text-[21px] font-extrabold text-u-tx mb-2">
              Xatolik yuz berdi
            </h2>
            <p className="text-u-mu mb-6 max-w-sm mx-auto">
              Kechirasiz, kutilmagan xatolik yuz berdi. Iltimos, sahifani qayta
              yuklang.
            </p>
            <Button onClick={() => window.location.reload()}>
              Sahifani qayta yuklash
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
