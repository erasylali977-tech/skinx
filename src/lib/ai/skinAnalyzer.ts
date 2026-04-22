// Pluggable SkinAnalyzer interface.
// Swap MockSkinAnalyzer with a real vision model later without touching callers.

export type RiskLevel = "low" | "medium" | "high";

export interface AbcdeScores {
  asymmetry: number; // 0-100
  border: number;
  color: number;
  diameter: number;
  evolution: number;
}

export interface AnalysisResult {
  riskScore: number; // 0-100 (higher = more concerning)
  riskLevel: RiskLevel;
  status: "stable" | "review" | "new";
  abcde: AbcdeScores;
  notes: string;
}

export interface SkinAnalyzer {
  analyze(input: { bytes: Uint8Array; bodyArea?: string | null }): Promise<AnalysisResult>;
}

// Deterministic hash-based mock so the same image yields consistent results.
function hashBytes(bytes: Uint8Array): number {
  let h = 2166136261;
  const step = Math.max(1, Math.floor(bytes.length / 4096));
  for (let i = 0; i < bytes.length; i += step) {
    h ^= bytes[i];
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function seeded(seed: number) {
  let s = seed || 1;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

export class MockSkinAnalyzer implements SkinAnalyzer {
  async analyze({ bytes }: { bytes: Uint8Array }): Promise<AnalysisResult> {
    const seed = hashBytes(bytes);
    const rnd = seeded(seed);

    const abcde: AbcdeScores = {
      asymmetry: Math.round(rnd() * 40 + 5),
      border: Math.round(rnd() * 40 + 5),
      color: Math.round(rnd() * 50 + 5),
      diameter: Math.round(rnd() * 60 + 10),
      evolution: Math.round(rnd() * 30 + 5),
    };

    const riskScore = Math.round(
      (abcde.asymmetry + abcde.border + abcde.color + abcde.diameter + abcde.evolution) / 5,
    );

    const riskLevel: RiskLevel =
      riskScore >= 60 ? "high" : riskScore >= 35 ? "medium" : "low";
    const status = riskLevel === "high" ? "review" : "stable";

    const notes =
      riskLevel === "high"
        ? "Elevated indicators detected. Consider consulting a dermatologist."
        : riskLevel === "medium"
          ? "Some asymmetry or color variation observed. Re-scan in 4–6 weeks."
          : "No significant changes detected. Appearance appears stable.";

    return { riskScore, riskLevel, status, abcde, notes };
  }
}

export const skinAnalyzer: SkinAnalyzer = new MockSkinAnalyzer();
