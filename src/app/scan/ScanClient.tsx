"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Icon } from "@/components/Icon";

export function ScanClient() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [bodyArea, setBodyArea] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function choose() {
    fileRef.current?.click();
  }
  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }
  async function submit() {
    if (!file) {
      choose();
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("image", file);
      if (bodyArea) fd.append("body_area", bodyArea);
      const res = await fetch("/api/scans", { method: "POST", body: fd });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Upload failed");
      }
      const j = await res.json();
      router.push(`/moles/${j.id}`);
      router.refresh();
    } catch (e: any) {
      setError(e?.message ?? "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="h-screen w-screen flex flex-col relative bg-on-background text-white overflow-hidden">
      <div className="absolute inset-0 z-0">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview}
            alt="preview"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-surface-container-high via-surface-container to-surface-dim" />
        )}
        <div className="absolute inset-0 bg-on-background/30" />
      </div>

      <header className="relative z-50 flex justify-between items-center w-full px-6 py-6 pt-12">
        <Link
          href="/home"
          className="w-12 h-12 rounded-full bg-surface-container-lowest/80 backdrop-blur-xl flex items-center justify-center text-on-surface shadow-ambient active:scale-95 transition-transform"
        >
          <Icon name="close" />
        </Link>
        <div className="w-12 h-12 rounded-full bg-surface-container-lowest/80 backdrop-blur-xl flex items-center justify-center text-primary shadow-ambient">
          <Icon name="flash_auto" />
        </div>
      </header>

      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6">
        <div className="w-64 h-64 border-2 border-primary/50 rounded-[2rem] relative flex items-center justify-center mb-12">
          <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-[2rem]" />
          <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-[2rem]" />
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-[2rem]" />
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-[2rem]" />
          <div className="absolute top-1/2 left-0 w-full h-[1px] bg-primary/70 shadow-[0_0_8px_rgba(0,88,188,0.8)] animate-scan-line" />
        </div>

        <div className="flex flex-col items-center gap-2">
          <div className="bg-surface-container-lowest/90 backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-2 shadow-ambient">
            <Icon name="check_circle" className="text-[#10b981] text-sm" />
            <span className="text-sm font-medium text-on-surface">
              {preview ? "Image ready" : "Perfect lighting"}
            </span>
          </div>
          <p className="text-white/90 text-sm text-center mt-4 drop-shadow-md max-w-xs">
            Hold steady. Align the affected area within the frame.
          </p>
        </div>
      </main>

      <div className="relative z-50 w-full bg-surface-container-lowest rounded-t-[2rem] shadow-ambient-xl px-6 py-8 pb-12 flex flex-col gap-6 text-on-surface">
        <div className="w-12 h-1.5 bg-outline-variant/30 rounded-full mx-auto -mt-4 mb-2" />

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={onFile}
          className="hidden"
        />

        <input
          type="text"
          placeholder="Body area (e.g. Left Forearm)"
          value={bodyArea}
          onChange={(e) => setBodyArea(e.target.value)}
          className="w-full px-4 py-3 rounded-xl bg-surface-container-low focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/30 focus:outline-none"
        />

        <div className="flex justify-center">
          <button
            onClick={submit}
            disabled={uploading}
            className="w-20 h-20 rounded-full bg-primary-gradient p-1 shadow-primary-glow active:scale-90 transition-transform flex items-center justify-center disabled:opacity-60"
            aria-label="Capture and analyze"
          >
            <div className="w-full h-full rounded-full border-4 border-on-primary bg-transparent flex items-center justify-center">
              {uploading ? (
                <span className="w-6 h-6 border-2 border-white/60 border-t-white rounded-full animate-spin" />
              ) : null}
            </div>
          </button>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={choose}
            className="w-full flex items-center justify-between p-4 rounded-xl bg-surface-container-low hover:bg-surface-container-high transition-colors text-left group"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <Icon name="folder_open" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-on-surface">
                  Choose from Library
                </h3>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Upload an existing photo
                </p>
              </div>
            </div>
            <Icon
              name="chevron_right"
              className="text-outline-variant group-hover:text-primary transition-colors"
            />
          </button>
        </div>

        {error ? (
          <p className="text-error text-sm text-center font-medium">{error}</p>
        ) : null}
      </div>
    </div>
  );
}
