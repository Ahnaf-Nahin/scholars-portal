import React, { Component, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw, LogIn } from 'lucide-react';

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
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('[Application ErrorBoundary Caught Error]:', error, errorInfo);
  }

  private handleReset = (): void => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  private handleClearAndSignIn = (): void => {
    try {
      localStorage.removeItem('ssc_portal_persisted_session');
      sessionStorage.clear();
    } catch {
      // ignore
    }
    window.location.href = '/';
  };

  public render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center">
          <div className="max-w-md w-full bg-[#0A0A0A] border border-rose-500/30 rounded-2xl p-6 sm:p-8 space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div>
              <h2 className="font-display text-lg sm:text-xl font-bold text-white">
                Dashboard Loading Alert
              </h2>
              <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                An unexpected interface rendering issue was caught. Your credentials and database records remain secure.
              </p>
              {this.state.error?.message && (
                <div className="mt-3 p-2.5 rounded-lg bg-black border border-white/10 font-mono text-[11px] text-rose-300 break-words text-left">
                  {this.state.error.message}
                </div>
              )}
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center gap-2 justify-center">
              <button
                type="button"
                onClick={this.handleReset}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white text-black font-display font-bold text-xs hover:bg-neutral-200 transition-all cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reload Dashboard</span>
              </button>
              <button
                type="button"
                onClick={this.handleClearAndSignIn}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 text-white hover:bg-white/20 border border-white/20 font-display font-semibold text-xs transition-all cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Return to Sign In</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
