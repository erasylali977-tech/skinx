import Link from "next/link";
import { Icon } from "./Icon";

export function AppHeader({ back }: { back?: string }) {
  return (
    <header className="fixed top-0 left-0 w-full z-40 bg-surface/80 backdrop-blur-xl">
      <div className="flex justify-between items-center w-full px-6 py-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          {back ? (
            <Link
              href={back}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container-low"
            >
              <Icon name="arrow_back" className="text-on-surface-variant" />
            </Link>
          ) : (
            <>
              <Icon name="spa" filled className="text-primary text-2xl" />
              <Link
                href="/home"
                className="text-2xl font-bold tracking-tighter text-on-surface"
              >
                SkinX
              </Link>
            </>
          )}
        </div>
        <button className="px-3 py-1.5 rounded-full bg-surface-container-lowest text-primary font-medium text-sm shadow-sm active:scale-95 transition-transform">
          EN
        </button>
      </div>
    </header>
  );
}
