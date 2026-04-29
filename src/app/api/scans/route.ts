import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { skinAnalyzer } from "@/lib/ai/skinAnalyzer";
import { MOCK, mockInsertScan, mockListScans } from "@/lib/mock";
import { getCurrentUser } from "@/lib/auth";
import type { Scan } from "@/lib/types";

export const runtime = "nodejs";

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
  "image/heif": "heif",
};

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const form = await request.formData();
  const file = form.get("image");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "image required" }, { status: 400 });
  }
  const bodyArea = (form.get("body_area") as string | null) || null;

  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);

  if (bytes.length > MAX_BYTES) {
    return NextResponse.json(
      { error: "Image too large. Maximum size is 10 MB." },
      { status: 413 },
    );
  }

  const mimeType = file.type?.toLowerCase();
  if (!ALLOWED_MIME[mimeType]) {
    return NextResponse.json(
      { error: "Unsupported file type. Please upload a JPEG, PNG, WebP or HEIC image." },
      { status: 415 },
    );
  }

  const analysis = await skinAnalyzer.analyze({ bytes, bodyArea, mimeType });
  const scanId = crypto.randomUUID();

  if (MOCK) {
    const scan: Scan = {
      id: scanId,
      user_id: user.id,
      image_path: `mock:${scanId}`,
      body_area: bodyArea,
      notes: analysis.notes,
      summary: analysis.summary,
      risk_score: analysis.riskScore,
      risk_level: analysis.riskLevel,
      status: analysis.status,
      abcde: analysis.abcde,
      created_at: new Date().toISOString(),
    };
    mockInsertScan(scan, {
      bytes,
      contentType: file.type || "image/jpeg",
    });
    return NextResponse.json({ id: scanId, ...analysis });
  }

  try {
    const supabase = createClient();
    const ext = ALLOWED_MIME[mimeType] ?? "jpg";
    const path = `${user.id}/${scanId}.${ext}`;
    const upload = await supabase.storage
      .from("scans")
      .upload(path, bytes, {
        contentType: file.type || "image/jpeg",
        upsert: false,
      });
    if (upload.error) {
      return NextResponse.json(
        { error: `Storage: ${upload.error.message}` },
        { status: 500 },
      );
    }

    const { data: inserted, error } = await supabase
      .from("scans")
      .insert({
        id: scanId,
        user_id: user.id,
        image_path: path,
        body_area: bodyArea,
        notes: analysis.notes,
        summary: analysis.summary,
        risk_score: analysis.riskScore,
        risk_level: analysis.riskLevel,
        status: analysis.status,
        abcde: analysis.abcde,
      })
      .select("id")
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ id: inserted.id, ...analysis });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Server error" }, { status: 500 });
  }
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (MOCK) return NextResponse.json({ scans: mockListScans(user.id) });
  try {
    const supabase = createClient();
    const { data } = await supabase
      .from("scans")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    return NextResponse.json({ scans: data ?? [] });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Server error" }, { status: 500 });
  }
}
