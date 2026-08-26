import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public override state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[Solvexa] Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/pulse';
  };

  public override render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center p-6 text-center">
          <div className="max-w-md w-full bg-[#141416] border border-white/10 rounded-2xl p-8 shadow-2xl backdrop-blur-xl">
            <div className="w-16 h-16 rounded-2xl bg-error/10 border border-error/20 flex items-center justify-center mx-auto mb-6 text-error">
              <span className="material-symbols-outlined text-3xl">warning</span>
            </div>
            <h1 className="text-xl font-bold text-white mb-2">Signal Interrupted</h1>
            <p className="text-sm text-zinc-400 mb-6 leading-relaxed">
              We encountered an unexpected disruption in the signal flow.
            </p>
            {this.state.error && (
              <pre className="text-xs text-left bg-black/40 text-zinc-400 p-3 rounded-lg overflow-x-auto mb-6 max-h-32 border border-white/5">
                {this.state.error.message}
              </pre>
            )}
            <button
              onClick={this.handleReset}
              className="w-full py-3 px-6 rounded-xl font-semibold text-white bg-gradient-to-r from-[#7a00ff] to-[#0066ff] hover:opacity-90 transition-opacity shadow-lg shadow-purple-900/30"
            >
              Reconnect to Pulse
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
