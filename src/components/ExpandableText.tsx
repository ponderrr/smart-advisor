import React, { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface ExpandableTextProps {
  text: string;
  maxLines?: number;
  className?: string;
  title?: string;
}

export const ExpandableText: React.FC<ExpandableTextProps> = ({
  text,
  maxLines = 3,
  className = "",
  title = "Description:",
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isTruncated, setIsTruncated] = useState(false);
  const textRef = useRef<HTMLParagraphElement>(null);

  // Clean up the text to remove unwanted formatting
  const cleanText = React.useMemo(() => {
    if (!text) return "";

    // Remove common unwanted prefixes and HTML tags
    return text
      .replace(/<[^>]*>/g, "") // Remove HTML tags
      .replace(
        /^(SUMMARY:\s*|ABOUT ORIGINAL BOOK:\s*|Plot Summary:\s*|Book Description:\s*)/i,
        ""
      ) // Remove prefixes
      .replace(/^\s+|\s+$/g, "") // Trim whitespace
      .replace(/\s+/g, " "); // Normalize spaces
  }, [text]);

  useEffect(() => {
    if (!textRef.current) return;

    const element = textRef.current;

    // Temporarily expand to measure full height
    const wasExpanded = isExpanded;
    if (!wasExpanded) {
      element.style.webkitLineClamp = "unset";
      element.style.display = "block";
    }

    const { scrollHeight, offsetHeight } = element;

    // Restore truncated state if it was truncated
    if (!wasExpanded) {
      element.style.webkitLineClamp = maxLines.toString();
      element.style.display = "-webkit-box";
    }

    setIsTruncated(scrollHeight > offsetHeight);
  }, [cleanText, maxLines, isExpanded]);

  if (!cleanText) {
    return null;
  }

  return (
    <div
      className={cn(
        "bg-appPrimary border border-gray-600 rounded-lg p-4",
        className
      )}
    >
      <h3 className="text-textPrimary font-semibold mb-2">{title}</h3>
      <p
        ref={textRef}
        className={cn(
          "text-textSecondary leading-relaxed",
          !isExpanded && "overflow-hidden",
          !isExpanded && "line-clamp-3"
        )}
        style={{
          display: !isExpanded ? "-webkit-box" : "block",
          WebkitBoxOrient: "vertical",
          WebkitLineClamp: !isExpanded ? maxLines : "unset",
        }}
      >
        {cleanText}
      </p>

      {isTruncated && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-2 text-appAccent hover:text-indigo-400 text-sm font-medium transition-colors duration-200 enhanced-button"
        >
          {isExpanded ? "Read Less" : "Read More"}
        </button>
      )}
    </div>
  );
};
