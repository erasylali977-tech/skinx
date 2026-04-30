"use client";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Icon } from "./Icon";
import { useI18n } from "@/lib/i18n/context";

// Skin/medical themed emoji + some general friendly ones like iCloud
const AVATAR_OPTIONS = [
  // Skin/medical themed
  "🩺", "🩹", "💊", "🏥", "🧬", "🔬", "🧪", "🫀", "🫁", "🧠",
  // Faces
  "😀", "😎", "🤓", "😊", "🙂", "😌", "🥰", "😍", "🤩", "🤠",
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

interface Props {
  value: string | null;
  onChange: (avatar: string) => void;
}

export function AvatarPicker({ value, onChange }: Props) {
  const { t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Selected avatar display */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-24 h-24 rounded-full bg-surface-container-high flex items-center justify-center text-5xl",
          "border-2 border-primary/30 hover:border-primary transition-all",
          "shadow-ambient hover:shadow-primary-glow",
          "relative group"
        )}
      >
        {value || "👤"}
        <div className="absolute inset-0 rounded-full bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <Icon name="edit" className="text-white text-2xl" />
        </div>
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
          <div className="grid grid-cols-8 gap-2 max-h-64 overflow-y-auto p-1">
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
