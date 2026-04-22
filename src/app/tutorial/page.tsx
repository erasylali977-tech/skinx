"use client";
import Link from "next/link";
import { useRef, useState, useEffect } from "react";
import { Icon } from "@/components/Icon";
import { cn } from "@/lib/utils";

const slides = [
  {
    title: "Find Good Light",
    body: "For the most accurate scan, stand facing a window or use bright, even indoor lighting. Avoid harsh shadows.",
    icon: "wb_sunny",
    pill: "Natural Light Recommended",
  },
  {
    title: "Stay Focused",
    body: "Hold your device steady and keep the area of interest centered in the frame. Get close enough to see detail.",
    icon: "center_focus_strong",
    pill: "Frame the Spot",
  },
  {
    title: "Track Progress",
    body: "Repeat scans every few weeks. SkinX compares your images over time and flags changes automatically.",
    icon: "timeline",
    pill: "Consistency Wins",
  },
];

export default function TutorialPage() {
  const scroller = useRef<HTMLDivElement | null>(null);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const onScroll = () => {
      const i = Math.round(el.scrollLeft / el.clientWidth);
      setIdx(i);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  const goNext = () => {
    const el = scroller.current;
    if (!el) return;
    if (idx >= slides.length - 1) return;
    el.scrollTo({ left: el.clientWidth * (idx + 1), behavior: "smooth" });
  };

  return (
    <div className="h-screen w-full flex flex-col bg-surface text-on-surface">
      <main className="flex-grow flex flex-col justify-between w-full pt-12 pb-8 px-6">
        <header className="w-full flex justify-center items-center space-x-2">
          {slides.map((_, i) => (
            <span
              key={i}
              className={cn(
                "h-1.5 w-12 rounded-full transition-colors",
                i === idx ? "bg-primary" : "bg-surface-variant",
              )}
            />
          ))}
        </header>

        <div
          ref={scroller}
          className="flex-grow flex overflow-x-auto hide-scrollbar snap-mandatory mt-8 mb-8"
        >
          {slides.map((s) => (
            <div
              key={s.title}
              className="min-w-full w-full h-full flex flex-col items-center justify-center snap-center px-4"
            >
              <div className="relative w-full max-w-sm aspect-[4/5] bg-surface-container-lowest rounded-[2rem] shadow-[0_8px_24px_rgba(26,27,31,0.04)] overflow-hidden flex flex-col items-center justify-center mb-8">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10" />
                <Icon
                  name={s.icon}
                  filled
                  className="text-primary"
                  style={{ fontSize: 120 }}
                />
                <div className="z-10 bg-surface-container-lowest/80 backdrop-blur-md p-3 px-4 rounded-full shadow-sm mt-8 flex items-center gap-2">
                  <Icon name={s.icon} filled className="text-primary text-xl" />
                  <span className="font-semibold text-primary text-sm tracking-wide uppercase">
                    {s.pill}
                  </span>
                </div>
              </div>
              <div className="text-center w-full max-w-md">
                <h2 className="font-black text-3xl tracking-tight text-on-surface mb-3">
                  {s.title}
                </h2>
                <p className="text-on-surface-variant text-base leading-relaxed max-w-sm mx-auto">
                  {s.body}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="w-full max-w-md mx-auto">
          {idx < slides.length - 1 ? (
            <button
              onClick={goNext}
              className="w-full bg-primary-gradient text-on-primary font-bold text-lg py-4 px-8 rounded-full shadow-primary-glow hover:opacity-90 active:scale-95 transition-all duration-200 flex items-center justify-center gap-2"
            >
              <span>Continue</span>
              <Icon name="arrow_forward" weight={600} />
            </button>
          ) : (
            <Link
              href="/sign-up"
              className="w-full bg-primary-gradient text-on-primary font-bold text-lg py-4 px-8 rounded-full shadow-primary-glow hover:opacity-90 active:scale-95 transition-all duration-200 flex items-center justify-center gap-2"
            >
              <span>Get Started</span>
              <Icon name="arrow_forward" weight={600} />
            </Link>
          )}
          <div className="mt-4 text-center">
            <Link
              href="/sign-in"
              className="text-on-surface-variant text-sm font-semibold hover:text-primary transition-colors"
            >
              Skip Tutorial
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
