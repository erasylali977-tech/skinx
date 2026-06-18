// Pluggable SkinAnalyzer interface.
// Auto-selects GeminiSkinAnalyzer when GEMINI_API_KEY is set, else MockSkinAnalyzer.

export type RiskLevel = "low" | "medium" | "high";

export interface DifferentialItem {
  name: string;
  probability: number; // 0–100
}

export interface AbcdeScores {
  asymmetry: number; // 0-100
  border: number;
  color: number;
  diameter: number;
  evolution: number;
}

export interface LesionBbox {
  x: number; // normalized 0-1, left edge
  y: number; // normalized 0-1, top edge
  w: number; // normalized 0-1, width
  h: number; // normalized 0-1, height
}

export interface AnalysisResult {
  riskScore: number;   // 0-100 (higher = more concerning)
  riskLevel: RiskLevel;
  status: "stable" | "review" | "new";
  abcde: AbcdeScores;
  notes: string;       // short clinical note
  summary: string;     // plain-language explanation for the patient
  differentialDiagnosis: DifferentialItem[]; // top 3 diagnoses with probabilities
  lesionBbox?: LesionBbox; // normalized bounding box of main lesion
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

const MOCK_DX: Record<RiskLevel, string[][]> = {
  low: [
    ["Common Mole", "Seborrheic Keratosis", "Solar Lentigo"],
    ["Freckle", "Dermatofibroma", "Common Mole"],
    ["Skin Tag", "Freckle", "Dermatofibroma"],
  ],
  medium: [
    ["Dysplastic Nevus", "Solar Lentigo", "Common Mole"],
    ["Actinic Keratosis", "Dysplastic Nevus", "Seborrheic Keratosis"],
    ["Atypical Mole", "Actinic Keratosis", "Solar Lentigo"],
  ],
  high: [
    ["Basal Cell Carcinoma", "Squamous Cell Carcinoma", "Dysplastic Nevus"],
    ["Malignant Melanoma", "Basal Cell Carcinoma", "Dysplastic Nevus"],
    ["Squamous Cell Carcinoma", "Actinic Keratosis", "Malignant Melanoma"],
  ],
};

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

    const setIdx = Math.floor(rnd() * 3);
    const [c1, c2, c3] = MOCK_DX[riskLevel][setIdx];
    const p1 = Math.round(rnd() * 30 + 65);
    const p2 = Math.round((100 - p1) * (0.5 + rnd() * 0.35));
    const p3 = Math.max(1, 100 - p1 - p2);
    const differentialDiagnosis: DifferentialItem[] = [
      { name: c1, probability: p1 },
      { name: c2, probability: Math.max(1, p2) },
      { name: c3, probability: Math.max(1, p3) },
    ];

    return { riskScore, riskLevel, status, abcde, notes, summary, differentialDiagnosis };
  }
}

// ── Gemini Vision Analyzer ────────────────────────────────────────────────
const GEMINI_MODEL = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";

const LANG_MAP: Record<string, string> = {
  ru: "Russian",
  kk: "Kazakh",
  en: "English",
};

