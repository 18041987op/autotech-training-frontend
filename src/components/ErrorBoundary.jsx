import React from "react";

/**
 * ErrorBoundary — catches render errors and shows a recovery screen
 * instead of a blank white page.
 */
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("ErrorBoundary caught:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
          <div className="max-w-sm w-full bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
            <div className="text-5xl mb-4">⚠️</div>
            <h2 className="text-lg font-bold text-gray-800 mb-2">
              Something went wrong
            </h2>
            <p className="text-gray-500 text-sm mb-6">
              An unexpected error occurred. Please go back and try again.
            </p>
            {this.state.error && (
              <p className="text-xs text-gray-400 bg-gray-100 rounded-lg px-3 py-2 mb-6 font-mono text-left break-all">
                {this.state.error.message}
              </p>
            )}
            <div className="flex flex-col gap-2">
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.history.back();
                }}
                className="w-full px-4 py-2.5 rounded-xl bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700 transition"
              >
                ← Go Back
              </button>
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.href = "/";
                }}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-gray-600 text-sm font-medium hover:bg-gray-50 transition"
              >
                Go to Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
