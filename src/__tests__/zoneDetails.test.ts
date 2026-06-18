import { ZONE_DETAILS, ZONE_DETAIL_MAP, getZoneDisplayLabel } from "@/lib/zoneDetails";
import type { ImageZoneId } from "@/lib/zoneDetails";

describe("ZONE_DETAILS", () => {
  it("contains at least 10 zones", () => {
    expect(ZONE_DETAILS.length).toBeGreaterThanOrEqual(10);
  });

  it("every zone has id, name in all locales, and description in all locales", () => {
    for (const zone of ZONE_DETAILS) {
      expect(zone.id).toBeTruthy();
      expect(zone.name.en).toBeTruthy();
      expect(zone.name.ru).toBeTruthy();
      expect(zone.name.kk).toBeTruthy();
      expect(zone.description.en).toBeTruthy();
      expect(zone.description.ru).toBeTruthy();
      expect(zone.description.kk).toBeTruthy();
    }
  });

  it("has no duplicate zone ids", () => {
    const ids = ZONE_DETAILS.map((z) => z.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });
});

describe("ZONE_DETAIL_MAP", () => {
  it("maps every zone id to its detail", () => {
    for (const zone of ZONE_DETAILS) {
      expect(ZONE_DETAIL_MAP[zone.id]).toBe(zone);
    }
  });

  it("lookups known zones correctly", () => {
    expect(ZONE_DETAIL_MAP["face"].name.en).toBe("Face");
    expect(ZONE_DETAIL_MAP["back"].name.en).toBe("Back");
    expect(ZONE_DETAIL_MAP["chest"].name.en).toBe("Chest");
  });
});

describe("getZoneDisplayLabel", () => {
  it("returns English name for known zone", () => {
    expect(getZoneDisplayLabel("face", "en")).toBe("Face");
    expect(getZoneDisplayLabel("neck", "en")).toBe("Neck");
  });

  it("returns Russian name for known zone", () => {
    expect(getZoneDisplayLabel("face", "ru")).toBe("Лицо");
    expect(getZoneDisplayLabel("chest", "ru")).toBe("Грудь");
  });

  it("returns Kazakh name for known zone", () => {
    expect(getZoneDisplayLabel("face", "kk")).toBe("Бет");
    expect(getZoneDisplayLabel("abdomen", "kk")).toBe("Іш");
  });

  it("returns the slug itself for unknown zone", () => {
    expect(getZoneDisplayLabel("unknown-zone", "en")).toBe("unknown-zone");
  });

  it("returns empty string for null", () => {
    expect(getZoneDisplayLabel(null, "en")).toBe("");
  });

  it("returns empty string for undefined", () => {
    expect(getZoneDisplayLabel(undefined, "en")).toBe("");
  });

  it("returns empty string for empty string", () => {
    expect(getZoneDisplayLabel("", "en")).toBe("");
  });
});
