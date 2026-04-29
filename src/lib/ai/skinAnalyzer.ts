// Pluggable SkinAnalyzer interface.
// Auto-selects GeminiSkinAnalyzer when GEMINI_API_KEY is set, else MockSkinAnalyzer.
import { GoogleGenerativeAI } from "@google/generative-ai";

export type RiskLevel = "low" | "medium" | "high";

export interface AbcdeScores {
  asymmetry: number; // 0-100
  border: number;
  color: number;
  diameter: number;
  evolution: number;
}

export interface AnalysisResult {
  riskScore: number;   // 0-100 (higher = more concerning)
  riskLevel: RiskLevel;
  status: "stable" | "review" | "new";
  abcde: AbcdeScores;
  notes: string;       // short clinical note
  summary: string;     // plain-language explanation for the patient
}

export interface SkinAnalyzer {
  analyze(input: {
    bytes: Uint8Array;
    bodyArea?: string | null;
    mimeType?: string;
  }): Promise<AnalysisResult>;
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

    const summary =
      riskLevel === "high"
        ? "Our AI detected some characteristics that may warrant attention. We recommend scheduling a consultation with a dermatologist for a professional evaluation."
        : riskLevel === "medium"
          ? "There are minor variations in this area worth keeping an eye on. Re-scan in 4–6 weeks to track any changes over time."
          : "This area looks stable with no significant changes detected. Continue your regular monthly self-checks.";

    return { riskScore, riskLevel, status, abcde, notes, summary };
  }
}

// ── Gemini Vision Analyzer ────────────────────────────────────────────────
const GEMINI_MODEL = process.env.GEMINI_MODEL ?? "gemini-2.0-flash";

const ANALYSIS_PROMPT = `You are a dermatology AI assistant helping users monitor their skin.
Analyze the skin area in the image using ABCDE criteria.
Return ONLY a valid JSON object — no markdown, no explanation, just raw JSON.

JSON structure (all numbers are integers 0-100):
{
  "riskScore": <weighted average of ABCDE, integer 0-100>,
  "riskLevel": <"low" | "medium" | "high">,
  "status": <"stable" | "review" | "new">,
  "abcde": {
    "asymmetry": <0=perfectly symmetric, 100=highly asymmetric>,
    "border": <0=smooth regular, 100=irregular/ragged>,
    "color": <0=uniform single color, 100=multiple colors>,
    "diameter": <0=tiny <2mm, 100=large >10mm>,
    "evolution": <0=stable/no changes, 100=significant changes>
  },
  "notes": "<One clinical sentence in English>",
  "summary": "<2-3 plain language sentences explaining findings and next steps for the patient>"
}

Rules:
- riskLevel: low if riskScore<35, medium if 35-59, high if >=60
- status: "review" when riskLevel is "high", otherwise "stable"
- If image doesn't clearly show skin, set all scores to 0 and explain in notes
- This is for monitoring only, not medical diagnosis
- Return ONLY the JSON object`;

function clamp(v: unknown, min = 0, max = 100): number {
  const n = typeof v === "number" ? v : 0;
  return Math.max(min, Math.min(max, Math.round(n)));
}

export class GeminiSkinAnalyzer implements SkinAnalyzer {
  private client: GoogleGenerativeAI;

  constructor(apiKey: string) {
    this.client = new GoogleGenerativeAI(apiKey);
  }

  async analyze({
    bytes,
    bodyArea,
    mimeType,
  }: {
    bytes: Uint8Array;
    bodyArea?: string | null;
    mimeType?: string;
  }): Promise<AnalysisResult> {
    const model = this.client.getGenerativeModel({
      model: GEMINI_MODEL,
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.1,
        maxOutputTokens: 512,
      },
    });

    const prompt = bodyArea
      ? `${ANALYSIS_PROMPT}\n\nBody area provided by user: ${bodyArea}`
      : ANALYSIS_PROMPT;

    const imagePart = {
      inlineData: {
        data: Buffer.from(bytes).toString("base64"),
        mimeType: mimeType ?? "image/jpeg",
      },
    };

    const result = await model.generateContent([prompt, imagePart]);
    const text = result.response.text();

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(text);
    } catch {
      throw new Error("Gemini returned invalid JSON: " + text.slice(0, 120));
    }

    const raw = parsed as {
      abcde?: Record<string, unknown>;
      riskScore?: unknown;
      riskLevel?: unknown;
      status?: unknown;
      notes?: unknown;
      summary?: unknown;
    };

    const abcde: AbcdeScores = {
      asymmetry: clamp(raw.abcde?.asymmetry),
      border:    clamp(raw.abcde?.border),
      color:     clamp(raw.abcde?.color),
      diameter:  clamp(raw.abcde?.diameter),
      evolution: clamp(raw.abcde?.evolution),
    };

    const riskScore = clamp(
      raw.riskScore ??
      Math.round((abcde.asymmetry + abcde.border + abcde.color + abcde.diameter + abcde.evolution) / 5),
    );
    const riskLevel: RiskLevel = riskScore >= 60 ? "high" : riskScore >= 35 ? "medium" : "low";
    const status =
      typeof raw.status === "string" && ["stable", "review", "new"].includes(raw.status)
        ? (raw.status as "stable" | "review" | "new")
        : riskLevel === "high" ? "review" : "stable";

    return {
      riskScore,
      riskLevel,
      status,
      abcde,
      notes:   typeof raw.notes   === "string" ? raw.notes   : "Analysis complete.",
      summary: typeof raw.summary === "string" ? raw.summary : "Analysis complete.",
    };
  }
}

// ── Auto-select analyzer based on environment ─────────────────────────────
function createAnalyzer(): SkinAnalyzer {
  const key = process.env.GEMINI_API_KEY;
  if (key) return new GeminiSkinAnalyzer(key);
  return new MockSkinAnalyzer();
}

export const skinAnalyzer: SkinAnalyzer = createAnalyzer();
