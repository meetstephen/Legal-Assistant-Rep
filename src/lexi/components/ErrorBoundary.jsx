// ============================================================
// lexi/components/ErrorBoundary.jsx — top-level crash guard
//
// Catches render-time errors anywhere in the tree so a single bad state can't
// white-screen the whole app. Offers Reload and a last-resort "reset local
// data" recovery. Deliberately self-contained (no context/hooks) so it still
// works even if the app's providers are what failed.
// ============================================================

import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('LexiAssist crashed:', error, info);
  }

  handleReset = () => {
    try {
      Object.keys(localStorage)
        .filter((k) => k.startsWith('lexi2:'))
        .forEach((k) => localStorage.removeItem(k));
    } catch {
      /* ignore */
    }
    window.location.reload();
  };

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100 px-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center">
          <div className="text-3xl mb-2">⚖️</div>
          <h1 className="text-lg font-bold mb-1">Something went wrong</h1>
          <p className="text-sm text-slate-400 mb-4">
            LexiAssist hit an unexpected error. Your saved data is still on this device.
          </p>
          {this.state.error?.message && (
            <pre className="text-left text-xs bg-slate-800 rounded-lg p-3 mb-4 overflow-auto max-h-32 text-rose-300">
              {String(this.state.error.message)}
            </pre>
          )}
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2.5 rounded-xl font-semibold bg-gradient-to-r from-emerald-500 to-teal-500 text-white"
            >
              Reload app
            </button>
            <button
              onClick={this.handleReset}
              className="px-4 py-2.5 rounded-xl font-semibold bg-slate-800 text-slate-200 border border-slate-700"
            >
              Reset local data &amp; reload
            </button>
          </div>
        </div>
      </div>
    );
  }
}
