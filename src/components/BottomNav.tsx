"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Icon } from "./Icon";
import { useI18n } from "@/lib/i18n/context";

export function BottomNav() {
  const pathname = usePathname();
  const { t } = useI18n();
  const items = [
    { href: "/home", label: t.nav.home, icon: "home" },
    { href: "/dashboard", label: t.nav.analysis, icon: "analytics" },
    { href: "/moles", label: t.nav.log, icon: "article" },
    { href: "/account", label: t.nav.profile, icon: "person" },
  ];
  return (
    <nav className="fixed bottom-0 left-0 w-full z-40 rounded-t-[1.5rem] bg-surface-container-lowest shadow-ambient-up flex items-stretch pb-8 pt-3 px-2">
      {items.map((item) => {
        const active =
          pathname === item.href ||
          (item.href !== "/home" && pathname.startsWith(item.href));
        return (
          <Link
            key={item.href}
            href={item.href}
            style={{ touchAction: "manipulation" }}
            className={cn(
              "flex-1 flex flex-col items-center justify-center gap-0.5 py-2 rounded-2xl transition-colors duration-150",
              active
                ? "bg-surface-container-low text-primary"
                : "text-on-surface-variant hover:bg-surface-container-low",
            )}
          >
            <Icon name={item.icon} filled={active} className="mb-0.5" />
            <span className="text-[11px] font-medium tracking-wide uppercase">
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
