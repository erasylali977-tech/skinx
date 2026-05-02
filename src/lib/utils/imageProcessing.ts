// ── Image processing utilities ─────────────────────────────────────────────
// Canvas-based helpers for cropping images using Roboflow bounding-box coords.

export interface RoboflowBox {
  x: number;          // center X in Roboflow image space
  y: number;          // center Y in Roboflow image space
  width: number;      // box width  in Roboflow image space
  height: number;     // box height in Roboflow image space
  confidence: number; // 0–1
  class: string;
}

/**
 * Crops a File image using Roboflow center-based bounding-box coordinates.
 *
 * @param file       - Original camera/gallery JPEG File
 * @param box        - Best prediction from Roboflow (center-based coords)
 * @param rfImgWidth  - data.image.width  from the Roboflow response
 * @param rfImgHeight - data.image.height from the Roboflow response
 * @param padding    - Extra context padding around the box (default 25 %)
 * @returns          - A new cropped JPEG File ready to send for AI analysis
 */
export function cropByBoundingBox(
  file: File,
  box: RoboflowBox,
  rfImgWidth: number,
  rfImgHeight: number,
  padding = 0.25,
): Promise<File> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img  = new window.Image();

    img.onload = () => {
      URL.revokeObjectURL(url);

      // Scale from Roboflow's reported dims to actual pixel dims (usually 1:1)
      const sx = img.naturalWidth  / rfImgWidth;
      const sy = img.naturalHeight / rfImgHeight;

      // Center-based → top-left corner in actual image pixels
      const bx = (box.x - box.width  / 2) * sx;
      const by = (box.y - box.height / 2) * sy;
      const bw = box.width  * sx;
      const bh = box.height * sy;

      // Add padding for context around the lesion
      const padX = bw * padding;
      const padY = bh * padding;
      const cx = Math.max(0, bx - padX);
      const cy = Math.max(0, by - padY);
      const cw = Math.min(img.naturalWidth  - cx, bw + padX * 2);
      const ch = Math.min(img.naturalHeight - cy, bh + padY * 2);

      const canvas = document.createElement("canvas");
      canvas.width  = Math.round(cw);
      canvas.height = Math.round(ch);
      const ctx = canvas.getContext("2d");
      if (!ctx) { reject(new Error("Canvas 2D not available")); return; }

      ctx.drawImage(img, cx, cy, cw, ch, 0, 0, cw, ch);

      canvas.toBlob(
        (blob) => {
          if (!blob) { reject(new Error("Crop failed")); return; }
          resolve(new File([blob], "crop.jpg", { type: "image/jpeg" }));
        },
        "image/jpeg",
        0.92,
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Image load failed"));
    };

    img.src = url;
  });
}
