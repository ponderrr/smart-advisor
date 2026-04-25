import { describe, it, expect } from "vitest";
import { deriveMatchScore } from "./match-score";

describe("deriveMatchScore", () => {
  it("clamps an AI-supplied score to 0-100", () => {
    expect(deriveMatchScore({ id: "x", match_score: 150 }).score).toBe(100);
    expect(deriveMatchScore({ id: "x", match_score: -10 }).score).toBe(0);
    expect(deriveMatchScore({ id: "x", match_score: 87.4 }).score).toBe(87);
  });

  it("falls back to a stable hash when no score is provided", () => {
    const a = deriveMatchScore({ id: "stable-id" });
    const b = deriveMatchScore({ id: "stable-id" });
    expect(a.score).toBe(b.score);
    expect(a.score).toBeGreaterThanOrEqual(78);
    expect(a.score).toBeLessThanOrEqual(97);
  });

  it("maps scores to tones at documented thresholds", () => {
    expect(deriveMatchScore({ id: "x", match_score: 92 }).tone).toBe("green");
    expect(deriveMatchScore({ id: "x", match_score: 90 }).tone).toBe("green");
    expect(deriveMatchScore({ id: "x", match_score: 80 }).tone).toBe("yellow");
    expect(deriveMatchScore({ id: "x", match_score: 75 }).tone).toBe("yellow");
    expect(deriveMatchScore({ id: "x", match_score: 50 }).tone).toBe("red");
  });

  it("ignores NaN/Infinity and falls back to hashed score", () => {
    const nanResult = deriveMatchScore({ id: "y", match_score: NaN });
    const infResult = deriveMatchScore({ id: "y", match_score: Infinity });
    expect(nanResult.score).toBeGreaterThanOrEqual(78);
    expect(infResult.score).toBeGreaterThanOrEqual(78);
  });
});
