import { cn, formatDate, formatDateTime, riskColor, riskLabel } from "@/lib/utils";

describe("cn", () => {
  it("joins truthy class names", () => {
    expect(cn("a", "b", "c")).toBe("a b c");
  });

  it("filters out falsy values", () => {
    expect(cn("a", false, null, undefined, "", "b")).toBe("a b");
  });

  it("returns empty string when all falsy", () => {
    expect(cn(false, null, undefined)).toBe("");
  });

  it("returns single class", () => {
    expect(cn("only")).toBe("only");
  });

  it("handles no arguments", () => {
    expect(cn()).toBe("");
  });
});

describe("formatDate", () => {
  it("formats ISO string in en locale", () => {
    const result = formatDate("2024-03-15T10:30:00Z", "en");
    expect(result).toMatch(/Mar/);
    expect(result).toMatch(/15/);
    expect(result).toMatch(/2024/);
  });

  it("formats Date object", () => {
    const d = new Date("2024-01-01T00:00:00Z");
    const result = formatDate(d, "en");
    expect(result).toMatch(/2024/);
  });

  it("formats in ru locale", () => {
    const result = formatDate("2024-06-20T00:00:00Z", "ru");
    expect(result).toMatch(/2024/);
  });

  it("formats in kk locale", () => {
    const result = formatDate("2024-06-20T00:00:00Z", "kk");
    expect(result).toMatch(/2024/);
  });

  it("defaults to en locale", () => {
    const result = formatDate("2024-03-15T10:30:00Z");
    expect(result).toMatch(/Mar/);
    expect(result).toMatch(/2024/);
  });
});

describe("formatDateTime", () => {
  it("includes time component", () => {
    const result = formatDateTime("2024-03-15T14:30:00Z", "en");
    expect(result).toMatch(/Mar/);
    expect(result).toMatch(/15/);
  });

  it("formats Date object with time", () => {
    const d = new Date("2024-06-01T09:15:00Z");
    const result = formatDateTime(d, "en");
    expect(result).toMatch(/Jun/);
  });

  it("defaults to en locale", () => {
    const result = formatDateTime("2024-03-15T14:30:00Z");
    expect(result).toMatch(/Mar/);
  });
});

describe("riskColor", () => {
  it('returns orange for "high"', () => {
    expect(riskColor("high")).toBe("bg-orange-500");
  });

  it('returns amber for "medium"', () => {
    expect(riskColor("medium")).toBe("bg-amber-400");
  });

  it('returns emerald for "low"', () => {
    expect(riskColor("low")).toBe("bg-emerald-500");
  });
});

describe("riskLabel", () => {
  it('returns "Review Needed" for high', () => {
    expect(riskLabel("high")).toBe("Review Needed");
  });

  it('returns "Monitor" for medium', () => {
    expect(riskLabel("medium")).toBe("Monitor");
  });

  it('returns "Stable" for low', () => {
    expect(riskLabel("low")).toBe("Stable");
  });
});
