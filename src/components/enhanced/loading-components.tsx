import React from "react";

// Base Shimmer Component
interface ShimmerProps {
  className?: string;
  children?: React.ReactNode;
}

export const Shimmer: React.FC<ShimmerProps> = ({
  className = "",
  children,
}) => {
  return <div className={`shimmer-container ${className}`}>{children}</div>;
};

// Shimmer Text Lines
export const ShimmerText: React.FC<{ lines?: number; className?: string }> = ({
  lines = 3,
  className = "",
}) => {
  return (
    <div className={className}>
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className={`shimmer-container shimmer-text ${
            index === lines - 1 ? "w-3/4" : "w-full"
          }`}
        />
      ))}
    </div>
  );
};

// Shimmer Title
export const ShimmerTitle: React.FC<{ className?: string }> = ({
  className = "",
}) => {
  return <div className={`shimmer-container shimmer-title ${className}`} />;
};

// Shimmer Button
export const ShimmerButton: React.FC<{ className?: string }> = ({
  className = "",
}) => {
  return <div className={`shimmer-container shimmer-button ${className}`} />;
};

// Shimmer Avatar
export const ShimmerAvatar: React.FC<{ className?: string }> = ({
  className = "",
}) => {
  return <div className={`shimmer-container shimmer-avatar ${className}`} />;
};

// Shimmer Card
export const ShimmerCard: React.FC<{ className?: string }> = ({
  className = "",
}) => {
  return <div className={`shimmer-container shimmer-card ${className}`} />;
};

// Question Loading Shimmer
export const QuestionLoadingShimmer: React.FC = () => {
  return (
    <div className="max-w-2xl mx-auto px-6 pt-[120px] pb-[100px]">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <ShimmerTitle className="w-48" />
          <Shimmer className="w-32 h-6 rounded" />
        </div>
        <Shimmer className="w-full h-2 rounded-full" />
      </div>

      <div className="mb-8 bg-appSecondary border border-gray-700 rounded-xl p-6">
        <div className="mb-6">
          <ShimmerTitle className="w-3/4 mb-4" />
          <ShimmerText lines={2} />
        </div>
        <Shimmer className="w-full h-32 rounded-lg" />
      </div>

      <div className="flex justify-between">
        <ShimmerButton className="w-24" />
        <ShimmerButton className="w-32" />
      </div>
    </div>
  );
};

// Recommendation Loading Shimmer
export const RecommendationLoadingShimmer: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-6 pt-[120px] pb-[100px]">
      <div className="text-center mb-12">
        <ShimmerTitle className="w-96 mx-auto mb-4" />
        <ShimmerText lines={1} className="w-64 mx-auto" />
      </div>

      <div className="space-y-8">
        {[1, 2].map((index) => (
          <div
            key={index}
            className="bg-appSecondary border border-gray-700 rounded-2xl p-8 flex flex-col md:flex-row gap-6"
          >
            {/* Poster/Cover Shimmer */}
            <Shimmer className="w-full md:w-48 h-72 rounded-lg flex-shrink-0" />

            {/* Content Shimmer */}
            <div className="flex-1">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <ShimmerTitle className="w-2/3 mb-2" />
                  <ShimmerText lines={2} className="w-1/2" />
                </div>
                <Shimmer className="w-10 h-10 rounded-full" />
              </div>

              {/* Rating Shimmer */}
              <div className="flex items-center gap-2 mb-4">
                <Shimmer className="w-5 h-5 rounded" />
                <Shimmer className="w-12 h-5 rounded" />
              </div>

              {/* Genres Shimmer */}
              <div className="flex flex-wrap gap-2 mb-4">
                {[1, 2, 3].map((i) => (
                  <Shimmer key={i} className="w-16 h-6 rounded-full" />
                ))}
              </div>

              {/* Explanation Shimmer */}
              <Shimmer className="w-full h-24 rounded-lg" />
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-center mt-12">
        <ShimmerButton className="w-48" />
        <ShimmerButton className="w-40" />
      </div>
    </div>
  );
};

// History Page Loading Shimmer
export const HistoryLoadingShimmer: React.FC = () => {
  return (
    <div className="px-6 pt-[120px] pb-[100px]">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <ShimmerTitle className="w-80 mb-2" />
          <ShimmerText lines={1} className="w-64" />
        </div>
        <ShimmerButton className="w-48" />
      </div>

      {/* Stats Card Shimmer */}
      <div className="mb-8 bg-appSecondary border border-gray-700 rounded-xl p-6">
        <ShimmerTitle className="w-32 mb-4" />
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="text-center">
              <Shimmer className="w-6 h-6 mx-auto mb-2 rounded" />
              <Shimmer className="w-8 h-8 mx-auto mb-1 rounded" />
              <Shimmer className="w-16 h-3 mx-auto rounded" />
            </div>
          ))}
        </div>
      </div>

      {/* Filters Shimmer */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-8">
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <ShimmerButton key={i} className="w-20 h-8" />
          ))}
        </div>
        <ShimmerButton className="w-36 h-10" />
      </div>

      {/* Cards Grid Shimmer */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="bg-appSecondary border border-gray-700 rounded-xl p-6"
          >
            <Shimmer className="w-full h-48 rounded-lg mb-4" />

            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <ShimmerTitle className="w-3/4 mb-1" />
                <div className="flex items-center gap-2 mb-2">
                  <Shimmer className="w-12 h-5 rounded-full" />
                  <Shimmer className="w-8 h-4 rounded" />
                </div>
              </div>
              <Shimmer className="w-8 h-8 rounded-full" />
            </div>

            <div className="flex flex-wrap gap-1 mb-3">
              {[1, 2].map((j) => (
                <Shimmer key={j} className="w-14 h-5 rounded" />
              ))}
            </div>

            <div className="flex items-center justify-between">
              <Shimmer className="w-20 h-3 rounded" />
              <Shimmer className="w-12 h-3 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Enhanced Spinner Component
export const EnhancedSpinner: React.FC<{
  size?: "sm" | "md" | "lg";
  className?: string;
}> = ({ size = "md", className = "" }) => {
  const sizeClasses = {
    sm: "w-6 h-6",
    md: "w-10 h-10",
    lg: "w-16 h-16",
  };

  return (
    <div className={`enhanced-spinner ${sizeClasses[size]} ${className}`} />
  );
};

// Loading Screen Component
export const LoadingScreen: React.FC<{
  message?: string;
  submessage?: string;
}> = ({ message = "Loading...", submessage }) => {
  return (
    <div className="min-h-screen bg-appPrimary flex items-center justify-center">
      <div className="text-center">
        <EnhancedSpinner size="lg" className="mx-auto mb-8" />
        <h2 className="text-2xl font-semibold text-textPrimary mb-2">
          {message}
        </h2>
        {submessage && <p className="text-textSecondary">{submessage}</p>}
      </div>
    </div>
  );
};
