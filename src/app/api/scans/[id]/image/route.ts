import { NextResponse, type NextRequest } from "next/server";
import { MOCK, mockGetImage, mockGetScan } from "@/lib/mock";
import { getCurrentUser } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  if (!MOCK) return NextResponse.json({ error: "Not mock" }, { status: 404 });
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const scan = mockGetScan(params.id);
  if (!scan || scan.user_id !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const img = mockGetImage(params.id);
  if (!img) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const buf = new Uint8Array(img.bytes).buffer;
  return new NextResponse(buf, {
    status: 200,
    headers: {
      "Content-Type": img.contentType,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
