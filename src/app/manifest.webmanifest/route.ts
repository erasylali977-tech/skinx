import { NextResponse } from "next/server";

export const dynamic = "force-static";

export function GET() {
  return NextResponse.json({
    name: "SkinX — Your Skin's Digital Guardian",
    short_name: "SkinX",
    description:
      "Monitor moles and spots using AI-driven precision and medical-grade tracking.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#faf9fe",
    theme_color: "#0058bc",
    icons: [
      {
        src: "/icons/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any maskable",
      },
    ],
  });
}
