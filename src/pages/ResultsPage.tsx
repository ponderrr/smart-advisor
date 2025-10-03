import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { RefreshCw, Heart, User, LogOut, Star } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { enhancedRecommendationsService } from "@/services/enhancedRecommendations";
import { databaseService } from "@/services/database";
import { Recommendation } from "@/types/Recommendation";
import { ExpandableText } from "@/components/ExpandableText";
import {
  EnhancedButton,
  LoadingScreen,
  RecommendationLoadingShimmer,
} from "@/components/enhanced";
import { SafeLocalStorage } from "@/utils/localStorage";

// Utility function to safely serialize data, handling circular references and non-serializable values
const safeStringify = (obj: unknown): string => {
  const seen = new WeakSet();

  try {
    return JSON.stringify(obj, (key, value) => {
      // Handle circular references
      if (typeof value === "object" && value !== null) {
        if (seen.has(value)) {
          return "[Circular Reference]";
        }
        seen.add(value);
      }

      // Handle functions and other non-serializable values
      if (typeof value === "function") {
        return "[Function]";
      }

      if (typeof value === "symbol") {
        return "[Symbol]";
      }

      if (value === undefined) {
        return "[Undefined]";
      }

      return value;
    });
  } catch (error) {
    console.warn("Failed to stringify object, using fallback:", error);
    // Fallback: create a hash based on object keys and content type
    return `fallback-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
};

// Session storage key for tracking generated sessions
const GENERATED_SESSIONS_KEY = "smart_advisor_generated_sessions";

// Function to get generated sessions from localStorage
const getGeneratedSessions = (): Set<string> => {
  const stored = SafeLocalStorage.getJSON<string[]>(GENERATED_SESSIONS_KEY, []);
  return new Set(stored);
};

// Function to save generated sessions to localStorage
const saveGeneratedSession = (sessionId: string) => {
  const sessions = getGeneratedSessions();
  sessions.add(sessionId);

  // Keep only the last 10 sessions to prevent localStorage bloat
  const sessionsArray = Array.from(sessions);
  const sessionsToStore =
    sessionsArray.length > 10 ? sessionsArray.slice(-10) : sessionsArray;

  SafeLocalStorage.setJSON(GENERATED_SESSIONS_KEY, sessionsToStore);
};

const ResultsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generationStep, setGenerationStep] = useState<string>(
    "Analyzing your answers..."
  );
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Track if recommendations have been generated for this session
  const hasGeneratedRef = useRef(false);
  const currentSessionRef = useRef<string | null>(null);
  const generatedRecommendationsRef = useRef<Recommendation[]>([]);
  const isInitialLoadRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Get data from navigation state
  const { contentType, answers, questions } = location.state || {};

  // Create a unique session identifier based on the answers and content type
  const sessionId = (() => {
    if (!answers || !contentType) {
      return null;
    }

    try {
      const serializedAnswers = safeStringify(answers);
      const userId = user?.id || "anonymous";
      return `${serializedAnswers}-${contentType}-${userId}`;
    } catch (error) {
      console.warn("Failed to create session ID, using fallback:", error);
      return `fallback-session-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}`;
    }
  })();

  // Function to handle generating new recommendations
  const handleGenerateRecommendations = useCallback(async () => {
    if (!sessionId || !user) return;

    // Cancel any existing operation
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new AbortController for this operation
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      setLoading(true);
      setError(null);

      console.log("Starting AI recommendation generation for user:", user.id);

      // Check if operation was aborted
      if (abortController.signal.aborted) return;

      // Update generation steps for better UX
      setGenerationStep("Analyzing your answers...");
      await new Promise((resolve) => setTimeout(resolve, 1000));

      if (abortController.signal.aborted) return;

      setGenerationStep("Generating personalized recommendations...");
      await new Promise((resolve) => setTimeout(resolve, 500));

      if (abortController.signal.aborted) return;

      setGenerationStep("Enhancing with movie and book data...");

      const questionnaireData = {
        answers,
        contentType,
        userAge: user.age,
      };

      const recs = await enhancedRecommendationsService.retryRecommendation(
        questionnaireData,
        user.id
      );

      if (abortController.signal.aborted) return;

      setGenerationStep("Finalizing your recommendations...");
      await new Promise((resolve) => setTimeout(resolve, 500));

      if (abortController.signal.aborted) return;

      console.log("Recommendations generated successfully:", recs);

      // Cache the recommendations for this session
      generatedRecommendationsRef.current = recs;
      currentSessionRef.current = sessionId;

      // Mark this session as generated
      saveGeneratedSession(sessionId);

      setRecommendations(recs);
    } catch (error) {
      // Don't set error if operation was aborted
      if (abortController.signal.aborted) {
        console.log("Recommendation generation aborted");
        return;
      }
      console.error("Error generating recommendations:", error);
      setError(
        "Failed to generate personalized recommendations. Please try again."
      );
    } finally {
      // Only update loading state if not aborted
      if (!abortController.signal.aborted) {
        setLoading(false);
      }
      // Clear the abort controller reference
      if (abortControllerRef.current === abortController) {
        abortControllerRef.current = null;
      }
    }
  }, [sessionId, user, answers, contentType]);

  // Function to check if session was already generated
  const wasSessionGenerated = useCallback((sessionId: string): boolean => {
    const generatedSessions = getGeneratedSessions();
    return generatedSessions.has(sessionId);
  }, []);

  // Function to handle confirmation dialog
  const handleConfirmGeneration = () => {
    setShowConfirmDialog(false);
    handleGenerateRecommendations();
  };

  const handleCancelGeneration = () => {
    setShowConfirmDialog(false);
    navigate("/history");
  };

  useEffect(() => {
    // Redirect if no data
    if (!contentType || !answers || !user || !sessionId) {
      navigate("/content-selection");
      return;
    }

    // Check if this is the same session as before
    const isSameSession = currentSessionRef.current === sessionId;
    const hasExistingRecommendations =
      generatedRecommendationsRef.current.length > 0;

    // If we have cached recommendations for this session, use them
    if (isSameSession && hasExistingRecommendations) {
      console.log("Using cached recommendations for same session");
      setRecommendations(generatedRecommendationsRef.current);
      setLoading(false);
      return;
    }

    // Check if this session was already generated (from localStorage)
    const sessionWasGenerated = wasSessionGenerated(sessionId);

    if (sessionWasGenerated && isInitialLoadRef.current) {
      // This session was already generated before, show confirmation dialog
      console.log("Session was already generated, showing confirmation dialog");
      setShowConfirmDialog(true);
      setLoading(false);
      isInitialLoadRef.current = false;
      return;
    }

    // Generate recommendations for new session
    if (!sessionWasGenerated) {
      console.log("Generating recommendations for new session:", sessionId);
      handleGenerateRecommendations();
    } else {
      setLoading(false);
    }

    isInitialLoadRef.current = false;
  }, [
    contentType,
    answers,
    user,
    sessionId,
    navigate,
    wasSessionGenerated,
    handleGenerateRecommendations,
  ]);

  // Add beforeunload event listener to warn about page refresh
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (recommendations.length > 0 && !error) {
        e.preventDefault();
        e.returnValue =
          "You have unsaved recommendations. Are you sure you want to leave?";
        return "You have unsaved recommendations. Are you sure you want to leave?";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [recommendations.length, error]);

  // Cleanup effect to prevent memory leaks
  useEffect(() => {
    return () => {
      // Abort any ongoing operations
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }

      // Clear refs to prevent memory leaks
      hasGeneratedRef.current = false;
      currentSessionRef.current = null;
      generatedRecommendationsRef.current = [];
      isInitialLoadRef.current = true;
    };
  }, []);

  const handleLogoClick = () => {
    navigate("/");
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const handleGetAnother = () => {
    // Abort any ongoing operations
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    // Clear the session cache when getting another recommendation
    currentSessionRef.current = null;
    generatedRecommendationsRef.current = [];
    hasGeneratedRef.current = false;
    isInitialLoadRef.current = true;
    navigate("/content-selection");
  };

  const handleViewHistory = () => {
    navigate("/history");
  };

  const handleToggleFavorite = async (recommendationId: string) => {
    try {
      const { error } = await databaseService.toggleFavorite(recommendationId);
      if (!error) {
        // Update both local state and cached recommendations
        const updatedRecs = recommendations.map((rec) =>
          rec.id === recommendationId
            ? { ...rec, is_favorited: !rec.is_favorited }
            : rec
        );
        setRecommendations(updatedRecs);
        generatedRecommendationsRef.current = updatedRecs;
      } else {
        console.error("Error toggling favorite:", error);
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
    }
  };

  const handleRetry = () => {
    // Abort any ongoing operations
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    // Clear cache and regenerate
    currentSessionRef.current = null;
    generatedRecommendationsRef.current = [];
    hasGeneratedRef.current = false;
    isInitialLoadRef.current = true;
    handleGenerateRecommendations();
  };

  if (!contentType || !answers || !user) {
    return null; // Redirect will happen in useEffect
  }

  // Show confirmation dialog if needed
  if (showConfirmDialog) {
    return (
      <div className="bg-appPrimary text-textPrimary font-inter min-h-screen">
        {/* Header */}
        <header className="h-[72px] flex items-center justify-between px-6 md:px-12 bg-appPrimary">
          <button
            onClick={handleLogoClick}
            className="text-textPrimary text-xl font-medium cursor-pointer hover:opacity-80 transition-opacity duration-200"
          >
            Smart Advisor
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-appAccent rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">
                {user?.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <span className="text-textSecondary text-[15px]">
              Hi, {user?.name}
            </span>
          </div>
        </header>

        <main className="flex flex-col items-center justify-center px-6 pt-[120px] pb-[100px]">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-8">
              <RefreshCw className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-semibold text-textPrimary mb-4">
              Generate New Recommendations?
            </h2>
            <p className="text-textSecondary mb-6">
              It looks like you've already received recommendations for these
              answers. Generating new ones will create additional entries in
              your history.
            </p>
            <div className="flex gap-4 justify-center">
              <EnhancedButton
                onClick={handleCancelGeneration}
                variant="outline"
              >
                Go to History
              </EnhancedButton>
              <EnhancedButton
                onClick={handleConfirmGeneration}
                variant="primary"
                glow
              >
                Generate New
              </EnhancedButton>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-appPrimary text-textPrimary font-inter min-h-screen">
        {/* Header */}
        <header className="h-[72px] flex items-center justify-between px-6 md:px-12 bg-appPrimary">
          <button
            onClick={handleLogoClick}
            className="text-textPrimary text-xl font-medium cursor-pointer hover:opacity-80 transition-opacity duration-200"
          >
            Smart Advisor
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-appAccent rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">
                {user?.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <span className="text-textSecondary text-[15px]">
              Hi, {user?.name}
            </span>
          </div>
        </header>

        <LoadingScreen
          message="Creating Your Recommendations"
          submessage={generationStep}
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-appPrimary text-textPrimary font-inter min-h-screen">
        {/* Header */}
        <header className="h-[72px] flex items-center justify-between px-6 md:px-12 bg-appPrimary">
          <button
            onClick={handleLogoClick}
            className="text-textPrimary text-xl font-medium cursor-pointer hover:opacity-80 transition-opacity duration-200"
          >
            Smart Advisor
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-appAccent rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">
                {user?.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <span className="text-textSecondary text-[15px]">
              Hi, {user?.name}
            </span>
          </div>
        </header>

        {/* Error Content */}
        <main className="flex flex-col items-center justify-center px-6 pt-[120px] pb-[100px]">
          <div className="text-center max-w-md animate-in fade-in duration-700">
            <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-8">
              <span className="text-white text-2xl">!</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-textPrimary mb-4">
              Recommendation Generation Failed
            </h1>
            <p className="text-lg text-textSecondary mb-8">{error}</p>
            <div className="flex gap-4 justify-center">
              <EnhancedButton onClick={handleRetry} variant="primary" glow>
                <RefreshCw size={16} />
                Try Again
              </EnhancedButton>
              <EnhancedButton
                onClick={() =>
                  navigate("/questionnaire", { state: { contentType } })
                }
                variant="secondary"
              >
                Retake Quiz
              </EnhancedButton>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="bg-appPrimary text-textPrimary font-inter min-h-screen">
      {/* Header */}
      <header className="h-[72px] flex items-center justify-between px-6 md:px-12 bg-appPrimary">
        <button
          onClick={handleLogoClick}
          className="text-textPrimary text-xl font-medium cursor-pointer hover:opacity-80 transition-opacity duration-200"
        >
          Smart Advisor
        </button>
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity duration-200"
          >
            <div className="w-8 h-8 bg-appAccent rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">
                {user?.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <span className="text-textSecondary text-[15px]">
              Hi, {user?.name}
            </span>
          </button>

          {showUserMenu && (
            <div className="user-menu absolute right-0 top-full mt-2 w-48 bg-appSecondary border border-gray-700 rounded-lg shadow-lg z-50">
              <button
                onClick={() => navigate("/history")}
                className="user-menu-item w-full flex items-center gap-2 px-4 py-3 text-textSecondary hover:text-textPrimary hover:bg-gray-700 transition-colors duration-200"
              >
                <User size={16} />
                View History
              </button>
              <button
                onClick={handleSignOut}
                className="user-menu-item w-full flex items-center gap-2 px-4 py-3 text-textSecondary hover:text-textPrimary hover:bg-gray-700 transition-colors duration-200 border-t border-gray-700"
              >
                <LogOut size={16} />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 sm:px-6 pt-[80px] md:pt-[120px] pb-[100px]">
        {/* Progress Indicator */}
        <div className="text-center text-textTertiary text-sm mb-8 animate-in fade-in duration-500">
          Step 4 of 4
        </div>

        {/* Title */}
        <div className="text-center mb-12 animate-in fade-in duration-700 delay-200">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-textPrimary mb-4">
            Your AI-Generated Recommendations
          </h1>
          <p className="text-base sm:text-lg text-textSecondary">
            Based on your personalized answers, here's what our AI recommends
          </p>
        </div>

        {/* Recommendations */}
        <div className="max-w-6xl mx-auto space-y-8 sm:space-y-12">
          {recommendations.map((rec, index) => (
            <div
              key={rec.id}
              className="recommendation-card bg-appSecondary border border-gray-700 rounded-2xl p-6 sm:p-8 flex flex-col lg:flex-row gap-6 lg:gap-8"
              style={{ animationDelay: `${400 + index * 200}ms` }}
            >
              {/* Poster/Cover - Larger on mobile, maintains aspect ratio */}
              <div className="w-full sm:w-64 lg:w-72 h-80 sm:h-96 lg:h-[28rem] bg-gray-700 rounded-lg flex-shrink-0 overflow-hidden mx-auto lg:mx-0">
                {rec.poster_url ? (
                  <img
                    src={rec.poster_url}
                    alt={rec.title}
                    className="w-full h-full object-cover rounded-lg transition-transform duration-300 hover:scale-105"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                      e.currentTarget.nextElementSibling?.classList.remove(
                        "hidden"
                      );
                    }}
                  />
                ) : null}
                <div
                  className={`w-full h-full flex items-center justify-center text-textTertiary ${
                    rec.poster_url ? "hidden" : ""
                  }`}
                >
                  No Image
                </div>
              </div>

              {/* Content - More spacious */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex-1 min-w-0">
                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-textPrimary mb-3 leading-tight">
                      {rec.title}
                    </h2>
                    {rec.director && (
                      <p className="text-base sm:text-lg text-textSecondary mb-1">
                        Directed by {rec.director}
                      </p>
                    )}
                    {rec.author && (
                      <p className="text-base sm:text-lg text-textSecondary mb-1">
                        By {rec.author}
                      </p>
                    )}
                    {rec.year && (
                      <p className="text-base sm:text-lg text-textSecondary">
                        {rec.year}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handleToggleFavorite(rec.id)}
                    className={`favorite-button p-3 rounded-full transition-colors duration-200 ml-4 flex-shrink-0 ${
                      rec.is_favorited
                        ? "bg-red-500 text-white favorited"
                        : "bg-gray-700 text-textSecondary hover:text-red-500"
                    }`}
                  >
                    <Heart
                      size={24}
                      fill={rec.is_favorited ? "currentColor" : "none"}
                    />
                  </button>
                </div>

                {/* Rating - Larger */}
                {rec.rating && (
                  <div className="flex items-center gap-3 mb-6">
                    <Star className="w-6 h-6 text-yellow-500 fill-current" />
                    <span className="text-lg sm:text-xl text-textPrimary font-medium">
                      {rec.rating}
                    </span>
                  </div>
                )}

                {/* Genres - Larger badges */}
                {rec.genres && rec.genres.length > 0 && (
                  <div className="flex flex-wrap gap-2 sm:gap-3 mb-6">
                    {rec.genres.map((g, genreIndex) => (
                      <span
                        key={g}
                        className="px-4 py-2 bg-appAccent text-white text-sm sm:text-base rounded-full animate-in fade-in duration-500"
                        style={{
                          animationDelay: `${
                            800 + index * 200 + genreIndex * 100
                          }ms`,
                        }}
                      >
                        {g}
                      </span>
                    ))}
                  </div>
                )}

                {/* Expandable Description - Much larger and more prominent */}
                {rec.description && (
                  <div
                    className="animate-in fade-in duration-700"
                    style={{ animationDelay: `${1000 + index * 200}ms` }}
                  >
                    <ExpandableText
                      text={rec.description}
                      title={
                        rec.type === "movie"
                          ? "Plot Summary:"
                          : "Book Description:"
                      }
                      maxLines={5} // Increased from 3 to 5
                      className="bg-appPrimary text-base sm:text-lg leading-relaxed" // Larger text and better spacing
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-12 animate-in fade-in duration-700 delay-1000">
          <EnhancedButton
            onClick={handleGetAnother}
            variant="primary"
            size="lg"
            glow
            className="w-full sm:w-auto"
          >
            Get Another Recommendation
          </EnhancedButton>
          <EnhancedButton
            onClick={handleViewHistory}
            variant="secondary"
            size="lg"
            className="w-full sm:w-auto"
          >
            View My History
          </EnhancedButton>
        </div>
      </main>
    </div>
  );
};

export default ResultsPage;
