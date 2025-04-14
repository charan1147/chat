import React from 'react';

class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null, errorInfo: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error caught by ErrorBoundary:", error, errorInfo);
    this.setState({ error, errorInfo });
    // Optionally send to a logging service (e.g., Sentry) here
  }

  resetError = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div>
          <h1>Something went wrong.</h1>
          <p>{this.state.error?.message || 'An unexpected error occurred.'}</p>
          <button onClick={this.resetError}>Try Again</button>
          {/* Uncomment for detailed debugging (remove in production) */}
          {/* <details>
            <summary>Stack Trace</summary>
            <pre>{this.state.errorInfo?.componentStack}</pre>
          </details> */}
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;