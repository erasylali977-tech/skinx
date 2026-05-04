export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function toBrowserLocale(locale: string) {
  if (locale === "ru") return "ru-RU";
  if (locale === "kk") return "kk-KZ";
  return "en-US";
}

export function formatDate(iso: string | Date, locale = "en") {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return d.toLocaleDateString(toBrowserLocale(locale), {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDateTime(iso: string | Date, locale = "en") {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return d.toLocaleString(toBrowserLocale(locale), {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function riskColor(level: "low" | "medium" | "high") {
  switch (level) {
    case "high":
      return "bg-orange-500";
    case "medium":
      return "bg-amber-400";
    default:
      return "bg-emerald-500";
  }
}

export function riskLabel(level: "low" | "medium" | "high") {
  switch (level) {
    case "high":
      return "Review Needed";
    case "medium":
      return "Monitor";
    default:
      return "Stable";
  }
}
