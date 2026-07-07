import React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Catches render-time crashes anywhere in the routed screen tree and shows a
 * recovery UI instead of leaving a blank/frozen frame on screen. Resets
 * automatically when the route (children) changes via the `key` prop passed
 * from the parent.
 */
export class RouteErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error('[RouteErrorBoundary] caught render error:', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-black text-white p-6 text-center gap-4">
          <span className="text-5xl">⚠️</span>
          <h2 className="text-lg font-bold">Something went wrong</h2>
          <p className="text-sm text-gray-400 max-w-xs">
            This screen ran into an error. Try reloading — your data is safe.
          </p>
          <button
            onClick={() => {
              this.setState({ error: null });
              window.location.href = '/';
            }}
            className="px-6 py-3 bg-neon-purple text-white font-bold rounded-xl text-sm mt-2"
          >
            Go Home
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
