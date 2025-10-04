import { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, AlertTriangle } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error | undefined;
  errorInfo?: ErrorInfo | undefined;
}

// Custom event for global error handling
const GLOBAL_ERROR_EVENT = "GLOBAL_ERROR_EVENT";

interface GlobalErrorEventDetail {
  error: Error;
  errorInfo?: ErrorInfo | undefined;
}

// Global error handler for unhandled errors
class GlobalErrorHandler {
  private static instance: GlobalErrorHandler;

  static getInstance(): GlobalErrorHandler {
    if (!GlobalErrorHandler.instance) {
      GlobalErrorHandler.instance = new GlobalErrorHandler();
    }
    return GlobalErrorHandler.instance;
  }

  handleError(error: Error, errorInfo?: ErrorInfo) {
    console.error("Global error handler caught:", error, errorInfo);

    // Dispatch custom event for error boundaries to handle
    const event = new CustomEvent<GlobalErrorEventDetail>(GLOBAL_ERROR_EVENT, {
      detail: { error, errorInfo: errorInfo || undefined },
    });
    window.dispatchEvent(event);
  }
}

// Global error handlers
let isGlobalErrorHandlersInitialized = false;
let originalFetch: typeof window.fetch | null = null;
let unhandledRejectionHandler: ((event: PromiseRejectionEvent) => void) | null =
  null;
let errorHandler: ((event: ErrorEvent) => void) | null = null;

export const setupGlobalErrorHandlers = (): (() => void) => {
  // Guard against multiple initializations
  if (isGlobalErrorHandlersInitialized) {
    return () => {}; // Return no-op cleanup function
  }

  const errorHandlerInstance = GlobalErrorHandler.getInstance();

  // Store original fetch if not already stored
  if (originalFetch === null) {
    originalFetch = window.fetch;
  }

  // Create handler functions
  unhandledRejectionHandler = (event: PromiseRejectionEvent) => {
    console.error("Unhandled promise rejection:", event.reason);
    errorHandlerInstance.handleError(
      new Error(`Unhandled Promise Rejection: ${event.reason}`),
      { componentStack: "Global Promise Handler" }
    );
  };

  errorHandler = (event: ErrorEvent) => {
    console.error("Global error:", event.error);
    errorHandlerInstance.handleError(event.error || new Error(event.message), {
      componentStack: "Global Error Handler",
    });
  };

  // Add event listeners
  window.addEventListener("unhandledrejection", unhandledRejectionHandler);
  window.addEventListener("error", errorHandler);

  // Override fetch for Edge Function error handling
  window.fetch = async (...args) => {
    try {
      const response = await originalFetch!(...args);

      // Check for Edge Function errors
      if (response.url.includes("/functions/v1/") && !response.ok) {
        const errorMessage = `Edge Function Error: ${response.status} ${response.statusText}`;

        errorHandlerInstance.handleError(new Error(errorMessage), {
          componentStack: `Edge Function: ${response.url}`,
        });
      }

      return response;
    } catch (error) {
      console.error("Fetch error:", error);
      // Re-throw the error to maintain fetch behavior for callers
      // The global error handler will catch truly unhandled errors
      throw error;
    }
  };

  isGlobalErrorHandlersInitialized = true;

  // Return cleanup function
  return () => {
    if (unhandledRejectionHandler) {
      window.removeEventListener(
        "unhandledrejection",
        unhandledRejectionHandler
      );
      unhandledRejectionHandler = null;
    }
    if (errorHandler) {
      window.removeEventListener("error", errorHandler);
      errorHandler = null;
    }
    if (originalFetch) {
      window.fetch = originalFetch;
      originalFetch = null;
    }
    isGlobalErrorHandlersInitialized = false;
  };
};

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error in development only
    if (import.meta.env.DEV) {
      console.error("ErrorBoundary caught an error:", error, errorInfo);
    }

    // Update state with error info
    this.setState({ errorInfo });
  }

  public componentDidMount() {
    // Listen for global error events
    const handleGlobalError = (event: CustomEvent<GlobalErrorEventDetail>) => {
      const { error, errorInfo } = event.detail;
      this.setState({
        hasError: true,
        error,
        errorInfo: errorInfo || undefined,
      });
    };

    window.addEventListener(
      GLOBAL_ERROR_EVENT,
      handleGlobalError as EventListener
    );

    // Store the handler reference for cleanup
    (this as any).globalErrorHandler = handleGlobalError;
  }

  public componentWillUnmount() {
    // Remove global error event listener
    if ((this as any).globalErrorHandler) {
      window.removeEventListener(
        GLOBAL_ERROR_EVENT,
        (this as any).globalErrorHandler as EventListener
      );
    }
  }

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
    });
  };

  private handleReload = () => {
    window.location.reload();
  };

  private getErrorType = (error?: Error): string => {
    if (!error) return "Unknown Error";

    if (error.message.includes("Edge Function Error")) return "API Error";
    if (error.message.includes("Unhandled Promise Rejection"))
      return "Async Error";
    if (error.message.includes("ChunkLoadError")) return "Loading Error";
    if (error.message.includes("NetworkError")) return "Network Error";

    return "Application Error";
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const errorType = this.getErrorType(this.state.error);

      return (
        <div className="min-h-screen bg-appPrimary flex items-center justify-center px-6">
          <div className="text-center max-w-lg">
            <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-8">
              <AlertTriangle className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-textPrimary mb-2">
              Something went wrong
            </h1>
            <p className="text-sm text-textTertiary mb-4">{errorType}</p>
            <p className="text-textSecondary mb-8">
              {errorType === "API Error"
                ? "There was an issue connecting to our servers. Please check your internet connection and try again."
                : errorType === "Async Error"
                ? "An asynchronous operation failed. This might be due to a network issue or server problem."
                : errorType === "Loading Error"
                ? "Failed to load application resources. This might be due to a network issue or outdated cache."
                : "An unexpected error occurred. Please try refreshing the page or contact support if the problem persists."}
            </p>
            <div className="flex gap-4 justify-center">
              <Button
                onClick={this.handleReset}
                variant="outline"
                className="border-gray-600 text-textSecondary hover:text-textPrimary"
              >
                Try Again
              </Button>
              <Button
                onClick={this.handleReload}
                className="bg-appAccent hover:bg-opacity-90 flex items-center gap-2"
              >
                <RefreshCw size={16} />
                Reload Page
              </Button>
            </div>
            {import.meta.env.DEV && this.state.error && (
              <details className="mt-8 text-left">
                <summary className="text-textTertiary cursor-pointer hover:text-textSecondary">
                  Error Details (Development)
                </summary>
                <div className="mt-4 p-4 bg-gray-800 rounded text-xs text-gray-300 overflow-auto">
                  <div className="mb-2">
                    <strong>Error:</strong> {this.state.error.message}
                  </div>
                  {this.state.error.stack && (
                    <div>
                      <strong>Stack Trace:</strong>
                      <pre className="mt-1 whitespace-pre-wrap">
                        {this.state.error.stack}
                      </pre>
                    </div>
                  )}
                  {this.state.errorInfo && (
                    <div className="mt-2">
                      <strong>Component Stack:</strong>
                      <pre className="mt-1 whitespace-pre-wrap">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
