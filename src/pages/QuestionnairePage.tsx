import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft, ArrowRight, User, LogOut, RefreshCw } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { generateQuestionsWithRetry } from "@/services/openai";
import { Question } from "@/types/Question";
import { Answer } from "@/types/Answer";
import { v4 as uuidv4 } from "uuid";
import {
  EnhancedButton,
  EnhancedTextarea,
  EnhancedProgress,
  LoadingScreen,
  QuestionLoadingShimmer,
} from "@/components/enhanced";

const QuestionnairePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const contentType = location.state?.contentType as "movie" | "book" | "both";
  const questionCount = location.state?.questionCount || 5;

  useEffect(() => {
    if (!contentType || !user) {
      navigate("/content-selection");
      return;
    }

    loadQuestions();
  }, [contentType, user, navigate, questionCount]);

  const loadQuestions = async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log("Loading AI-generated questions...");

      const generatedQuestions = await generateQuestionsWithRetry(
        contentType,
        user.age,
        questionCount
      );

      console.log("Questions loaded successfully:", generatedQuestions);
      setQuestions(generatedQuestions);
    } catch (err) {
      console.error("Failed to load questions:", err);
      setError("Failed to generate personalized questions. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogoClick = () => {
    navigate("/");
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const handleRetry = () => {
    loadQuestions();
  };

  const currentQuestion = questions[currentQuestionIndex];
  const progress =
    questions.length > 0
      ? ((currentQuestionIndex + 1) / questions.length) * 100
      : 0;

  const handleAnswer = (answer: string) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: answer,
    }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    } else {
      navigate("/question-count", { state: { contentType } });
    }
  };

  const handleComplete = async () => {
    if (!user) return;

    setIsSubmitting(true);

    const formattedAnswers: Answer[] = questions.map((q) => ({
      id: uuidv4(),
      question_id: q.id,
      answer_text: answers[q.id] || "",
      created_at: new Date().toISOString(),
    }));

    navigate("/results", {
      state: {
        answers: formattedAnswers,
        contentType,
        userAge: user.age,
      },
    });
  };

  const canProceed =
    currentQuestion && answers[currentQuestion.id]?.trim().length > 0;

  if (isLoading) {
    return (
      <div className="bg-appPrimary text-textPrimary font-inter min-h-screen">
        <header className="h-[72px] flex items-center justify-between px-6 md:px-12">
          <button
            onClick={handleLogoClick}
            className="text-textPrimary text-xl font-medium"
          >
            Smart Advisor
          </button>
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2"
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

        <LoadingScreen
          message={`Generating Your ${questionCount} Questions...`}
          submessage="Our AI is creating personalized questions just for you based on your preferences."
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-appPrimary text-textPrimary font-inter min-h-screen">
        <header className="h-[72px] flex items-center justify-between px-6 md:px-12">
          <button
            onClick={handleLogoClick}
            className="text-textPrimary text-xl font-medium"
          >
            Smart Advisor
          </button>
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2"
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

        <main className="flex flex-col items-center justify-center px-6 pt-[120px]">
          <div className="text-center max-w-md animate-in fade-in duration-700">
            <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-8">
              <span className="text-white text-2xl">!</span>
            </div>
            <h2 className="text-2xl font-semibold text-textPrimary mb-4">
              Unable to Generate Questions
            </h2>
            <p className="text-textSecondary mb-6">{error}</p>
            <div className="flex gap-4 justify-center">
              <EnhancedButton onClick={handleRetry} variant="primary" glow>
                <RefreshCw size={16} />
                Try Again
              </EnhancedButton>
              <EnhancedButton
                onClick={() =>
                  navigate("/question-count", { state: { contentType } })
                }
                variant="outline"
              >
                Go Back
              </EnhancedButton>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="bg-appPrimary text-textPrimary font-inter min-h-screen">
      <header className="h-[72px] flex items-center justify-between px-6 md:px-12">
        <button
          onClick={handleLogoClick}
          className="text-textPrimary text-xl font-medium"
        >
          Smart Advisor
        </button>
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2"
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

      <main className="px-6 pt-[80px] md:pt-[120px] pb-[100px]">
        <div className="max-w-2xl mx-auto">
          {/* Progress Indicator */}
          <div className="text-center text-textTertiary text-sm mb-8 animate-in fade-in duration-500">
            Step 3 of 4
          </div>

          <div className="mb-8 animate-in fade-in duration-700">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-semibold text-textPrimary">
                Question {currentQuestionIndex + 1} of {questions.length}
              </h1>
              <span className="text-sm text-textSecondary capitalize">
                {contentType} recommendation
              </span>
            </div>
            <EnhancedProgress
              value={progress}
              className="h-3"
              showGlow={true}
            />
          </div>

          <Card className="mb-8 bg-appSecondary border-gray-700 animate-in fade-in duration-700 delay-300">
            <CardHeader>
              <CardTitle className="text-xl text-textPrimary">
                {currentQuestion.text}
              </CardTitle>
              <CardDescription className="text-textSecondary">
                Take your time to think about your answer. The more details you
                provide, the better we can tailor our recommendation.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EnhancedTextarea
                value={answers[currentQuestion.id] || ""}
                onChange={(e) => handleAnswer(e.target.value)}
                placeholder="Share your thoughts..."
                className="min-h-32 resize-none"
              />
            </CardContent>
          </Card>

          <div className="flex justify-between animate-in fade-in duration-700 delay-500">
            <EnhancedButton variant="outline" onClick={handlePrevious}>
              <ArrowLeft className="w-4 h-4" />
              <span>Previous</span>
            </EnhancedButton>

            <EnhancedButton
              onClick={handleNext}
              disabled={!canProceed}
              loading={isSubmitting}
              variant="primary"
              glow={canProceed}
            >
              <span>
                {currentQuestionIndex === questions.length - 1
                  ? "Get Recommendations"
                  : "Next"}
              </span>
              <ArrowRight className="w-4 h-4" />
            </EnhancedButton>
          </div>
        </div>
      </main>
    </div>
  );
};

export default QuestionnairePage;
