"use client";
import { cn } from "@/lib/utils";
import { Icon } from "./Icon";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  icon?: string;
  loading?: boolean;
};

export function PrimaryButton({
  className,
  children,
  icon,
  loading,
  disabled,
  ...rest
}: Props) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={cn(
        "w-full py-4 px-8 rounded-full bg-primary-gradient text-on-primary",
        "text-lg font-bold tracking-wide shadow-primary-glow",
        "hover:opacity-90 active:scale-[0.98] transition-all duration-200",
        "flex items-center justify-center gap-2 disabled:opacity-60",
        className,
      )}
    >
      {loading ? (
        <span className="inline-block w-5 h-5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
      ) : (
        <>
          <span>{children}</span>
          {icon ? <Icon name={icon} weight={600} /> : null}
        </>
      )}
    </button>
  );
}
