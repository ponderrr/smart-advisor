import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Heart,
  Star,
  User,
  LogOut,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { databaseService, FilterOptions } from "@/services/database";
import { Recommendation } from "@/types/Recommendation";
import { ExpandableText } from "@/components/ExpandableText";
import UserStatsCard from "@/components/account/UserStatsCard";
import RecommendationFilters from "@/components/account/RecommendationFilters";

const AccountHistoryPage = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [filter, setFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  useEffect(() => {
    const loadRecommendations = async () => {
      try {
        setLoading(true);

        // Build filter options
        const filterOptions: FilterOptions = {
          sortBy: sortBy as "newest" | "oldest" | "favorites_first",
        };

        // Apply content type filter
        if (filter === "movies") {
          filterOptions.contentType = "movie";
        } else if (filter === "books") {
          filterOptions.contentType = "book";
        } else if (filter === "favorites") {
          filterOptions.isFavorited = true;
        } else if (filter === "thisMonth") {
          const startOfMonth = new Date();
          startOfMonth.setDate(1);
          startOfMonth.setHours(0, 0, 0, 0);
          filterOptions.startDate = startOfMonth;
        }

        const { data, error } = await databaseService.getUserRecommendations(
          filterOptions
        );

        if (error) {
          console.error("Error loading recommendations:", error);
        } else {
          setRecommendations(data);
        }
      } catch (error) {
        console.error("Error loading recommendations:", error);
      } finally {
        setLoading(false);
      }
    };

    loadRecommendations();
  }, [filter, sortBy]);

  const handleLogoClick = () => {
    navigate("/");
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const handleGetNewRecommendation = () => {
    navigate("/content-selection");
  };

  const handleToggleFavorite = async (recommendationId: string) => {
    try {
      const { error } = await databaseService.toggleFavorite(recommendationId);
      if (!error) {
        // Update local state
        setRecommendations((recs) =>
          recs.map((rec) =>
            rec.id === recommendationId
              ? { ...rec, is_favorited: !rec.is_favorited }
              : rec
          )
        );
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
    }
  };

  const handleDeleteRecommendation = async (recommendationId: string) => {
    if (
      !window.confirm("Are you sure you want to delete this recommendation?")
    ) {
      return;
    }

    try {
      const { error } = await databaseService.deleteRecommendation(
        recommendationId
      );
      if (!error) {
        // Remove from local state
        setRecommendations((recs) =>
          recs.filter((rec) => rec.id !== recommendationId)
        );
      }
    } catch (error) {
      console.error("Error deleting recommendation:", error);
    }
  };

  const toggleCardExpansion = (cardId: string) => {
    setExpandedCards((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(cardId)) {
        newSet.delete(cardId);
      } else {
        newSet.add(cardId);
      }
      return newSet;
    });
  };

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
            <div className="absolute right-0 top-full mt-2 w-48 bg-appSecondary border border-gray-700 rounded-lg shadow-lg z-50">
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-2 px-4 py-3 text-textSecondary hover:text-textPrimary hover:bg-gray-700 transition-colors duration-200"
              >
                <LogOut size={16} />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="px-6 pt-[80px] md:pt-[120px] pb-[100px]">
        {/* Title and New Recommendation Button */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-textPrimary mb-2">
              My Recommendations
            </h1>
            <p className="text-lg text-textSecondary">
              Your personalized collection of books and movies
            </p>
          </div>
          <button
            onClick={handleGetNewRecommendation}
            className="flex items-center gap-2 bg-appAccent text-white px-6 py-3 rounded-lg hover:bg-opacity-90 transition-all duration-200"
          >
            <Plus size={20} />
            Get New Recommendation
          </button>
        </div>

        {/* User Stats Card */}
        <div className="mb-8">
          <UserStatsCard />
        </div>

        {/* Filter and Sort Controls */}
        <RecommendationFilters
          currentFilter={filter}
          onFilterChange={setFilter}
          sortBy={sortBy}
          onSortChange={setSortBy}
        />

        {/* Content */}
        {loading ? (
          <div className="text-center py-20">
            <div className="text-textSecondary">
              Loading your recommendations...
            </div>
          </div>
        ) : recommendations.length === 0 ? (
          <div className="text-center py-20">
            <div className="mb-4">
              <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="w-8 h-8 text-textTertiary" />
              </div>
              <h2 className="text-xl font-semibold text-textPrimary mb-2">
                {filter === "favorites"
                  ? "No favorites yet"
                  : filter === "thisMonth"
                  ? "No recommendations this month"
                  : "No recommendations yet"}
              </h2>
              <p className="text-textSecondary mb-6">
                {filter === "favorites"
                  ? "Start favoriting recommendations to see them here"
                  : "Get your first personalized recommendation to begin building your library"}
              </p>
            </div>
            <button
              onClick={handleGetNewRecommendation}
              className="bg-appAccent text-white px-6 py-3 rounded-lg hover:bg-opacity-90 transition-all duration-200"
            >
              Get Your First Recommendation
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {recommendations.map((rec) => {
              const isExpanded = expandedCards.has(rec.id);
              return (
                <div
                  key={rec.id}
                  className="bg-appSecondary border border-gray-700 rounded-xl overflow-hidden hover:border-appAccent transition-all duration-200"
                >
                  {/* Main Card Content */}
                  <div className="p-6">
                    <div className="flex gap-4">
                      {/* Poster/Cover */}
                      <div className="w-24 h-36 bg-gray-700 rounded-lg flex-shrink-0 overflow-hidden">
                        {rec.poster_url ? (
                          <img
                            src={rec.poster_url}
                            alt={rec.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-textTertiary text-xs">
                            No Image
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-semibold text-textPrimary mb-1 truncate">
                              {rec.title}
                            </h3>
                            <div className="flex items-center gap-2 mb-2">
                              <span
                                className={`px-2 py-1 text-xs rounded-full ${
                                  rec.type === "movie"
                                    ? "bg-blue-500 text-white"
                                    : "bg-green-500 text-white"
                                }`}
                              >
                                {rec.type}
                              </span>
                              {rec.rating && (
                                <div className="flex items-center gap-1">
                                  <Star className="w-4 h-4 text-yellow-500 fill-current" />
                                  <span className="text-sm text-textSecondary">
                                    {rec.rating}
                                  </span>
                                </div>
                              )}
                            </div>
                            {rec.director && (
                              <p className="text-sm text-textSecondary truncate">
                                Directed by {rec.director}
                              </p>
                            )}
                            {rec.author && (
                              <p className="text-sm text-textSecondary truncate">
                                By {rec.author}
                              </p>
                            )}
                            {rec.year && (
                              <p className="text-sm text-textSecondary">
                                {rec.year}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => handleToggleFavorite(rec.id)}
                            className={`p-2 rounded-full transition-colors duration-200 ml-2 ${
                              rec.is_favorited
                                ? "bg-red-500 text-white"
                                : "bg-gray-700 text-textSecondary hover:text-red-500"
                            }`}
                          >
                            <Heart
                              size={16}
                              fill={rec.is_favorited ? "currentColor" : "none"}
                            />
                          </button>
                        </div>

                        {/* Genres */}
                        {rec.genres && rec.genres.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {rec.genres.slice(0, 3).map((g) => (
                              <span
                                key={g}
                                className="px-2 py-1 bg-gray-700 text-textSecondary text-xs rounded"
                              >
                                {g}
                              </span>
                            ))}
                            {rec.genres.length > 3 && (
                              <span className="px-2 py-1 bg-gray-700 text-textSecondary text-xs rounded">
                                +{rec.genres.length - 3}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Date and Actions */}
                        <div className="flex items-center justify-between">
                          <div className="text-xs text-textTertiary">
                            Added{" "}
                            {new Date(rec.created_at).toLocaleDateString()}
                          </div>
                          <div className="flex items-center gap-2">
                            {rec.description && (
                              <button
                                onClick={() => toggleCardExpansion(rec.id)}
                                className="text-xs text-appAccent hover:text-indigo-400 transition-colors duration-200 flex items-center gap-1"
                              >
                                {isExpanded ? "Hide Details" : "Show Details"}
                                {isExpanded ? (
                                  <ChevronUp size={12} />
                                ) : (
                                  <ChevronDown size={12} />
                                )}
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteRecommendation(rec.id)}
                              className="text-xs text-red-500 hover:text-red-400 transition-colors duration-200"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Expandable Description Section */}
                  {isExpanded && rec.description && (
                    <div className="border-t border-gray-700 p-6 animate-in fade-in duration-300">
                      <ExpandableText
                        text={rec.description}
                        title={
                          rec.type === "movie"
                            ? "Plot Summary"
                            : "Book Description"
                        }
                        maxLines={4}
                        className="bg-appPrimary"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default AccountHistoryPage;
