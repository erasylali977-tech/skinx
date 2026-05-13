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
  | "feet"
  // Specific zones from BodyMapSVG
  | "head"
  | "uarm_l"
  | "uarm_r"
  | "farm_l"
  | "farm_r"
  | "hand_l"
  | "hand_r"
  | "pelvis"
  | "thigh_l"
  | "thigh_r"
  | "knee_l"
  | "knee_r"
  | "shin_l"
  | "shin_r"
  | "foot_l"
  | "foot_r";

export interface ZoneDetail {
  id: ImageZoneId;
  name: Record<Locale, string>;
  description: Record<Locale, string>;
}

export const ZONE_DETAILS: ZoneDetail[] = [
  // Head & Neck
  {
    id: "head",
    name: { en: "Head / Face", ru: "Голова / Лицо", kk: "Бас / Бет" },
    description: {
      en: "Analysis of acne, pigmentation, and facial skin texture.",
      ru: "Анализ акне, пигментации и текстуры кожи лица.",
      kk: "Бет терісінің акнесін, пигментациясын және құрылымын талдау.",
    },
  },
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
  // Torso
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
    id: "pelvis",
    name: { en: "Pelvis / Hips", ru: "Таз / Бёдра", kk: "Жамбас" },
    description: {
      en: "Pelvic area and hips skin analysis.",
      ru: "Анализ кожи таза и бёдер.",
      kk: "Жамбас аймағының терісін талдау.",
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
  // Arms
  {
    id: "uarm_l",
    name: { en: "Left shoulder", ru: "Левое плечо", kk: "Сол иық" },
    description: {
      en: "Left shoulder and upper arm skin diagnostics.",
      ru: "Диагностика кожи левого плеча и верхней части руки.",
      kk: "Сол иық пен қолдың жоғарғы бөлігінің терісін диагностикалау.",
    },
  },
  {
    id: "uarm_r",
    name: { en: "Right shoulder", ru: "Правое плечо", kk: "Оң иық" },
    description: {
      en: "Right shoulder and upper arm skin diagnostics.",
      ru: "Диагностика кожи правого плеча и верхней части руки.",
      kk: "Оң иық пен қолдың жоғарғы бөлігінің терісін диагностикалау.",
    },
  },
  {
    id: "farm_l",
    name: { en: "Left forearm", ru: "Левое предплечье", kk: "Сол білек" },
    description: {
      en: "Left forearm skin analysis.",
      ru: "Анализ кожи левого предплечья.",
      kk: "Сол білектің терісін талдау.",
    },
  },
  {
    id: "farm_r",
    name: { en: "Right forearm", ru: "Правое предплечье", kk: "Оң білек" },
    description: {
      en: "Right forearm skin analysis.",
      ru: "Анализ кожи правого предплечья.",
      kk: "Оң білектің терісін талдау.",
    },
  },
  {
    id: "hand_l",
    name: { en: "Left hand", ru: "Левая кисть", kk: "Сол қол" },
    description: {
      en: "Left hand skin diagnostics.",
      ru: "Диагностика кожи левой кисти.",
      kk: "Сол қол терісін диагностикалау.",
    },
  },
  {
    id: "hand_r",
    name: { en: "Right hand", ru: "Правая кисть", kk: "Оң қол" },
    description: {
      en: "Right hand skin diagnostics.",
      ru: "Диагностика кожи правой кисти.",
      kk: "Оң қол терісін диагностикалау.",
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
  // Legs
  {
    id: "thigh_l",
    name: { en: "Left thigh", ru: "Левое бедро", kk: "Сол сан" },
    description: {
      en: "Left thigh skin analysis.",
      ru: "Анализ кожи левого бедра.",
      kk: "Сол сан терісін талдау.",
    },
  },
  {
    id: "thigh_r",
    name: { en: "Right thigh", ru: "Правое бедро", kk: "Оң сан" },
    description: {
      en: "Right thigh skin analysis.",
      ru: "Анализ кожи правого бедра.",
      kk: "Оң сан терісін талдау.",
    },
  },
  {
    id: "knee_l",
    name: { en: "Left knee", ru: "Левое колено", kk: "Сол тізе" },
    description: {
      en: "Left knee skin diagnostics.",
      ru: "Диагностика кожи левого колена.",
      kk: "Сол тізе терісін диагностикалау.",
    },
  },
  {
    id: "knee_r",
    name: { en: "Right knee", ru: "Правое колено", kk: "Оң тізе" },
    description: {
      en: "Right knee skin diagnostics.",
      ru: "Диагностика кожи правого колена.",
      kk: "Оң тізе терісін диагностикалау.",
    },
  },
  {
    id: "shin_l",
    name: { en: "Left shin", ru: "Левая голень", kk: "Сол балтыр" },
    description: {
      en: "Left shin skin analysis.",
      ru: "Анализ кожи левой голени.",
      kk: "Сол балтыр терісін талдау.",
    },
  },
  {
    id: "shin_r",
    name: { en: "Right shin", ru: "Правая голень", kk: "Оң балтыр" },
    description: {
      en: "Right shin skin analysis.",
      ru: "Анализ кожи правой голени.",
      kk: "Оң балтыр терісін талдау.",
    },
  },
  {
    id: "foot_l",
    name: { en: "Left foot", ru: "Левая стопа", kk: "Сол табан" },
    description: {
      en: "Left foot skin diagnostics.",
      ru: "Диагностика кожи левой стопы.",
      kk: "Сол табан терісін диагностикалау.",
    },
  },
  {
    id: "foot_r",
    name: { en: "Right foot", ru: "Правая стопа", kk: "Оң табан" },
    description: {
      en: "Right foot skin diagnostics.",
      ru: "Диагностика кожи правой стопы.",
      kk: "Оң табан терісін диагностикалау.",
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
