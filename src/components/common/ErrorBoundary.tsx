// src/components/Common/ErrorBoundary.tsx
import { Component, ErrorInfo, ReactNode } from "react";

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
            <h2 className="text-2xl font-bold text-text-primary mb-2">
              Xatolik yuz berdi
            </h2>
            <p className="text-text-secondary mb-6">
              Kechirasiz, kutilmagan xatolik yuz berdi. Iltimos, sahifani qayta
              yuklang.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="btn-primary"
            >
              Sahifani qayta yuklash
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
