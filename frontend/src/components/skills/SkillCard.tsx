"use client";

import { Check, Lock, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { Skill } from "@/lib/types";

const SKILL_COLORS: Record<string, { gradient: string; light: string; text: string }> = {
  AI: {
    gradient: "linear-gradient(135deg, #7364ec, #3a2cb8)",
    light: "#f6f5ff",
    text: "#3a2cb8",
  },
  Data: {
    gradient: "linear-gradient(135deg, #f4a71d, #ad7615)",
    light: "#fef6e8",
    text: "#ad7615",
  },
  Coding: {
    gradient: "linear-gradient(135deg, #e539b5, #7e1f64)",
    light: "#fce4f4",
    text: "#7e1f64",
  },
  Math: {
    gradient: "linear-gradient(135deg, #5dda5d, #2a7a2a)",
    light: "#e8f9e8",
    text: "#2a7a2a",
  },
  LifeSkill: {
    gradient: "linear-gradient(135deg, #f4a71d, #e539b5)",
    light: "#fff8f0",
    text: "#ad7615",
  },
};

const SKILL_ICONS: Record<string, string> = {
  AI: "🤖",
  Data: "📊",
  Coding: "💻",
  Math: "🧮",
  LifeSkill: "🌟",
};

function getSkillTheme(themeCode: string) {
  const key = Object.keys(SKILL_COLORS).find((k) =>
    themeCode.toUpperCase().includes(k.toUpperCase())
  );
  return SKILL_COLORS[key ?? "AI"];
}

function getSkillIcon(themeCode: string) {
  const key = Object.keys(SKILL_ICONS).find((k) =>
    themeCode.toUpperCase().includes(k.toUpperCase())
  );
  return SKILL_ICONS[key ?? "AI"];
}

interface SkillCardProps {
  skill: Skill;
  isSelected: boolean;
  canSelect: boolean;
  onToggle: (skill: Skill) => void;
  mode: "select" | "navigate";
  classCount?: number;
}

export function SkillCard({
  skill,
  isSelected,
  canSelect,
  onToggle,
  mode,
  classCount,
}: SkillCardProps) {
  const theme = getSkillTheme(skill.theme_code);
  const icon = getSkillIcon(skill.theme_code);
  const isLocked = !canSelect && !isSelected;

  const handleClick = () => {
    if (mode === "select" && !isLocked) {
      onToggle(skill);
    } else if (mode === "navigate") {
      onToggle(skill);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={isLocked && mode === "select"}
      className={cn(
        "relative w-full text-left rounded-2xl p-5 transition-all duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blueberry-300",
        isSelected
          ? "elevation-4 ring-2 ring-blueberry-500"
          : isLocked
          ? "elevation-1 opacity-50 cursor-not-allowed"
          : "elevation-3 hover:elevation-4 hover:-translate-y-0.5 cursor-pointer"
      )}
      style={{ background: "var(--surfaceELementWhite)" }}
    >
      {/* Top: icon + selection indicator */}
      <div className="flex items-start justify-between mb-3">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
          style={{ background: theme.gradient }}
        >
          {icon}
        </div>

        {mode === "select" && (
          <div
            className={cn(
              "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
              isSelected
                ? "bg-blueberry-500 border-blueberry-500"
                : "border-neutral-200 bg-white"
            )}
          >
            {isSelected && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
          </div>
        )}

        {mode === "navigate" && (
          <ChevronRight className="w-5 h-5 text-neutral-300" />
        )}

        {isLocked && mode === "select" && (
          <Lock className="w-4 h-4 text-neutral-200" />
        )}
      </div>

      {/* Skill name */}
      <h3
        className="text-[17px] font-bold font-manrope leading-snug mb-1"
        style={{ color: theme.text }}
      >
        {skill.name}
      </h3>

      {skill.description && (
        <p className="text-[13px] text-neutral-400 font-source-sans leading-snug line-clamp-2">
          {skill.description}
        </p>
      )}

      {/* Class count */}
      {classCount !== undefined && (
        <div
          className="inline-flex items-center gap-1 mt-3 px-2.5 py-1 rounded-full text-[12px] font-semibold font-manrope"
          style={{ background: theme.light, color: theme.text }}
        >
          {classCount} Classes
        </div>
      )}

      {/* Selected badge */}
      {isSelected && mode === "select" && (
        <div className="absolute top-2 left-2">
          <div className="px-2 py-0.5 rounded-full bg-blueberry-500 text-white text-[11px] font-bold font-manrope">
            Selected
          </div>
        </div>
      )}
    </button>
  );
}
