"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, ChevronRight, CheckCircle2 } from "lucide-react";
import { mockSupabase } from "@/lib/mock/supabase";
import { useUserStore } from "@/lib/stores/userStore";
import { Button } from "@/components/ui/Button";
import type { Skill } from "@/lib/types";

const MOCK_SKILLS: Skill[] = [
  {
    id: "skill-fe",
    code: "FE",
    name: "Finance & Entrepreneurship",
    description: "Business, Money & Entrepreneurial Thinking",
    icon_url: null,
    theme_code: "amber",
    is_global: true,
    sort_order: 1,
  },
];

export default function HomePage() {
  const router = useRouter();
  const profile = useUserStore((s) => s.profile);
  const [selected, setSelected] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleStart = () => {
    if (!selected) return;
    setSaving(true);
    // Persist selected skill in mock store (in-memory, synchronous)
    mockSupabase.from("selected_skills").delete().eq("profile_id", profile?.id ?? "demo-user");
    void mockSupabase.from("selected_skills").insert([
      { profile_id: profile?.id ?? "demo-user", skill_id: selected, sort_order: 0 },
    ] as any);
    router.push(`/skills/${selected}`);
  };

  return (
    <div className="py-10 max-w-[560px] mx-auto">
      {/* Header */}
      <div className="mb-10">
        <p className="text-[12px] font-semibold text-blueberry-500 font-manrope uppercase tracking-widest mb-2">
          Welcome{profile ? `, ${profile.display_name.split(" ")[0]}` : ""}
        </p>
        <h1 className="text-[30px] font-extrabold text-blueberry-alt-700 font-manrope leading-tight">
          Choose your skill
        </h1>
        <p className="text-[15px] text-neutral-400 font-source-sans mt-1">
          Select a skill to begin your personalized learning journey.
        </p>
      </div>

      {/* Skill cards */}
      <div className="flex flex-col gap-4 mb-8">
        {MOCK_SKILLS.map((skill) => {
          const isSelected = selected === skill.id;
          return (
            <button
              key={skill.id}
              type="button"
              onClick={() => setSelected(skill.id)}
              className="w-full text-left rounded-2xl p-5 border-2 transition-all duration-150 focus:outline-none"
              style={{
                background: isSelected ? "#f6f5ff" : "var(--surfaceELementWhite)",
                borderColor: isSelected ? "#7364ec" : "#e8e8ec",
                boxShadow: isSelected
                  ? "0 0 0 3px rgba(115,100,236,0.12)"
                  : "var(--elevation2)",
              }}
            >
              <div className="flex items-center gap-4">
                {/* Icon */}
                <div
                  className="w-14 h-14 rounded-2xl flex-shrink-0 flex items-center justify-center text-2xl"
                  style={{ background: isSelected ? "#7364ec" : "#f0eeff" }}
                >
                  <span role="img" aria-label="FE">💼</span>
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <p
                    className="text-[17px] font-bold font-manrope leading-snug"
                    style={{ color: isSelected ? "#3a2cb8" : "#2d3a5a" }}
                  >
                    {skill.name}
                  </p>
                  <p className="text-[13px] text-neutral-400 font-source-sans mt-0.5">
                    {skill.description}
                  </p>
                </div>

                {/* Check */}
                <div className="flex-shrink-0">
                  {isSelected ? (
                    <CheckCircle2 className="w-6 h-6 text-blueberry-500" />
                  ) : (
                    <div className="w-6 h-6 rounded-full border-2 border-neutral-200" />
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* CTA */}
      <Button
        variant="primary"
        size="lg"
        className="w-full"
        disabled={!selected}
        loading={saving}
        onClick={handleStart}
      >
        <Sparkles className="w-5 h-5" />
        Start Learning
        <ChevronRight className="w-5 h-5" />
      </Button>
    </div>
  );
}
