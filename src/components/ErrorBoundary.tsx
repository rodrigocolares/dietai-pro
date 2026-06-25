import { Component, ReactNode } from "react";

interface State {
  hasError: boolean;
  error?: Error;
}

export default class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: unknown) {
    console.error("[ErrorBoundary]", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-card border rounded-xl p-6 shadow-soft">
            <h1 className="text-xl font-bold mb-2">Algo deu errado</h1>
            <p className="text-sm text-muted-foreground mb-4">
              {this.state.error?.message ?? "Erro inesperado na aplicação."}
            </p>
            <button
              className="text-sm text-primary hover:underline"
              onClick={() => (window.location.href = "/")}
            >
              Voltar ao início
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
