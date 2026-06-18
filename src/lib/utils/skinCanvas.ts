// Shared canvas-based skin analysis helpers.
// Used by ScanClient (loading overlay) and MoleContent (hero carousel).

export function isSkin(r: number, g: number, b: number): boolean {
  const cb = -0.169 * r - 0.331 * g + 0.500 * b + 128;
  const cr =  0.500 * r - 0.419 * g - 0.081 * b + 128;
  return cb >= 77 && cb <= 127 && cr >= 133 && cr <= 173;
}

export function skinMean(px: Uint8ClampedArray, W: number, H: number): [number, number, number] {
  let rS = 0, gS = 0, bS = 0, ns = 0;
  for (let i = 0; i < W * H; i++) {
    const r = px[i*4], g = px[i*4+1], b = px[i*4+2];
    if (isSkin(r, g, b)) { rS += r; gS += g; bS += b; ns++; }
  }
  if (ns > W * H * 0.05) return [rS / ns, gS / ns, bS / ns];
  const sr = Math.floor(Math.min(W, H) * 0.15);
  const cx = Math.floor(W / 2), cy = Math.floor(H / 2);
  let rF = 0, gF = 0, bF = 0, n = 0;
  for (let y = cy - sr; y <= cy + sr; y++)
    for (let x = cx - sr; x <= cx + sr; x++) {
      if (x < 0 || x >= W || y < 0 || y >= H) continue;
      const i = (y * W + x) * 4;
      rF += px[i]; gF += px[i+1]; bF += px[i+2]; n++;
    }
  return n > 0 ? [rF / n, gF / n, bF / n] : [128, 100, 90];
}

export function skinThermalColor(t: number): [number, number, number] {
  const v = Math.max(0, Math.min(1, t));
  if (v < 0.5) return [Math.round(v * 2 * 255), 255, 0];
  const s = (v - 0.5) * 2;
  return [255, Math.round((1 - s) * 255), 0];
}

export function boxBlur(src: Float32Array, W: number, H: number, r: number): Float32Array {
  const tmp = new Float32Array(W * H);
  const out = new Float32Array(W * H);
  for (let y = 0; y < H; y++) {
    let sum = 0;
    for (let x = 0; x < Math.min(r, W); x++) sum += src[y * W + x];
    for (let x = 0; x < W; x++) {
      if (x + r < W) sum += src[y * W + x + r];
      if (x - r - 1 >= 0) sum -= src[y * W + x - r - 1];
      tmp[y * W + x] = sum / (Math.min(x + r + 1, W) - Math.max(0, x - r));
    }
  }
  for (let x = 0; x < W; x++) {
    let sum = 0;
    for (let y = 0; y < Math.min(r, H); y++) sum += tmp[y * W + x];
    for (let y = 0; y < H; y++) {
      if (y + r < H) sum += tmp[(y + r) * W + x];
      if (y - r - 1 >= 0) sum -= tmp[(y - r - 1) * W + x];
      out[y * W + x] = sum / (Math.min(y + r + 1, H) - Math.max(0, y - r));
    }
  }
  return out;
}

function prepareCanvas(img: HTMLImageElement): { ctx: CanvasRenderingContext2D; id: ImageData; px: Uint8ClampedArray; W: number; H: number } {
  const MAX = 400;
  const scale = Math.min(1, MAX / Math.max(img.naturalWidth || 1, img.naturalHeight || 1));
  const W = Math.max(1, Math.round((img.naturalWidth  || MAX) * scale));
  const H = Math.max(1, Math.round((img.naturalHeight || MAX) * scale));
  const c = document.createElement("canvas"); c.width = W; c.height = H;
  const ctx = c.getContext("2d")!;
  ctx.drawImage(img, 0, 0, W, H);
  const id = ctx.getImageData(0, 0, W, H);
  return { ctx, id, px: id.data, W, H };
}

function computeAnomaly(px: Uint8ClampedArray, W: number, H: number, mr: number, mg: number, mb: number): Float32Array {
  const anom = new Float32Array(W * H);
  for (let i = 0; i < W * H; i++) {
    const dr = px[i*4]-mr, dg = px[i*4+1]-mg, db = px[i*4+2]-mb;
    anom[i] = Math.sqrt(dr*dr + dg*dg + db*db);
  }
  return anom;
}

export function generateHeatmapUrl(img: HTMLImageElement): string {
  const { ctx, id, px, W, H } = prepareCanvas(img);
  const [mr, mg, mb] = skinMean(px, W, H);
  const anom = computeAnomaly(px, W, H, mr, mg, mb);
  const blurred = boxBlur(anom, W, H, Math.max(2, Math.floor(Math.min(W, H) * 0.04)));
  const sorted  = Float32Array.from(blurred).sort();
  const p95     = sorted[Math.floor(sorted.length * 0.95)] || 1;

  for (let i = 0; i < W * H; i++) {
    const r = px[i*4], g = px[i*4+1], b = px[i*4+2];
    const o = i * 4;
    if (!isSkin(r, g, b)) {
      const gray = Math.round((0.299 * r + 0.587 * g + 0.114 * b) * 0.38);
      id.data[o] = gray; id.data[o+1] = gray; id.data[o+2] = gray;
    } else {
      const t = Math.min(1, blurred[i] / p95);
      const [tr, tg, tb] = skinThermalColor(t);
      id.data[o]   = Math.round(tr * 0.7 + r * 0.3);
      id.data[o+1] = Math.round(tg * 0.7 + g * 0.3);
      id.data[o+2] = Math.round(tb * 0.7 + b * 0.3);
    }
  }
  ctx.putImageData(id, 0, 0);
  return ctx.canvas.toDataURL("image/jpeg", 0.88);
}

