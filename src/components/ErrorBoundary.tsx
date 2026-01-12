'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error details
    console.group('🚨 ErrorBoundary Caught an Error');
    console.error('Error:', error);
    console.error('Error Info:', errorInfo);
    console.error('Component Stack:', errorInfo.componentStack);
    console.groupEnd();

    // Check if it's the specific object rendering error
    if (error.message.includes('Objects are not valid as a React child')) {
      console.group('🔍 Object Rendering Error Detected');
      console.warn('This error is likely caused by rendering a translation object directly in JSX');
      console.warn('Look for patterns like: {title} instead of {title.en}');
      console.warn('Search your codebase for objects with {en, ta} keys');
      console.groupEnd();
    }

    // Update state with error details
    this.setState({
      error,
      errorInfo,
    });

    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI with debugging info
      return (
        <div style={{
          padding: '20px',
          margin: '20px',
          border: '2px solid #ff6b6b',
          borderRadius: '8px',
          backgroundColor: '#ffe0e0',
          fontFamily: 'monospace'
        }}>
          <h2 style={{ color: '#d63031', margin: '0 0 16px 0' }}>
            🚨 Component Error Detected
          </h2>
          
          <details style={{ marginBottom: '16px' }}>
            <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
              Error Details
            </summary>
            <pre style={{ 
              background: '#f8f9fa', 
              padding: '12px', 
              borderRadius: '4px',
              overflow: 'auto',
              fontSize: '12px'
            }}>
              {this.state.error?.message}
            </pre>
          </details>

          <details>
            <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
              Component Stack
            </summary>
            <pre style={{ 
              background: '#f8f9fa', 
              padding: '12px', 
              borderRadius: '4px',
              overflow: 'auto',
              fontSize: '12px'
            }}>
              {this.state.errorInfo?.componentStack}
            </pre>
          </details>

          <div style={{ marginTop: '16px', fontSize: '14px' }}>
            <strong>💡 Debugging Tips:</strong>
            <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
              <li>Check the browser console for detailed logs</li>
              <li>Look for objects with {`{en, ta}`} keys in your JSX</li>
              <li>Use {`{object.en}`} instead of {`{object}`}</li>
              <li>Add type checking: {`typeof obj === 'string' ? obj : obj?.toString()`}</li>
            </ul>
          </div>

          <button
            onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
            style={{
              marginTop: '16px',
              padding: '8px 16px',
              backgroundColor: '#0984e3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            🔄 Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

// Hook version for functional components (alternative)
export function useErrorHandler() {
  return (error: Error, errorInfo: ErrorInfo) => {
    console.group('🚨 Error Handler');
    console.error('Error:', error);
    console.error('Error Info:', errorInfo);
    console.groupEnd();
  };
}