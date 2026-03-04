'use client';
import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { User, LogOut } from "lucide-react";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { EnhancedButton } from "@/components/enhanced";
import { useQuizStore } from '@/features/quiz/store/quiz-store';
import { BrandWordmark } from "@/components/brand-wordmark";

type ContentType = "movie" | "book" | "both";

const QuestionCountPage = () => {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { contentType, setQuestionCount: setStoreQuestionCount } = useQuizStore();
  const [questionCount, setQuestionCount] = useState(5);
  const [isLoading, setIsLoading] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Guard: redirect if no content type
  useEffect(() => {
    if (!contentType) {
      router.push("/content-selection");
    }
  }, [contentType, router]);

  const handleLogoClick = () => {
    router.push("/");
  };

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  const handleContinue = async () => {
    setIsLoading(true);
    try {
      // Store question count in Zustand and navigate
      setStoreQuestionCount(questionCount);
      router.push("/questionnaire");
    } catch (error) {
      console.error("Error proceeding to questionnaire:", error);
      setIsLoading(false);
    }
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuestionCount(parseInt(e.target.value));
  };

  const getContentTypeDisplay = () => {
    switch (contentType) {
      case "movie":
        return "movie";
      case "book":
        return "book";
      case "both":
        return "movie and book";
      default:
        return contentType;
    }
  };

  if (!contentType) {
    return null;
  }

  return (
    <div className="bg-appPrimary text-textPrimary font-inter min-h-screen">
      {/* Header */}
      <header className="h-[72px] flex items-center justify-between px-6 md:px-12 bg-appPrimary">
        <button
          onClick={handleLogoClick}
          className="inline-flex items-center cursor-pointer hover:opacity-80 transition-opacity duration-200"
        >
          <BrandWordmark imageClassName="h-8" />
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
                onClick={() => router.push("/history")}
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
      <main className="flex flex-col items-center px-6 pt-[80px] md:pt-[120px] pb-[100px]">
        {/* Progress Indicator */}
        <div className="text-textTertiary text-sm mb-8 animate-in fade-in duration-500">
          Step 2 of 4
        </div>

        {/* Page Title Section */}
        <div className="max-w-[800px] text-center mb-12 md:mb-20">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-textPrimary leading-tight mb-4 animate-in fade-in duration-700 delay-200">
            How many questions would you like to answer?
          </h1>
          <p className="text-lg text-textSecondary leading-relaxed animate-in fade-in duration-700 delay-400">
            Choose the number of questions for your {getContentTypeDisplay()}{" "}
            recommendation questionnaire
          </p>
        </div>

        {/* Question Count Selector */}
        <div className="w-full max-w-md mb-12 md:mb-16 animate-in fade-in duration-700 delay-600">
          <div className="bg-appSecondary border border-gray-700 rounded-2xl p-8">
            {/* Current Count Display */}
            <div className="text-center mb-8">
              <div className="text-6xl font-bold text-appAccent mb-2">
                {questionCount}
              </div>
              <div className="text-lg text-textSecondary">
                {questionCount === 1 ? "Question" : "Questions"}
              </div>
            </div>

            {/* Slider */}
            <div className="relative mb-6">
              <input
                type="range"
                min="3"
                max="15"
                value={questionCount}
                onChange={handleSliderChange}
                className="w-full h-3 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                style={{
                  background: `linear-gradient(to right, #6366F1 0%, #6366F1 ${((questionCount - 3) / (15 - 3)) * 100
                    }%, #374151 ${((questionCount - 3) / (15 - 3)) * 100
                    }%, #374151 100%)`,
                }}
              />
            </div>

            {/* Range Labels */}
            <div className="flex justify-between text-sm text-textTertiary">
              <span>3 min</span>
              <span>15 max</span>
            </div>

            {/* Description */}
            <div className="mt-6 text-center">
              <p className="text-sm text-textSecondary">
                {questionCount <= 5
                  ? "Quick and focused questions"
                  : questionCount <= 10
                    ? "Balanced depth and specificity"
                    : "Comprehensive and detailed questions"}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 animate-in fade-in duration-700 delay-800">
          <EnhancedButton
            onClick={() => router.push("/content-selection")}
            variant="outline"
            size="lg"
            className="min-w-32"
          >
            Back
          </EnhancedButton>
          <EnhancedButton
            onClick={handleContinue}
            disabled={isLoading}
            loading={isLoading}
            variant="primary"
            size="lg"
            glow
            className="min-w-32"
          >
            Continue
          </EnhancedButton>
        </div>
      </main>
    </div>
  );
};

export default QuestionCountPage;
