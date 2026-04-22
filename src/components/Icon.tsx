import { cn } from "@/lib/utils";

type Props = {
  name: string;
  className?: string;
  filled?: boolean;
  weight?: 400 | 500 | 600 | 700;
  style?: React.CSSProperties;
};

export function Icon({ name, className, filled, weight, style }: Props) {
  const mergedStyle: React.CSSProperties = {
    ...style,
    fontVariationSettings: `"FILL" ${filled ? 1 : 0}, "wght" ${weight ?? 400}, "GRAD" 0, "opsz" 24`,
  };
  return (
    <span
      className={cn("material-symbols-outlined", className)}
      style={mergedStyle}
      aria-hidden
    >
      {name}
    </span>
  );
}
