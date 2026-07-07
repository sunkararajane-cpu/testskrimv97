import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, Check, Edit2, X, Image as ImageIcon } from "lucide-react";
import { CHAT_THEMES } from "../constants/themes";
import { MessageBubble } from "./MessageBubble";

interface CustomizationSettings {
  nickname: string;
  wallpaper: string;
  bubbleColor: string;
  theirBubbleStyle: string;
  textSize: string;
  font: string;
}

interface Props {
  onClose: () => void;
  onApply: (settings: CustomizationSettings) => void;
  onReset: () => void;
  initialSettings: CustomizationSettings;
  originalName: string;
}

const BUBBLE_COLORS = [
  {
    id: "purple",
    label: "Purple",
    gradient: ["#7B2FF7", "#B026FF"],
    preview: "#9B26FF",
  },
  {
    id: "pink",
    label: "Pink",
    gradient: ["#FF1493", "#FF69B4"],
    preview: "#FF1493",
  },
  {
    id: "blue",
    label: "Blue",
    gradient: ["#006994", "#00B4FF"],
    preview: "#00B4FF",
  },
  {
    id: "green",
    label: "Green",
    gradient: ["#006400", "#00C853"],
    preview: "#00C853",
  },
  {
    id: "gold",
    label: "Gold",
    gradient: ["#B8860B", "#FFD700"],
    preview: "#FFD700",
  },
  {
    id: "red",
    label: "Red",
    gradient: ["#8B0000", "#FF4500"],
    preview: "#FF4500",
  },
];

const TEXT_SIZES = [
  { id: "small", label: "Small", className: "text-xs" },
  { id: "medium", label: "Medium", className: "text-[15px]" },
  { id: "large", label: "Large", className: "text-lg" },
];

const FONTS = [
  { id: "default", label: "Default", className: "font-sans" },
  { id: "rounded", label: "Rounded", className: "font-sans rounded-[24px]" },
  { id: "mono", label: "Mono", className: "font-mono" },
];

const THEIR_STYLES = [
  { id: "glass", label: "Glass" },
  { id: "dark", label: "Dark" },
  { id: "tinted", label: "Tinted" },
];

const SOLID_COLORS = [
  "#000000",
  "#1A1A24",
  "#2C3E50",
  "#8E44AD",
  "#2980B9",
  "#27AE60",
  "#D35400",
  "#C0392B",
  "#F39C12",
  "#16A085",
  "#34495E",
  "#7F8C8D",
  "#BDC3C7",
  "#ecf0f1",
  "#95a5a6",
];

