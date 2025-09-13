import React from "react";

export default class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: any }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 24 }}>
          <h2>Ops! Algo deu errado.</h2>
          <pre style={{ whiteSpace: "pre-wrap" }}>
            {String(this.state.error ?? "")}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

