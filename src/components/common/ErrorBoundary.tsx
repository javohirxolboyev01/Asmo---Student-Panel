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
        <div className="flex flex-col items-center justify-center py-12 px-4">
          <div className="text-center">
            <div className="w-14 h-14 rounded-full bg-warning/10 dark:bg-warning/15 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-7 h-7 text-warning" />
            </div>
            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-2">
              Xatolik yuz berdi
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
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
