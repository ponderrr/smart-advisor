import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/hooks/useAuth";
import { validateEnvironment } from "@/utils/envValidation";
import { useEffect } from "react";
import ErrorBoundary, {
  setupGlobalErrorHandlers,
} from "@/components/ErrorBoundary";

import Index from "@/pages/Index";
import AuthPage from "@/pages/AuthPage";
import ContentSelectionPage from "@/pages/ContentSelectionPage";
import QuestionCountPage from "@/pages/QuestionCountPage";
import QuestionnairePage from "@/pages/QuestionnairePage";
import ResultsPage from "@/pages/ResultsPage";
import AccountHistoryPage from "@/pages/AccountHistoryPage";
import NotFound from "@/pages/NotFound";
import ProtectedRoute from "@/components/ProtectedRoute";
import EmailCallback from "@/pages/EmailCallback";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 2,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

function App() {
  useEffect(() => {
    // Initialize global error handlers once for the entire app
    const cleanupGlobalErrorHandlers = setupGlobalErrorHandlers();

    // Validate critical environment variables for core functionality
    const criticalEnvVars = {
      VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
      VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
    };

    const missingCritical = Object.entries(criticalEnvVars)
      .filter(([_, value]) => !value)
      .map(([key]) => key);

    if (missingCritical.length > 0) {
      if (import.meta.env.DEV) {
        console.error(
          "CRITICAL: Missing required environment variables:",
          missingCritical
        );
        console.error(
          "The app cannot function without these variables. Please add them to your .env file:"
        );
        missingCritical.forEach((key) => console.error(`- ${key}`));
      }
      // Throw error for critical missing variables
      throw new Error(
        `Missing critical environment variables: ${missingCritical.join(", ")}`
      );
    }

    if (import.meta.env.DEV) {
      console.log("All critical environment variables are configured");
    }

    // Additional comprehensive validation (warnings only)
    const validation = validateEnvironment();
    if (!validation.isValid && import.meta.env.DEV) {
      console.warn("Environment validation warnings:", validation.warnings);
    }

    // Return cleanup function for global error handlers
    return cleanupGlobalErrorHandlers;
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Router>
            <div className="min-h-screen bg-background font-sans antialiased">
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<AuthPage />} />
                <Route
                  path="/content-selection"
                  element={
                    <ProtectedRoute>
                      <ContentSelectionPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/question-count"
                  element={
                    <ProtectedRoute>
                      <QuestionCountPage />
                    </ProtectedRoute>
                  }
                />
                <Route path="/auth/callback" element={<EmailCallback />} />
                <Route
                  path="/questionnaire"
                  element={
                    <ProtectedRoute>
                      <QuestionnairePage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/results"
                  element={
                    <ProtectedRoute>
                      <ResultsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/history"
                  element={
                    <ProtectedRoute>
                      <AccountHistoryPage />
                    </ProtectedRoute>
                  }
                />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </div>
            <Toaster />
          </Router>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
