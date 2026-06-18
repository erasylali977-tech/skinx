import { MockSkinAnalyzer } from "@/lib/ai/skinAnalyzer";
import type { AnalysisResult, AbcdeScores, RiskLevel } from "@/lib/ai/skinAnalyzer";

describe("MockSkinAnalyzer", () => {
  const analyzer = new MockSkinAnalyzer();

  it("returns a valid AnalysisResult", async () => {
    const bytes = new Uint8Array([10, 20, 30, 40, 50]);
    const result = await analyzer.analyze({ bytes });

    expect(result).toHaveProperty("riskScore");
    expect(result).toHaveProperty("riskLevel");
    expect(result).toHaveProperty("status");
    expect(result).toHaveProperty("abcde");
    expect(result).toHaveProperty("notes");
    expect(result).toHaveProperty("summary");
    expect(result).toHaveProperty("differentialDiagnosis");
  });

  it("riskScore is between 0 and 100", async () => {
    const bytes = new Uint8Array([1, 2, 3]);
    const result = await analyzer.analyze({ bytes });

    expect(result.riskScore).toBeGreaterThanOrEqual(0);
    expect(result.riskScore).toBeLessThanOrEqual(100);
  });

  it("abcde scores are all between 0 and 100", async () => {
    const bytes = new Uint8Array([100, 200, 50]);
    const result = await analyzer.analyze({ bytes });

    const { abcde } = result;
    for (const key of ["asymmetry", "border", "color", "diameter", "evolution"] as const) {
      expect(abcde[key]).toBeGreaterThanOrEqual(0);
      expect(abcde[key]).toBeLessThanOrEqual(100);
    }
  });

  it("riskLevel corresponds to riskScore thresholds", async () => {
    const bytes = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]);
    const result = await analyzer.analyze({ bytes });

    if (result.riskScore >= 60) {
      expect(result.riskLevel).toBe("high");
    } else if (result.riskScore >= 35) {
      expect(result.riskLevel).toBe("medium");
    } else {
      expect(result.riskLevel).toBe("low");
    }
  });

  it("status is 'review' when high risk, otherwise 'stable'", async () => {
    const bytes = new Uint8Array([5, 10, 15]);
    const result = await analyzer.analyze({ bytes });

    if (result.riskLevel === "high") {
      expect(result.status).toBe("review");
    } else {
      expect(result.status).toBe("stable");
    }
  });

  it("returns 3 differential diagnoses with valid probabilities", async () => {
    const bytes = new Uint8Array([42, 43, 44]);
    const result = await analyzer.analyze({ bytes });

    expect(result.differentialDiagnosis).toHaveLength(3);
    for (const dx of result.differentialDiagnosis) {
      expect(dx.name).toBeTruthy();
      expect(dx.probability).toBeGreaterThanOrEqual(1);
      expect(dx.probability).toBeLessThanOrEqual(100);
    }
  });

  it("is deterministic — same input yields same output", async () => {
    const bytes = new Uint8Array([99, 88, 77, 66]);
    const result1 = await analyzer.analyze({ bytes });
    const result2 = await analyzer.analyze({ bytes });

    expect(result1).toEqual(result2);
  });

  it("different inputs yield different outputs", async () => {
    const result1 = await analyzer.analyze({ bytes: new Uint8Array([1, 2, 3]) });
    const result2 = await analyzer.analyze({ bytes: new Uint8Array([4, 5, 6]) });

    // Extremely unlikely to be equal with different seeds
    expect(result1.riskScore === result2.riskScore && result1.abcde.asymmetry === result2.abcde.asymmetry).toBe(false);
  });

  it("handles empty bytes array", async () => {
    const bytes = new Uint8Array([]);
    const result = await analyzer.analyze({ bytes });

    expect(result.riskScore).toBeGreaterThanOrEqual(0);
    expect(result.riskScore).toBeLessThanOrEqual(100);
  });

  it("handles large bytes array", async () => {
    const bytes = new Uint8Array(10000).fill(128);
    const result = await analyzer.analyze({ bytes });

    expect(result.riskScore).toBeGreaterThanOrEqual(0);
    expect(result.riskLevel).toMatch(/^(low|medium|high)$/);
  });

  it("ignores optional parameters without error", async () => {
    const bytes = new Uint8Array([1, 2, 3]);
    const result = await analyzer.analyze({
      bytes,
      bodyArea: "face",
      mimeType: "image/jpeg",
      locale: "ru",
    });

    expect(result).toHaveProperty("riskScore");
  });

  it("notes match risk level expectations", async () => {
    // Run multiple seeds to hit different risk levels
    const results: AnalysisResult[] = [];
    for (let i = 0; i < 20; i++) {
      const bytes = new Uint8Array([i * 13, i * 7, i * 3]);
      results.push(await analyzer.analyze({ bytes }));
    }

    for (const r of results) {
      if (r.riskLevel === "high") {
        expect(r.notes).toContain("dermatologist");
        expect(r.summary).toContain("dermatologist");
      } else if (r.riskLevel === "medium") {
        expect(r.notes).toContain("4–6 weeks");
        expect(r.summary).toContain("4–6 weeks");
      } else {
        expect(r.notes).toContain("stable");
        expect(r.summary).toContain("monthly");
      }
    }
  });

  it("differential diagnoses come from the correct risk-level pool", async () => {
    const LOW_DX = ["Common Mole", "Seborrheic Keratosis", "Solar Lentigo", "Freckle", "Dermatofibroma", "Skin Tag"];
    const MEDIUM_DX = ["Dysplastic Nevus", "Solar Lentigo", "Common Mole", "Actinic Keratosis", "Seborrheic Keratosis", "Atypical Mole"];
    const HIGH_DX = ["Basal Cell Carcinoma", "Squamous Cell Carcinoma", "Dysplastic Nevus", "Malignant Melanoma", "Actinic Keratosis"];

    for (let i = 0; i < 30; i++) {
      const bytes = new Uint8Array([i * 11, i * 5, i * 17]);
      const r = await analyzer.analyze({ bytes });
      const names = r.differentialDiagnosis.map((d) => d.name);

      const pool =
        r.riskLevel === "high" ? HIGH_DX : r.riskLevel === "medium" ? MEDIUM_DX : LOW_DX;

      for (const name of names) {
        expect(pool).toContain(name);
      }
    }
  });
});
