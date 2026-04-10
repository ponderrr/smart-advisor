"use client";
import { useRouter } from "next/navigation";
import { Home, ArrowLeft } from "lucide-react";
import { BrandWordmark } from "@/components/brand-wordmark";

const NotFound = () => {
  const router = useRouter();

  const handleGoHome = () => {
    router.push("/");
  };

  const handleGoBack = () => {
    router.back();
  };

  return (
    <div className="bg-appPrimary text-textPrimary font-inter min-h-screen">
      {/* Header */}
      <header className="h-[72px] flex items-center justify-between px-6 md:px-12 bg-appPrimary">
        <button
          onClick={handleGoHome}
          className="inline-flex items-center cursor-pointer hover:opacity-80 transition-opacity duration-200"
        >
          <BrandWordmark imageClassName="h-11" />
        </button>
      </header>

      {/* Main Content */}
      <main className="flex flex-col items-center justify-center px-6 pt-[120px] pb-[100px]">
        <div className="max-w-[600px] text-center">
          <h1 className="text-6xl md:text-8xl font-bold text-textPrimary mb-6">
            404
          </h1>
          <h2 className="text-2xl md:text-3xl font-semibold text-textPrimary mb-4">
            Page Not Found
          </h2>
          <p className="text-lg text-textSecondary mb-12 leading-relaxed">
            Sorry, the page you're looking for doesn't exist. It might have been
            moved, deleted, or you entered the wrong URL.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleGoBack}
              className="flex items-center justify-center gap-2 bg-appSecondary text-textPrimary border border-gray-700 px-6 py-3 rounded-lg hover:bg-gray-600 transition-all duration-200"
            >
              <ArrowLeft size={20} />
              Go Back
            </button>
            <button
              onClick={handleGoHome}
              className="flex items-center justify-center gap-2 bg-appAccent text-white px-6 py-3 rounded-lg hover:bg-opacity-90 transition-all duration-200"
            >
              <Home size={20} />
              Go Home
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default NotFound;
