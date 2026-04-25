import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FilterOptions } from "@/features/recommendations/services/database-service";

interface RecommendationFiltersProps {
  currentFilter: string;
  onFilterChange: (filter: string) => void;
  sortBy?: string;
  onSortChange?: (sort: string) => void;
}

const RecommendationFilters = ({
  currentFilter,
  onFilterChange,
  sortBy,
  onSortChange,
}: RecommendationFiltersProps) => {
  const filterOptions = [
    { key: "all", label: "All" },
    { key: "movies", label: "Movies" },
    { key: "books", label: "Books" },
    { key: "favorites", label: "Favorites" },
    { key: "thisMonth", label: "This Month" },
  ];

  const sortOptions = [
    { value: "newest", label: "Newest First" },
    { value: "oldest", label: "Oldest First" },
    { value: "favorites_first", label: "Favorites First" },
  ];

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-8">
      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto">
        {filterOptions.map(({ key, label }) => (
          <Button
            key={key}
            variant={currentFilter === key ? "default" : "outline"}
            size="sm"
            onClick={() => onFilterChange(key)}
            className={
              currentFilter === key
                ? "bg-appAccent text-white"
                : "bg-appSecondary text-textSecondary hover:text-textPrimary border-gray-600"
            }
          >
            {label}
          </Button>
        ))}
      </div>

      {/* Sort Dropdown */}
      {onSortChange && (
        <Select value={sortBy} onValueChange={onSortChange}>
          <SelectTrigger className="w-[180px] bg-appSecondary border-gray-600 text-textPrimary">
            <SelectValue placeholder="Sort by..." />
          </SelectTrigger>
          <SelectContent className="bg-appSecondary border-gray-600">
            {sortOptions.map(({ value, label }) => (
              <SelectItem
                key={value}
                value={value}
                className="text-textPrimary hover:bg-gray-700"
              >
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
};

export default RecommendationFilters;
