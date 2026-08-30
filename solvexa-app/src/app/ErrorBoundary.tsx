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
        <div className="min-h-screen w-full bg-[#0A0A0B] flex items-center justify-center p-4 sm:p-6 text-center select-none">
          <div
            className="w-full max-w-[440px] bg-[#141416]/95 border border-white/15 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-2xl animate-in fade-in"
            style={{ margin: '0 auto' }}
          >
            <div className="w-14 h-14 rounded-2xl bg-error/15 border border-error/30 flex items-center justify-center mx-auto mb-5 text-error shadow-lg shadow-error/10">
              <span className="material-symbols-outlined text-2xl">warning</span>
            </div>
            <h1 className="text-lg sm:text-xl font-extrabold text-white tracking-tight mb-2">
              Signal Interrupted
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mb-6 leading-relaxed max-w-sm mx-auto">
              We encountered an unexpected disruption in the signal flow.
            </p>
            {this.state.error && (
              <pre className="text-[11px] text-left bg-black/60 text-zinc-400 p-3 rounded-xl overflow-x-auto mb-6 max-h-32 border border-white/10 custom-scrollbar whitespace-pre-wrap break-words">
                {this.state.error.message}
              </pre>
            )}
            <button
              onClick={this.handleReset}
              className="w-full py-3 px-6 rounded-xl font-bold text-xs sm:text-sm text-white bg-gradient-to-r from-[#7a00ff] to-[#0066ff] hover:opacity-95 transition-all shadow-lg shadow-purple-900/40 hover:scale-[1.01] active:scale-[0.99]"
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
