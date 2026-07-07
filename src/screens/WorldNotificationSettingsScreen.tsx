import React, { useState } from "react";
import { motion } from "motion/react";
import { ChevronLeft, Bell } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useWorlds } from "../hooks/useWorldMembership";

export function WorldNotificationSettingsScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const worlds = useWorlds();
  const world = worlds.find((w) => w.id === id) || worlds[0];

  const [masterEnabled, setMasterEnabled] = useState(true);
  const [toggles, setToggles] = useState({
    voice: true,
    announcements: true,
    activity: true,
    achievements: true,
    members: false,
  });
  const [frequency, setFrequency] = useState("realtime");

  const AtmosphereTheme = (color: string) => ({
    bg: `bg-[${color}]`,
    text: `text-[${color}]`,
    border: `border-[${color}]`,
    gradientString: `linear-gradient(to right, ${color}, #ffffff)`,
  });

  const atmColor =
    world.atmosphere === "nebula"
      ? "#B026FF"
      : world.atmosphere === "solar"
        ? "#F59E0B"
        : world.atmosphere === "ocean"
          ? "#3B82F6"
          : world.atmosphere === "crimson"
            ? "#EF4444"
            : "#B026FF";

  const ToggleSwitch = ({
    checked,
    onChange,
    disabled = false,
  }: {
    checked: boolean;
    onChange: (v: boolean) => void;
    disabled?: boolean;
  }) => (
    <button
      onClick={() => (disabled ? null : onChange(!checked))}
      className={`w-12 h-6 rounded-full p-1 transition-colors relative flex items-center ${disabled ? "opacity-50" : ""}`}
      style={{ backgroundColor: checked ? atmColor : "#333" }}
    >
      <motion.div
        animate={{ x: checked ? 24 : 0 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className="w-4 h-4 bg-white rounded-full shadow-sm"
      />
    </button>
  );

  return (
    <div className="flex flex-col h-full bg-[#05050A] text-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-white/5 relative z-10 bg-[#05050A]/80 backdrop-blur-md">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 -ml-2 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div className="text-center">
          <h1 className="text-[12px] font-bold tracking-widest uppercase text-white/90 truncate max-w-[200px]">
            {world.name} NOTIFICATIONS
          </h1>
        </div>
        <div className="w-10" />
      </div>

      <div className="flex-1 overflow-y-auto pb-safe-bottom">
        <div className="p-4 space-y-6">
          {/* Master Toggle */}
          <div className="bg-[#111115] rounded-xl p-4 flex items-center justify-between border border-white/10 shadow-lg">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10"
                style={{ color: atmColor }}
              >
                <Bell size={20} />
              </div>
              <div>
                <h3 className="text-[15px] font-bold text-white">
                  All notifications
                </h3>
                <p className="text-[12px] text-[#888899]">
                  Master switch for {world.name}
                </p>
              </div>
            </div>
            <ToggleSwitch checked={masterEnabled} onChange={setMasterEnabled} />
          </div>

          <div className="w-full h-px bg-white/5" />

          {/* Individual Settings */}
          <div
            className={`space-y-1 transition-opacity duration-300 ${!masterEnabled ? "opacity-50 pointer-events-none" : ""}`}
          >
            <div className="p-4 flex items-center justify-between hover:bg-white/5 rounded-xl transition-colors">
              <div className="pr-4">
                <h4 className="text-[14px] font-bold text-white mb-0.5">
                  Voice Rooms
                </h4>
                <p className="text-[12px] text-[#888899] leading-tight">
                  Notify when a room goes live
                </p>
              </div>
              <ToggleSwitch
                checked={toggles.voice}
                onChange={(v) => setToggles({ ...toggles, voice: v })}
              />
            </div>

            <div className="p-4 flex items-center justify-between hover:bg-white/5 rounded-xl transition-colors">
              <div className="pr-4">
                <h4 className="text-[14px] font-bold text-white mb-0.5">
                  Announcements
                </h4>
                <p className="text-[12px] text-[#888899] leading-tight">
                  Admin announcements only
                </p>
              </div>
              <ToggleSwitch
                checked={toggles.announcements}
                onChange={(v) => setToggles({ ...toggles, announcements: v })}
              />
            </div>

            <div className="p-4 flex items-center justify-between hover:bg-white/5 rounded-xl transition-colors">
              <div className="pr-4">
                <h4 className="text-[14px] font-bold text-white mb-0.5">
                  Your post activity
                </h4>
                <p className="text-[12px] text-[#888899] leading-tight">
                  Sparks and comments on your posts
                </p>
              </div>
              <ToggleSwitch
                checked={toggles.activity}
                onChange={(v) => setToggles({ ...toggles, activity: v })}
              />
            </div>

            <div className="p-4 flex items-center justify-between hover:bg-white/5 rounded-xl transition-colors">
              <div className="pr-4">
                <h4 className="text-[14px] font-bold text-white mb-0.5">
                  Member achievements
                </h4>
                <p className="text-[12px] text-[#888899] leading-tight">
                  Pioneer and Legend upgrades
                </p>
              </div>
              <ToggleSwitch
                checked={toggles.achievements}
                onChange={(v) => setToggles({ ...toggles, achievements: v })}
              />
            </div>

            <div className="p-4 flex items-center justify-between hover:bg-white/5 rounded-xl transition-colors">
              <div className="pr-4">
                <h4 className="text-[14px] font-bold text-white mb-0.5">
                  New members
                </h4>
                <p className="text-[12px] text-[#888899] leading-tight">
                  Daily summary of joins
                </p>
              </div>
              <ToggleSwitch
                checked={toggles.members}
                onChange={(v) => setToggles({ ...toggles, members: v })}
              />
            </div>
          </div>

          <div className="w-full h-px bg-white/5" />

          {/* Frequency */}
          <div
            className={`space-y-4 pt-2 transition-opacity duration-300 ${!masterEnabled ? "opacity-50 pointer-events-none" : ""}`}
          >
            <h4 className="text-[12px] font-bold text-[#888899] uppercase tracking-widest px-1">
              FREQUENCY:
            </h4>
            <div className="bg-[#111115] rounded-xl border border-white/5 overflow-hidden">
              {[
                { id: "realtime", label: "Real-time", desc: "As it happens" },
                {
                  id: "daily",
                  label: "Daily digest",
                  desc: "Once a day at 9 AM",
                },
                {
                  id: "weekly",
                  label: "Weekly digest",
                  desc: "Every Monday morning",
                },
              ].map((f, i) => (
                <label
                  key={f.id}
                  className={`flex items-center justify-between p-4 cursor-pointer hover:bg-white/5 transition-colors ${i !== 2 ? "border-b border-white/5" : ""}`}
                >
                  <div>
                    <p className="text-[14px] font-bold text-white">
                      {f.label}
                    </p>
                    <p className="text-[12px] text-[#888899]">{f.desc}</p>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${frequency === f.id ? "border-[#B026FF]" : "border-[#888899]"}`}
                    style={frequency === f.id ? { borderColor: atmColor } : {}}
                  >
                    {frequency === f.id && (
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: atmColor }}
                      />
                    )}
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
