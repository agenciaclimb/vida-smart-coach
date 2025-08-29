
import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-red-50 p-4 text-center">
          <div className="bg-white p-10 rounded-2xl shadow-xl border border-red-200">
            <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-red-800">Ops! Algo deu errado.</h1>
            <p className="mt-4 text-gray-600 max-w-lg">
              Nossa equipe já foi notificada sobre o problema. Por favor, tente recarregar a página ou volte mais tarde.
            </p>
            <div className="mt-8">
              <Button 
                onClick={() => window.location.reload()}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Recarregar a Página
              </Button>
            </div>
             {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
              <details className="mt-6 text-left bg-red-50 p-4 rounded-md">
                <summary className="cursor-pointer font-semibold text-red-700">Detalhes do Erro (Desenvolvimento)</summary>
                <pre className="mt-2 text-xs text-red-900 whitespace-pre-wrap">
                  {this.state.error && this.state.error.toString()}
                  <br />
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
