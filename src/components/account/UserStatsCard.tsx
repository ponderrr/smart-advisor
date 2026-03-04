
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { databaseService, UserStats } from "@/features/recommendations/services/database-service";
import { Heart, Film, Book, Calendar, TrendingUp } from "lucide-react";

const UserStatsCard = () => {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const { data, error } = await databaseService.getUserStats();
        if (!error && data) {
          setStats(data);
        }
      } catch (error) {
        console.error("Error loading user stats:", error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  if (loading) {
    return (
      <Card className="bg-appSecondary border-gray-700">
        <CardContent className="p-6">
          <div className="text-center text-textSecondary">Loading stats...</div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return null;
  }

  const statItems = [
    {
      icon: TrendingUp,
      label: "Total Recommendations",
      value: stats.totalRecommendations,
      color: "text-blue-500",
    },
    {
      icon: Heart,
      label: "Favorites",
      value: stats.favoriteCount,
      color: "text-red-500",
    },
    {
      icon: Film,
      label: "Movies",
      value: stats.movieCount,
      color: "text-purple-500",
    },
    {
      icon: Book,
      label: "Books",
      value: stats.bookCount,
      color: "text-green-500",
    },
    {
      icon: Calendar,
      label: "This Month",
      value: stats.thisMonthCount,
      color: "text-yellow-500",
    },
  ];

  return (
    <Card className="bg-appSecondary border-gray-700">
      <CardHeader>
        <CardTitle className="text-textPrimary">Your Stats</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {statItems.map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="text-center">
              <div className={`flex justify-center mb-2 ${color}`}>
                <Icon size={24} />
              </div>
              <div className="text-2xl font-bold text-textPrimary">{value}</div>
              <div className="text-xs text-textSecondary">{label}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default UserStatsCard;
