import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
  AnimationUtils,
  useStaggeredAnimation,
} from "@/components/enhanced/animations";

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Set up staggered animation for features section
  const { getItemProps } = useStaggeredAnimation(3, 700, 200);

  const handleGetStarted = () => {
    if (user) {
      navigate("/history");
    } else {
      navigate("/auth");
    }
  };

  const handleSignIn = () => {
    if (user) {
      navigate("/history");
    } else {
      navigate("/auth");
    }
  };

  return (
    <div className="bg-appPrimary font-inter text-textPrimary min-h-screen">
      {/* Header */}
      <header className="h-[72px] bg-appPrimary flex items-center px-6 md:px-12">
        <div className="container mx-auto flex justify-between items-center">
          <div className="text-textPrimary text-xl font-medium">
            Smart Advisor
          </div>
          <button
            onClick={handleSignIn}
            className="text-textSecondary text-sm font-normal cursor-pointer hover:text-textPrimary transition-colors duration-200 enhanced-button"
          >
            {user ? "Dashboard" : "Sign In"}
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-appPrimary pt-[120px] md:pt-[200px] pb-[100px] md:pb-[160px] px-6 md:px-[60px]">
        <div className="max-w-[800px] mx-auto text-center">
          <h1
            {...AnimationUtils.fadeIn(0)}
            className="text-[48px] md:text-[72px] font-bold leading-[0.95] tracking-[-0.02em] mb-8"
          >
            Discover your next favorite book or movie
          </h1>
          <p
            {...AnimationUtils.fadeIn(300)}
            className="text-lg md:text-2xl font-normal text-textSecondary leading-[1.4] mb-12 md:mb-20"
          >
            AI-powered recommendations tailored to your taste
          </p>
          <button
            onClick={handleGetStarted}
            {...AnimationUtils.fadeIn(500)}
            className="cta-glow bg-appAccent text-white text-lg font-medium py-4 px-8 rounded-lg transition-all duration-200"
          >
            {user ? "View My History" : "Get Started"}
          </button>
        </div>
      </section>

      {/* Features Section */}
      <section className="mt-[120px] md:mt-[200px] px-6 md:px-[60px]">
        <div className="max-w-[1200px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-16 md:gap-[120px]">
            {/* Feature 1 */}
            <div {...getItemProps(0)} className="feature">
              <div className="text-sm font-normal text-textTertiary mb-3">
                01
              </div>
              <h3 className="text-xl font-semibold text-textPrimary mb-4">
                Smart Questionnaire
              </h3>
              <p className="text-base font-normal text-textSecondary leading-[1.5]">
                AI generates 5 personalized questions based on your preferences
                and age
              </p>
            </div>

            {/* Feature 2 */}
            <div {...getItemProps(1)} className="feature">
              <div className="text-sm font-normal text-textTertiary mb-3">
                02
              </div>
              <h3 className="text-xl font-semibold text-textPrimary mb-4">
                Tailored Recommendations
              </h3>
              <p className="text-base font-normal text-textSecondary leading-[1.5]">
                Get precise book and movie suggestions powered by advanced AI
                algorithms
              </p>
            </div>

            {/* Feature 3 */}
            <div {...getItemProps(2)} className="feature">
              <div className="text-sm font-normal text-textTertiary mb-3">
                03
              </div>
              <h3 className="text-xl font-semibold text-textPrimary mb-4">
                Personal Library
              </h3>
              <p className="text-base font-normal text-textSecondary leading-[1.5]">
                Track all your recommendations and mark your favorites for
                future reference
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        {...AnimationUtils.fadeIn(1300)}
        className="mt-[200px] md:mt-[300px] pb-[80px] text-center"
      >
        <p className="text-sm font-normal text-textTertiary">
          Smart Advisor © 2025
        </p>
      </footer>
    </div>
  );
};

export default Index;
