export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function formatDate(iso: string | Date) {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDateTime(iso: string | Date) {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return d.toLocaleString("en-US", {
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
