import type { Locale } from "@/lib/i18n/translations";

export type BodyGender = "male" | "female";

export type ImageZoneId =
  | "face"
  | "neck"
  | "chest"
  | "abdomen"
  | "back"
  | "arms"
  | "legs"
  | "feet";

export interface ZoneDetail {
  id: ImageZoneId;
  name: Record<Locale, string>;
  description: Record<Locale, string>;
}

export const ZONE_DETAILS: ZoneDetail[] = [
  {
    id: "face",
    name: { en: "Face", ru: "Лицо", kk: "Бет" },
    description: {
      en: "Analysis of acne, pigmentation, and facial skin texture.",
      ru: "Анализ акне, пигментации и текстуры кожи лица.",
      kk: "Бет терісінің акнесін, пигментациясын және құрылымын талдау.",
    },
  },
  {
    id: "neck",
    name: { en: "Neck", ru: "Шея", kk: "Мойын" },
    description: {
      en: "Checking the condition of the neck and decollete area.",
      ru: "Проверка состояния кожи шеи и зоны декольте.",
      kk: "Мойын мен декольте аймағының терісін тексеру.",
    },
  },
  {
    id: "chest",
    name: { en: "Chest", ru: "Грудь", kk: "Кеуде" },
    description: {
      en: "Diagnostics of the chest and upper torso skin.",
      ru: "Диагностика кожи груди и верхней части торса.",
      kk: "Кеуде және торстың жоғарғы бөлігінің терісін диагностикалау.",
    },
  },
  {
    id: "abdomen",
    name: { en: "Abdomen", ru: "Живот", kk: "Іш" },
    description: {
      en: "Abdominal skin analysis and mole monitoring.",
      ru: "Анализ кожи живота и мониторинг родинок.",
      kk: "Іш терісін талдау және меңдерді бақылау.",
    },
  },
  {
    id: "back",
    name: { en: "Back", ru: "Спина", kk: "Арқа" },
    description: {
      en: "Examination of hard-to-reach areas of the back and shoulders.",
      ru: "Осмотр труднодоступных зон спины и плеч.",
      kk: "Арқа мен иықтың қол жетімділігі қиын жерлерін тексеру.",
    },
  },
  {
    id: "arms",
    name: { en: "Arms", ru: "Руки", kk: "Қолдар" },
    description: {
      en: "Diagnostics of eczema and dermatitis on hands and forearms.",
      ru: "Диагностика экземы и дерматита на кистях и предплечьях.",
      kk: "Қол басы мен білектегі экзема мен дерматитті диагностикалау.",
    },
  },
  {
    id: "legs",
    name: { en: "Legs", ru: "Ноги", kk: "Аяқтар" },
    description: {
      en: "Leg skin analysis, vascular and microrelief check.",
      ru: "Анализ кожи ног, проверка сосудов и микрорельефа.",
      kk: "Аяқ терісін талдау, тамырлар мен микрорельефті тексеру.",
    },
  },
  {
    id: "feet",
    name: { en: "Feet", ru: "Ступни", kk: "Табандар" },
    description: {
      en: "Diagnostics of feet and nail plates for fungal infections.",
      ru: "Диагностика стоп и ногтевых пластин на грибковые поражения.",
      kk: "Табан мен тырнақ пластиналарын саңырауқұлақ инфекцияларына диагностикалау.",
    },
  },
];

export const ZONE_DETAIL_MAP = Object.fromEntries(
  ZONE_DETAILS.map((z) => [z.id, z])
) as Record<ImageZoneId, ZoneDetail>;

/** Returns the localized zone name for any stored body_area slug. */
export function getZoneDisplayLabel(zone: string | null | undefined, locale: Locale): string {
  if (!zone) return "";
  const detail = ZONE_DETAIL_MAP[zone as ImageZoneId];
  if (detail) return detail.name[locale];
  return zone;
}