function findHeuristicBbox(blurred: Float32Array, W: number, H: number): { bx: number; by: number; bw: number; bh: number } | null {
  let peakVal = 0, peakX = 0, peakY = 0;
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++)
      if (blurred[y * W + x] > peakVal) { peakVal = blurred[y * W + x]; peakX = x; peakY = y; }
  if (!peakVal) return null;
  const thresh = peakVal * 0.35;
  const maxR2 = Math.pow(Math.min(W, H) * 0.40, 2);
  let x0 = peakX, x1 = peakX, y0 = peakY, y1 = peakY;
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const dx = x - peakX, dy = y - peakY;
      if (blurred[y * W + x] >= thresh && dx * dx + dy * dy <= maxR2) {
        if (x < x0) x0 = x; if (x > x1) x1 = x;
        if (y < y0) y0 = y; if (y > y1) y1 = y;
      }
    }
  const pad = Math.round(Math.min(W, H) * 0.05);
  return {
    bx: Math.max(0, x0 - pad),
    by: Math.max(0, y0 - pad),
    bw: Math.min(W - Math.max(0, x0 - pad), x1 - x0 + pad * 2),
    bh: Math.min(H - Math.max(0, y0 - pad), y1 - y0 + pad * 2),
  };
}

function drawBboxOverlay(ctx: CanvasRenderingContext2D, id: ImageData, px: Uint8ClampedArray, W: number, H: number, bx: number, by: number, bw: number, bh: number) {
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++)
      if (!(x >= bx && x <= bx+bw && y >= by && y <= by+bh)) {
        const i = (y*W+x)*4;
        id.data[i] = Math.round(px[i]*0.45); id.data[i+1] = Math.round(px[i+1]*0.45); id.data[i+2] = Math.round(px[i+2]*0.45);
      }
  ctx.putImageData(id, 0, 0);

  ctx.save();
  ctx.shadowColor = "rgba(77,157,255,0.85)"; ctx.shadowBlur = 16;
  ctx.strokeStyle = "rgba(77,157,255,0.95)"; ctx.lineWidth = 2;
  ctx.strokeRect(bx, by, bw, bh);
  ctx.restore();

  const tc = 12;
  ctx.strokeStyle = "rgba(255,255,255,0.92)"; ctx.lineWidth = 2.5; ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(bx, by+tc);       ctx.lineTo(bx, by);       ctx.lineTo(bx+tc, by);
  ctx.moveTo(bx+bw-tc, by);    ctx.lineTo(bx+bw, by);    ctx.lineTo(bx+bw, by+tc);
  ctx.moveTo(bx, by+bh-tc);    ctx.lineTo(bx, by+bh);    ctx.lineTo(bx+tc, by+bh);
  ctx.moveTo(bx+bw-tc, by+bh); ctx.lineTo(bx+bw, by+bh); ctx.lineTo(bx+bw, by+bh-tc);
  ctx.stroke();
}

export function generateSegmentUrl(
  img: HTMLImageElement,
  primaryDx?: string,
  bbox?: { x: number; y: number; w: number; h: number } | null,
): string {
  const { ctx, id, px, W, H } = prepareCanvas(img);
  const [mr, mg, mb] = skinMean(px, W, H);
  const anom = computeAnomaly(px, W, H, mr, mg, mb);

  let bx: number, by: number, bw: number, bh: number;

  if (bbox) {
    bx = Math.max(0, Math.round(bbox.x * W));
    by = Math.max(0, Math.round(bbox.y * H));
    bw = Math.min(W - bx, Math.max(8, Math.round(bbox.w * W)));
    bh = Math.min(H - by, Math.max(8, Math.round(bbox.h * H)));
  } else {
    const blurred = boxBlur(anom, W, H, Math.max(2, Math.floor(Math.min(W, H) * 0.04)));
    const heuristic = findHeuristicBbox(blurred, W, H);
    if (!heuristic) { ctx.putImageData(id, 0, 0); return ctx.canvas.toDataURL("image/jpeg", 0.88); }
    ({ bx, by, bw, bh } = heuristic);
  }

  drawBboxOverlay(ctx, id, px, W, H, bx, by, bw, bh);

  if (primaryDx) {
    ctx.font = "bold 11px system-ui, sans-serif";
    const tw = ctx.measureText(primaryDx).width + 14;
    const lx = Math.min(bx, W - tw - 2), ly = Math.max(2, by - 22);
    ctx.fillStyle = "rgba(61,122,237,0.92)";
    ctx.beginPath(); ctx.roundRect(lx, ly, tw, 19, 4); ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.fillText(primaryDx, lx + 7, ly + 13);
  }

  return ctx.canvas.toDataURL("image/jpeg", 0.88);
}