export function ChatCustomizationSheet({
  onClose,
  onApply,
  onReset,
  initialSettings,
  originalName,
}: Props) {
  const [settings, setSettings] =
    useState<CustomizationSettings>(initialSettings);
  const [editingNickname, setEditingNickname] = useState(false);
  const [nicknameInput, setNicknameInput] = useState(
    settings.nickname || originalName,
  );

  const [showWallpaperPicker, setShowWallpaperPicker] = useState(false);
  const [showCustomColorPicker, setShowCustomColorPicker] = useState(false);
  const [customHue, setCustomHue] = useState(280);

  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const renderLivePreview = () => {
    return (
      <div className="relative w-full h-[180px] rounded-2xl overflow-hidden border border-white/10 mb-6 bg-[#0A0A0F]">
        {/* Simple background preview based on theme or solid color */}
        {settings.wallpaper.startsWith("#") ? (
          <div
            className="absolute inset-0"
            style={{ backgroundColor: settings.wallpaper }}
          />
        ) : CHAT_THEMES.find((t) => t.id === settings.wallpaper) ? (
          <div
            className="absolute inset-0 opacity-40 transition-colors duration-1000"
            style={{
              backgroundColor:
                CHAT_THEMES.find((t) => t.id === settings.wallpaper)?.preview ||
                "#1A1A24",
            }}
          />
        ) : settings.wallpaper.startsWith("http") ||
          settings.wallpaper.startsWith("data:") ? (
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${settings.wallpaper})` }}
          >
            <div className="absolute inset-0 bg-black/60" />
          </div>
        ) : (
          <div className="absolute inset-0 bg-[#0A0A0F]" />
        )}

        <div
          className={`relative z-10 p-4 flex flex-col gap-3 justify-end h-full`}
        >
          {/* Their msg */}
          <div className="flex self-start max-w-[80%]">
            <div
              className={`px-4 py-2 ${settings.textSize === "small" ? "text-xs" : settings.textSize === "large" ? "text-lg" : "text-[15px]"} ${settings.font === "mono" ? "font-mono" : "font-sans"} text-white break-words shadow-lg
                  ${settings.font === "rounded" ? "rounded-[20px] rounded-bl-[4px]" : "rounded-2xl rounded-bl-[4px]"}
               `}
              style={{
                background:
                  settings.theirBubbleStyle === "dark"
                    ? "rgba(30,30,30,1)"
                    : settings.theirBubbleStyle === "tinted"
                      ? settings.bubbleColor.startsWith("#")
                        ? `${settings.bubbleColor}30`
                        : `${BUBBLE_COLORS.find((c) => c.id === settings.bubbleColor)?.preview}30`
                      : "rgba(255,255,255,0.08)",
                backdropFilter:
                  settings.theirBubbleStyle === "glass" ? "blur(12px)" : "none",
                border:
                  settings.theirBubbleStyle === "glass"
                    ? "1px solid rgba(255,255,255,0.1)"
                    : "none",
              }}
            >
              Hey! How are you?
            </div>
          </div>

          {/* My msg */}
          <div className="flex self-end max-w-[80%]">
            <div
              className={`px-4 py-2 ${settings.textSize === "small" ? "text-xs" : settings.textSize === "large" ? "text-lg" : "text-[15px]"} ${settings.font === "mono" ? "font-mono" : "font-sans"} text-white shadow-[0_4px_12px_rgba(0,0,0,0.1)]
                  ${settings.font === "rounded" ? "rounded-[20px] rounded-br-[4px]" : "rounded-2xl rounded-br-[4px]"}
               `}
              style={{
                background: settings.bubbleColor.startsWith("#")
                  ? settings.bubbleColor
                  : `linear-gradient(135deg, ${BUBBLE_COLORS.find((c) => c.id === settings.bubbleColor)?.gradient[0]}, ${BUBBLE_COLORS.find((c) => c.id === settings.bubbleColor)?.gradient[1]})`,
              }}
            >
              I'm great! 🔥
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (showWallpaperPicker) {
    return (
      <div className="fixed inset-0 z-[100] bg-[#0A0A0F] flex flex-col pt-safe">
        <div className="flex items-center gap-3 p-4 border-b border-white/5">
          <button
            onClick={() => setShowWallpaperPicker(false)}
            className="text-white hover:text-white/70"
          >
            <ArrowLeft size={24} />
          </button>
          <h2 className="text-lg font-bold text-white">Choose Wallpaper</h2>
        </div>
        <div className="p-4 overflow-y-auto pb-safe">
          <button
            className="w-full flex items-center justify-center gap-2 p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 mb-3"
            onClick={() => {
              const input = document.createElement("input");
              input.type = "file";
              input.accept = "image/*";
              input.onchange = (e) => {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (event) => {
                    if (event.target?.result) {
                      setSettings({
                        ...settings,
                        wallpaper: event.target.result as string,
                      });
                      setShowWallpaperPicker(false);
                    }
                  };
                  reader.readAsDataURL(file);
                }
              };
              input.click();
            }}
          >
            <ImageIcon size={20} />
            <span>Set from Gallery</span>
          </button>

          <div className="text-xs font-bold text-white/50 mb-3 mt-6">
            SKRIMCHAT WALLPAPERS
          </div>
          <div className="grid grid-cols-4 gap-2 mb-6">
            {CHAT_THEMES.map((theme) => (
              <button
                key={theme.id}
                onClick={() => {
                  setSettings({ ...settings, wallpaper: theme.id });
                  setShowWallpaperPicker(false);
                }}
                className={`aspect-square rounded-xl flex items-center justify-center border-2 transition-transform ${settings.wallpaper === theme.id ? "border-white scale-[0.95]" : "border-transparent hover:scale-105"}`}
                style={{ backgroundColor: theme.preview }}
              >
                <span className="text-2xl">{theme.emoji}</span>
              </button>
            ))}
          </div>

          <div className="text-xs font-bold text-white/50 mb-3">
            SOLID COLORS
          </div>
          <div className="grid grid-cols-5 gap-2 pb-8">
            {SOLID_COLORS.map((color) => (
              <button
                key={color}
                onClick={() => {
                  setSettings({ ...settings, wallpaper: color });
                  setShowWallpaperPicker(false);
                }}
                className={`aspect-square rounded-xl border-2 transition-transform ${settings.wallpaper === color ? "border-white scale-[0.95]" : "border-transparent hover:scale-105"}`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] bg-[#0A0A0F] flex flex-col pt-safe">
      <div className="flex items-center justify-between p-4 border-b border-white/5 bg-[#0A0A0F]/80 backdrop-blur-md z-10">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="text-white hover:text-white/70">
            <ArrowLeft size={24} />
          </button>
          <h2 className="text-lg font-bold text-white">Customize Chat</h2>
        </div>
        <button
          onClick={() => onApply(settings)}
          className="px-4 py-1.5 bg-white text-black font-bold rounded-full text-sm hover:scale-105 active:scale-95 transition-transform"
        >
          ✓ Apply
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 pb-24">
        <div className="text-[10px] font-bold text-white/40 mb-2 tracking-wider">
          LIVE PREVIEW
        </div>
        {renderLivePreview()}

        <div className="bg-[#1A1A24] rounded-2xl p-4 mb-4 border border-white/5">
          <div className="text-[10px] font-bold text-white/40 mb-3 tracking-wider">
            NICKNAME
          </div>
          {editingNickname ? (
            <div className="bg-black/20 p-3 rounded-xl border border-white/10">
              <div className="flex items-center gap-2 mb-2">
                <input
                  autoFocus
                  type="text"
                  value={nicknameInput}
                  onChange={(e) => setNicknameInput(e.target.value)}
                  className="flex-1 bg-transparent text-white font-medium outline-none"
                  placeholder={originalName}
                />
                <button
                  onClick={() => {
                    setSettings({
                      ...settings,
                      nickname: nicknameInput || originalName,
                    });
                    setEditingNickname(false);
                  }}
                  className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center"
                >
                  <Check size={16} />
                </button>
              </div>
              <div className="text-[11px] text-white/40 mb-3">
                Only visible to you. {originalName} sees her real name.
              </div>
              <div className="flex gap-2 mb-3">
                {["Bestie 💜", "Bro 🤝", "Queen 👑", "Boss 😎"].map(
                  (suggest) => (
                    <button
                      key={suggest}
                      onClick={() => setNicknameInput(suggest)}
                      className="bg-white/5 px-2 py-1 rounded-md text-[11px] text-white/70 hover:text-white"
                    >
                      {suggest}
                    </button>
                  ),
                )}
              </div>
              <button
                onClick={() => {
                  setNicknameInput(originalName);
                  setSettings({ ...settings, nickname: originalName });
                  setEditingNickname(false);
                }}
                className="text-[#FF3B30] text-xs font-medium flex items-center gap-1 hover:opacity-80"
              >
                <X size={14} /> Clear Nickname
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <div className="text-white font-medium text-[15px]">
                  {settings.nickname || originalName}
                </div>
                <div className="text-[11px] text-white/40">
                  Only you see this name
                </div>
              </div>
              <button
                onClick={() => setEditingNickname(true)}
                className="p-2 text-white/60 hover:text-white bg-white/5 rounded-full"
              >
                <Edit2 size={16} />
              </button>
            </div>
          )}
        </div>

        <div className="bg-[#1A1A24] rounded-2xl p-4 mb-4 border border-white/5">
          <div className="text-[10px] font-bold text-white/40 mb-3 tracking-wider">
            WALLPAPER
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-lg overflow-hidden flex items-center justify-center bg-[#0A0A0F] border border-white/20"
                style={
                  settings.wallpaper.startsWith("#")
                    ? { backgroundColor: settings.wallpaper }
                    : CHAT_THEMES.find((t) => t.id === settings.wallpaper)
                      ? {
                          backgroundColor: CHAT_THEMES.find(
                            (t) => t.id === settings.wallpaper,
                          )?.preview,
                        }
                      : settings.wallpaper.startsWith("http") ||
                          settings.wallpaper.startsWith("data:")
                        ? {
                            backgroundImage: `url(${settings.wallpaper})`,
                            backgroundSize: "cover",
                          }
                        : {}
                }
              >
                {CHAT_THEMES.find((t) => t.id === settings.wallpaper)?.emoji}
              </div>
              <div className="text-sm text-white/70">
                {CHAT_THEMES.find((t) => t.id === settings.wallpaper)?.name ||
                  (settings.wallpaper.startsWith("#")
                    ? "Solid Color"
                    : "Custom Image")}
              </div>
            </div>
            <button
              onClick={() => setShowWallpaperPicker(true)}
              className="text-xs font-bold px-3 py-1.5 bg-white/10 rounded-full text-white/80 hover:text-white"
            >
              🎨 Change
            </button>
          </div>
        </div>

        <div className="bg-[#1A1A24] rounded-2xl p-4 mb-4 border border-white/5">
          <div className="text-[10px] font-bold text-white/40 mb-3 tracking-wider">
            BUBBLE COLORS
          </div>

          <div className="text-xs text-white/60 mb-2">Your messages:</div>
          <div className="flex items-center gap-2 mb-4 overflow-x-auto hide-scrollbar">
            {BUBBLE_COLORS.map((color) => (
              <button
                key={color.id}
                onClick={() =>
                  setSettings({ ...settings, bubbleColor: color.id })
                }
                className={`w-10 h-10 rounded-full flex-none relative transition-all ${settings.bubbleColor === color.id ? "ring-2 ring-white ring-offset-2 ring-offset-[#1A1A24] scale-90" : "hover:scale-105"}`}
                style={{ background: color.preview }}
              ></button>
            ))}
            <button
              onClick={() => setShowCustomColorPicker(!showCustomColorPicker)} // Toggle toggle
              className={`px-3 h-10 rounded-full flex-none flex items-center justify-center bg-white/5 border border-white/10 text-xs font-bold text-white/80 transition-all ${settings.bubbleColor.startsWith("hsl") ? "ring-2 ring-white ring-offset-2 ring-offset-[#1A1A24]" : ""}`}
            >
              + Custom
            </button>
          </div>

          {showCustomColorPicker && (
            <div className="bg-black/20 p-4 rounded-xl border border-white/10 mb-4 animate-fade-in">
              <div className="flex justify-between items-center mb-3">
                <div className="text-sm text-white font-medium">Custom Hue</div>
                <button
                  className="px-3 py-1 bg-white text-black text-xs font-bold rounded-full"
                  onClick={() => {
                    setSettings({
                      ...settings,
                      bubbleColor: `hsl(${customHue}, 80%, 50%)`,
                    });
                    setShowCustomColorPicker(false);
                  }}
                >
                  Apply Color
                </button>
              </div>
              <input
                type="range"
                min="0"
                max="360"
                value={customHue}
                onChange={(e) => {
                  setCustomHue(Number(e.target.value));
                }}
                className="w-full h-4 rounded-full appearance-none mb-3 outline-none"
                style={{
                  background:
                    "linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%)",
                }}
              />
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-full"
                  style={{ backgroundColor: `hsl(${customHue}, 80%, 50%)` }}
                />
                <div className="text-xs text-white/50">Preview</div>
              </div>
            </div>
          )}

          <div className="text-xs text-white/60 mt-4 mb-2">Their messages:</div>
          <div className="flex items-center gap-2">
            {THEIR_STYLES.map((style) => (
              <button
                key={style.id}
                onClick={() =>
                  setSettings({ ...settings, theirBubbleStyle: style.id })
                }
                className={`flex-1 py-2 rounded-xl text-xs font-medium border transition-colors ${settings.theirBubbleStyle === style.id ? "bg-white text-black border-white" : "bg-white/5 text-white/70 border-white/10 hover:bg-white/10"}`}
              >
                {style.label}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-[#1A1A24] rounded-2xl p-4 mb-4 border border-white/5">
          <div className="text-[10px] font-bold text-white/40 mb-3 tracking-wider">
            TEXT SIZE
          </div>
          <div className="flex items-center bg-black/20 rounded-xl p-1 border border-white/5">
            {TEXT_SIZES.map((size) => (
              <button
                key={size.id}
                onClick={() => setSettings({ ...settings, textSize: size.id })}
                className={`flex-1 py-2 rounded-lg text-xs transition-colors ${settings.textSize === size.id ? "bg-[#333344] text-white shadow-md font-bold" : "text-white/50 hover:text-white/80"}`}
              >
                {size.label}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-[#1A1A24] rounded-2xl p-4 mb-6 border border-white/5">
          <div className="text-[10px] font-bold text-white/40 mb-3 tracking-wider">
            CHAT FONT
          </div>
          <div className="flex items-center bg-black/20 rounded-xl p-1 border border-white/5">
            {FONTS.map((font) => (
              <button
                key={font.id}
                onClick={() => setSettings({ ...settings, font: font.id })}
                className={`flex-1 py-2 rounded-lg text-xs transition-colors ${settings.font === font.id ? "bg-[#333344] text-white shadow-md font-bold" : "text-white/50 hover:text-white/80"}`}
              >
                <span className={font.className}>{font.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-center pb-8">
          {showResetConfirm ? (
            <div className="flex flex-col items-center">
              <div className="text-white/70 text-sm mb-3 text-center max-w-[200px]">
                Reset all customizations for this chat? This cannot be undone.
              </div>
              <div className="flex gap-3">
                <button
                  onClick={onReset}
                  className="px-4 py-1.5 bg-[#FF3B30] text-white text-xs font-bold rounded-full hover:opacity-80"
                >
                  Reset
                </button>
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="px-4 py-1.5 bg-white/10 text-white text-xs font-bold rounded-full hover:bg-white/20"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowResetConfirm(true)}
              className="flex items-center gap-2 text-white/40 hover:text-white text-sm"
            >
              ↩️ Reset to Default
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
