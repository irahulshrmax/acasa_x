// components/ErrorBoundary.tsx
'use client';

import React, { Component, ReactNode, ErrorInfo } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({
      errorInfo,
    });

    // Log error to console
    console.error('Error caught by ErrorBoundary:', error, errorInfo);

    // Call onError prop if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // You can also send error to your logging service
    // Example: Sentry.captureException(error, { extra: { errorInfo } });
  }

  render(): ReactNode {
    const { hasError, error } = this.state;
    const { children, fallback } = this.props;

    if (hasError) {
      // If custom fallback is provided, use it
      if (fallback) {
        return fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <div className="max-w-lg w-full bg-white rounded-lg shadow-lg p-8">
            <div className="flex items-center justify-center mb-6">
              <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center">
                <svg
                  className="h-8 w-8 text-red-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">
              Something went wrong
            </h1>
            <p className="text-gray-600 text-center mb-6">
              We apologize for the inconvenience. Please try refreshing the page.
            </p>
            {process.env.NODE_ENV === 'development' && error && (
              <div className="mb-6 p-4 bg-gray-100 rounded-md overflow-auto max-h-40">
                <p className="text-sm font-mono text-red-600">{error.toString()}</p>
              </div>
            )}
            <button
              onClick={() => {
                this.setState({
                  hasError: false,
                  error: null,
                  errorInfo: null,
                });
                window.location.reload();
              }}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return children;
  }
}