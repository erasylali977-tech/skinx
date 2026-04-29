// Pluggable SkinAnalyzer interface.
// Auto-selects GeminiSkinAnalyzer when GEMINI_API_KEY is set, else MockSkinAnalyzer.

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
    locale?: string;
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
  async analyze({ bytes }: { bytes: Uint8Array; bodyArea?: string | null; mimeType?: string; locale?: string }): Promise<AnalysisResult> {
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
const GEMINI_MODEL = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";

const LANG_MAP: Record<string, string> = {
  ru: "Russian",
  kk: "Kazakh",
  en: "English",
};

function buildPrompt(locale?: string): string {
  const lang = LANG_MAP[locale ?? "en"] ?? "English";
  return `You are a dermatology AI assistant helping patients monitor their skin health.
Analyze the skin lesion or area visible in the image. It may be a mole, wart (verruca), age spot, skin tag, birthmark, rash, freckle, or any other skin formation.
Apply general dermatology and dermoscopy evaluation criteria.
Return ONLY a valid JSON object — no markdown fences, no explanation, just raw JSON.

JSON structure (all numbers are integers 0-100):
{
  "riskScore": <overall concern level, integer 0-100>,
  "riskLevel": <"low" | "medium" | "high">,
  "status": <"stable" | "review" | "new">,
  "abcde": {
    "asymmetry": <0=perfectly symmetric, 100=highly asymmetric>,
    "border": <0=smooth/regular, 100=irregular/ragged>,
    "color": <0=uniform single color, 100=multiple distinct colors>,
    "diameter": <0=tiny <2mm, 100=large >10mm>,
    "evolution": <0=stable/no visible changes, 100=significant changes observed>
  },
  "notes": "<One concise clinical observation sentence>",
  "summary": "<2-3 plain language sentences: what was found, what it likely is, and the recommended next step for the patient>"
}

Rules:
- riskLevel: low if riskScore<35, medium if 35-59, high if >=60
- status: "review" when high risk, otherwise "stable"
- Warts/verrucas are typically low risk — score accordingly
- If image is unclear or not skin, set all ABCDE scores to 0 and note it
- This is for monitoring only, not medical diagnosis
- IMPORTANT: Write the "notes" and "summary" fields EXCLUSIVELY in ${lang}. Do NOT use any other language.
- Return ONLY the JSON object, no markdown, no explanation`;
}

function clamp(v: unknown, min = 0, max = 100): number {
  const n = typeof v === "number" ? v : 0;
  return Math.max(min, Math.min(max, Math.round(n)));
}

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models";

export class GeminiSkinAnalyzer implements SkinAnalyzer {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async analyze({
    bytes,
    bodyArea,
    mimeType,
    locale,
  }: {
    bytes: Uint8Array;
    bodyArea?: string | null;
    mimeType?: string;
    locale?: string;
  }): Promise<AnalysisResult> {
    const basePrompt = buildPrompt(locale);
    const prompt = bodyArea
      ? `${basePrompt}\n\nBody area: ${bodyArea}`
      : basePrompt;

    const body = JSON.stringify({
      contents: [{
        parts: [
          { text: prompt },
          { inline_data: { mime_type: mimeType ?? "image/jpeg", data: Buffer.from(bytes).toString("base64") } },
        ],
      }],
      generationConfig: { temperature: 0.1, maxOutputTokens: 600 },
    });

    // Only gemini-2.5-* is available for new API keys. Retry on 503 with backoff.
    let res: Response | null = null;
    const models = [GEMINI_MODEL, "gemini-2.5-pro"];
    for (const model of models) {
      const modelUrl = `${GEMINI_API_URL}/${model}:generateContent?key=${this.apiKey}`;
      for (let attempt = 0; attempt < 3; attempt++) {
        if (attempt > 0) await new Promise(r => setTimeout(r, 2000 * attempt));
        res = await fetch(modelUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body });
        if (res.status !== 503) break;
      }
      if (res && res.status !== 503) break;
    }

    if (!res || !res.ok) {
      const errText = await res?.text().catch(() => res?.statusText ?? "unknown") ?? "no response";
      throw new Error(`Gemini ${res?.status ?? 0}: ${errText.slice(0, 300)}`);
    }

    const data = await res.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    // Strip markdown code fences Gemini sometimes wraps around JSON
    const jsonText = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(jsonText);
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

// ── Groq Vision Analyzer (free tier, reliable uptime) ─────────────────────
const GROQ_MODEL = process.env.GROQ_MODEL ?? "meta-llama/llama-4-scout-17b-16e-instruct";

export class GroqSkinAnalyzer implements SkinAnalyzer {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async analyze({
    bytes,
    bodyArea,
    mimeType,
    locale,
  }: {
    bytes: Uint8Array;
    bodyArea?: string | null;
    mimeType?: string;
    locale?: string;
  }): Promise<AnalysisResult> {
    const basePrompt = buildPrompt(locale);
    const prompt = bodyArea ? `${basePrompt}\n\nBody area: ${bodyArea}` : basePrompt;
    const b64 = Buffer.from(bytes).toString("base64");
    const imgMime = mimeType ?? "image/jpeg";

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        temperature: 0.1,
        max_tokens: 600,
        messages: [{
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: `data:${imgMime};base64,${b64}` } },
          ],
        }],
      }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => res.statusText);
      throw new Error(`Groq ${res.status}: ${errText.slice(0, 300)}`);
    }

    const data = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
    const text = data.choices?.[0]?.message?.content ?? "";

    const jsonText = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(jsonText);
    } catch {
      throw new Error("Groq returned invalid JSON: " + text.slice(0, 120));
    }

    const raw = parsed as {
      abcde?: Record<string, unknown>;
      riskScore?: unknown; riskLevel?: unknown;
      status?: unknown; notes?: unknown; summary?: unknown;
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
      riskScore, riskLevel, status, abcde,
      notes:   typeof raw.notes   === "string" ? raw.notes   : "Analysis complete.",
      summary: typeof raw.summary === "string" ? raw.summary : "Analysis complete.",
    };
  }
}

// ── Auto-select analyzer based on environment ─────────────────────────────
function createAnalyzer(): SkinAnalyzer {
  const groqKey = process.env.GROQ_API_KEY;
  if (groqKey) {
    console.log(`[SkinX] ✅ GroqSkinAnalyzer active (model: ${GROQ_MODEL})`);
    return new GroqSkinAnalyzer(groqKey);
  }
  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey) {
    console.log(`[SkinX] ✅ GeminiSkinAnalyzer active (model: ${GEMINI_MODEL})`);
    return new GeminiSkinAnalyzer(geminiKey);
  }
  console.warn("[SkinX] ⚠️  No AI key set (GROQ_API_KEY / GEMINI_API_KEY) — using MockSkinAnalyzer");
  return new MockSkinAnalyzer();
}

export const skinAnalyzer: SkinAnalyzer = createAnalyzer();
