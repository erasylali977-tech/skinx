import { NextRequest, NextResponse } from "next/server";

// Roboflow models per body zone
const MODELS: Record<string, string> = {
  face:  "beauty-ai-wa8ub/acne-detection-v11/2",
  arms:  "constanta/skin-disease-get/1",
};
const DEFAULT_MODEL = "constanta/skin-disease-get/1";

const KEY     = process.env.ROBOFLOW_API_KEY ?? "";
const CONF    = 35;  // min confidence %
const OVERLAP = 30;  // max overlap %

export const runtime    = "nodejs";
export const maxDuration = 10;

export async function POST(req: NextRequest) {
  if (!KEY) {
    console.warn("[detect] ROBOFLOW_API_KEY is not set — skipping detection");
    return NextResponse.json(
      { predictions: [], error: "Detection service not configured" },
      { status: 503 },
    );
  }

  const zone  = new URL(req.url).searchParams.get("zone") ?? "";
  const MODEL = MODELS[zone] ?? DEFAULT_MODEL;

  let base64: string;
  try {
    const buf = await req.arrayBuffer();
    base64 = Buffer.from(buf).toString("base64");
  } catch (e) {
    console.error("[detect] Failed to read request body:", e);
    return NextResponse.json(
      { predictions: [], error: "Invalid request body" },
      { status: 400 },
    );
  }

  try {
    const rfRes = await fetch(
      `https://detect.roboflow.com/${MODEL}?api_key=${KEY}&confidence=${CONF}&overlap=${OVERLAP}`,
      {
        method:  "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body:    base64,
      }
    );

    if (!rfRes.ok) {
      const errText = await rfRes.text().catch(() => rfRes.statusText);
      console.error(`[detect] Roboflow API error ${rfRes.status}:`, errText.slice(0, 200));
      return NextResponse.json(
        { predictions: [], error: `Detection failed (${rfRes.status})` },
        { status: rfRes.status },
      );
    }

    const data = await rfRes.json();
    return NextResponse.json(data);
  } catch (e) {
    console.error("[detect] Roboflow request failed:", e);
    return NextResponse.json(
      { predictions: [], error: "Detection service unavailable" },
      { status: 500 },
    );
  }
}