function buildPrompt(locale?: string, bodyArea?: string | null): string {
  const lang = LANG_MAP[locale ?? "en"] ?? "English";
  const areaHint = bodyArea ? `\nBody area being examined: ${bodyArea}` : "";
  return `⚠️ LANGUAGE REQUIREMENT: You MUST write "notes", "summary", and differential diagnosis "name" fields in ${lang} ONLY. No other language is acceptable.

You are a dermatology AI assistant helping patients monitor their skin health.
Analyze the skin lesion or area visible in the image. It may be a mole, wart (verruca), age spot, skin tag, birthmark, rash, freckle, or any other skin formation.
Apply general dermatology and dermoscopy evaluation criteria.${areaHint}
Return ONLY a valid JSON object — no markdown fences, no explanation, just raw JSON.

JSON structure (all numbers are integers 0-100 EXCEPT lesionBbox which uses decimals 0.0-1.0):
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
  "lesionBbox": {
    "x": <left edge of main lesion as fraction of image width, 0.0-1.0>,
    "y": <top edge of main lesion as fraction of image height, 0.0-1.0>,
    "w": <width of bounding box as fraction of image width, 0.0-1.0>,
    "h": <height of bounding box as fraction of image height, 0.0-1.0>
  },
  "notes": "<One concise clinical observation sentence in ${lang}>",
  "summary": "<2-3 plain language sentences in ${lang}: what was found, what it likely is, and the recommended next step>",
  "differentialDiagnosis": [
    {"name": "<most likely diagnosis in ${lang}>", "probability": <integer 1-100>},
    {"name": "<second diagnosis in ${lang}>", "probability": <integer 1-100>},
    {"name": "<third diagnosis in ${lang}>", "probability": <integer 1-100>}
  ]
}

Rules:
- riskLevel: low if riskScore<35, medium if 35-59, high if >=60
- status: "review" when high risk, otherwise "stable"
- differentialDiagnosis: top 3 most likely skin conditions ordered by probability descending; probabilities must sum to 100
- Names in differentialDiagnosis MUST be in ${lang}
- lesionBbox: x and y are the TOP-LEFT corner of the box (NOT the center). Example: lesion centered at 50%/50% with size 20%/20% → {"x":0.40,"y":0.40,"w":0.20,"h":0.20}. Draw the tightest box around the primary area of concern (mole, rash, lesion). If no clear lesion, use {"x":0.25,"y":0.25,"w":0.5,"h":0.5}
- Warts/verrucas are typically low risk — score accordingly
- If image is unclear or not skin, set all ABCDE scores to 0 and note it
- This is for monitoring only, not medical diagnosis
- ⚠️ MANDATORY: "notes", "summary", and differential diagnosis names MUST be in ${lang}. This is a strict requirement.
- Return ONLY the JSON object, no markdown, no explanation`;
}

function clamp(v: unknown, min = 0, max = 100): number {
  const n = typeof v === "number" ? v : 0;
  return Math.max(min, Math.min(max, Math.round(n)));
}

function stripCodeFences(text: string): string {
  return text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
}

function parseAnalysisJson(jsonText: string, providerLabel: string): AnalysisResult {
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    throw new Error(`${providerLabel} returned invalid JSON: ` + jsonText.slice(0, 120));
  }

  const raw = parsed as {
    abcde?: Record<string, unknown>;
    riskScore?: unknown; riskLevel?: unknown;
    status?: unknown; notes?: unknown; summary?: unknown;
    differentialDiagnosis?: unknown[];
    lesionBbox?: Record<string, unknown>;
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

  const differentialDiagnosis: DifferentialItem[] = Array.isArray(raw.differentialDiagnosis)
    ? (raw.differentialDiagnosis as Record<string, unknown>[]).slice(0, 3).map(it => ({
        name: typeof it.name === "string" ? it.name : "Unknown",
        probability: clamp(typeof it.probability === "number" ? it.probability : 0),
      })).filter(it => it.name !== "Unknown")
    : [];

  const rb = raw.lesionBbox;
  const lesionBbox: LesionBbox | undefined = rb &&
    typeof rb.x === "number" && typeof rb.y === "number" &&
    typeof rb.w === "number" && typeof rb.h === "number"
    ? { x: Math.max(0, Math.min(1, rb.x)), y: Math.max(0, Math.min(1, rb.y)),
        w: Math.max(0.05, Math.min(1, rb.w)), h: Math.max(0.05, Math.min(1, rb.h)) }
    : undefined;

  return {
    riskScore, riskLevel, status, abcde,
    notes:   typeof raw.notes   === "string" ? raw.notes   : "Analysis complete.",
    summary: typeof raw.summary === "string" ? raw.summary : "Analysis complete.",
    differentialDiagnosis,
    lesionBbox,
  };
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
    const prompt = buildPrompt(locale, bodyArea);

    const body = JSON.stringify({
      contents: [{
        parts: [
          { text: prompt },
          { inline_data: { mime_type: mimeType ?? "image/jpeg", data: Buffer.from(bytes).toString("base64") } },
        ],
      }],
      generationConfig: { temperature: 0.1, maxOutputTokens: 900 },
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

    return parseAnalysisJson(stripCodeFences(text), "Gemini");
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
    const prompt = buildPrompt(locale, bodyArea);
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

    return parseAnalysisJson(stripCodeFences(text), "Groq");
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
