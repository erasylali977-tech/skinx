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
    { href: "/dashboard", label: t.nav.dashboard, icon: "analytics" },
    { href: "/account", label: t.nav.account, icon: "person" },
  ];
  return (
    <nav className="fixed bottom-0 left-0 w-full z-40 rounded-t-[1.5rem] bg-surface-container-lowest shadow-ambient-up flex justify-around items-center pb-8 pt-4 px-4">
      {items.map((item) => {
        const active =
          pathname === item.href ||
          (item.href !== "/home" && pathname.startsWith(item.href));
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center px-5 py-2 rounded-2xl active:scale-90 duration-150 transition-all",
              active
                ? "bg-surface-container-low text-primary"
                : "text-on-surface-variant hover:bg-surface-container-low",
            )}
          >
            <Icon name={item.icon} filled={active} className="mb-1" />
            <span className="text-[11px] font-medium tracking-wide uppercase">
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
