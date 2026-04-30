"use client";
import { useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Icon } from "./Icon";
import { useI18n } from "@/lib/i18n/context";

// Skin/medical themed emoji + some general friendly ones like iCloud
const AVATAR_OPTIONS = [
  // Faces
  "😀", "😎", "🤓", "😊", "🙂", "�", "�", "😍", "�", "�",
  // Skin/medical themed
  "🩺", "🩹", "💊", "🏥", "🧬", "�", "�", "🫀", "�", "�",
  // Nature/animals
  "🌸", "🌻", "🌿", "🍀", "🌵", "🐶", "🐱", "🐭", "🐰", "🦊",
  "🐻", "🐼", "🐨", "🐯", "🦁", "🐮", "🐷", "🐸", "🐙", "🦄",
  // Objects
  "⭐", "🌟", "✨", "🔥", "💧", "❄️", "🌈", "☀️", "🌙", "⚡",
  "🍎", "🍊", "🍋", "🍌", "🍉", "🍇", "🫐", "🍓", "🥑", "🥥",
  // Symbols
  "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💖",
  "💯", "♻️", "🔔", "📱", "💻", "🔋", "🔑", "🎁", "🎈", "🎉",
];

function isUrl(v: string | null | undefined) {
  return !!(v && (v.startsWith("http") || v.startsWith("data:")));
}

interface Props {
  value: string | null;
  onChange: (avatar: string) => void;
  onFileSelect?: (file: File) => void;
  uploading?: boolean;
}

export function AvatarPicker({ value, onChange, onFileSelect, uploading }: Props) {
  const { t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (onFileSelect) {
      onFileSelect(file);
    } else {
      onChange(URL.createObjectURL(file));
    }
    setIsOpen(false);
    e.target.value = "";
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />

      {/* Selected avatar display */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={uploading}
        className={cn(
          "w-24 h-24 rounded-full flex items-center justify-center text-5xl overflow-hidden",
          "border-2 border-primary/30 hover:border-primary transition-all",
          "shadow-ambient hover:shadow-primary-glow",
          "relative group",
          isUrl(value) ? "bg-surface-container-high" : "bg-surface-container-high"
        )}
      >
        {isUrl(value) ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value!} alt="" className="w-full h-full object-cover" />
        ) : (
          value || "👤"
        )}
        {uploading ? (
          <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
            <span className="w-6 h-6 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          </div>
        ) : (
          <div className="absolute inset-0 rounded-full bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Icon name="edit" className="text-white text-2xl" />
          </div>
        )}
      </button>
      <p className="text-sm text-on-surface-variant">{t.profile.tapToChangeAvatar}</p>

      {/* Picker grid */}
      {isOpen && (
        <div className="w-full bg-surface-container-lowest rounded-2xl p-4 shadow-ambient animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-on-surface-variant">{t.profile.chooseAvatar}</span>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-full hover:bg-surface-container transition-colors"
            >
              <Icon name="close" className="text-on-surface-variant" />
            </button>
          </div>

          {/* Upload photo button */}
          <button
            onClick={() => fileRef.current?.click()}
            className="w-full flex items-center gap-3 px-4 py-3 mb-3 rounded-xl bg-primary/10 border border-primary/20 hover:bg-primary/15 transition-colors"
          >
            <Icon name="add_a_photo" className="text-primary text-xl" />
            <span className="text-sm font-semibold text-primary">{t.profile.uploadPhoto}</span>
          </button>

          <div className="grid grid-cols-8 gap-2 max-h-56 overflow-y-auto p-1">
            {AVATAR_OPTIONS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => {
                  onChange(emoji);
                  setIsOpen(false);
                }}
                className={cn(
                  "w-10 h-10 rounded-xl text-2xl flex items-center justify-center",
                  "hover:bg-surface-container-high transition-all",
                  "active:scale-95",
                  value === emoji && "bg-primary-container ring-2 ring-primary"
                )}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
