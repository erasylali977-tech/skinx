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
    return NextResponse.json({ predictions: [] });
  }

  const zone  = new URL(req.url).searchParams.get("zone") ?? "";
  const MODEL = MODELS[zone] ?? DEFAULT_MODEL;

  let base64: string;
  try {
    const buf = await req.arrayBuffer();
    base64 = Buffer.from(buf).toString("base64");
  } catch {
    return NextResponse.json({ predictions: [] }, { status: 400 });
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
      return NextResponse.json({ predictions: [] }, { status: rfRes.status });
    }

    const data = await rfRes.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ predictions: [] }, { status: 500 });
  }
}
