"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, BookOpen, Lock, CheckCircle2, Globe, MapPin } from "lucide-react";
import { useUserStore } from "@/lib/stores/userStore";
import { apiClient } from "@/lib/api/client";
import { cn } from "@/lib/utils/cn";
import type { ILM } from "@/lib/types";

// ── API helpers ───────────────────────────────────────────────────────────────

async function fetchSkill(skillId: string) {
  return apiClient.get<{
    id: string;
    name: string;
    description: string | null;
    sort_order: number;
  }>(`/api/v1/skills/${skillId}`);
}

async function fetchILMs(skillId: string) {
  return apiClient.get<ILM[]>(`/api/v1/skills/${skillId}/classes`);
}

async function fetchRankProgress(ilmIds: string[]): Promise<Record<string, string[]>> {
  if (!ilmIds.length) return {};
  const ids = ilmIds.join(",");
  return apiClient.get<Record<string, string[]>>(
    `/api/v1/profile/rank-progress?ilm_ids=${encodeURIComponent(ids)}`
  );
}

// ── Constants ─────────────────────────────────────────────────────────────────

const RANKS = ["Cadet", "Agent", "Specialist", "Operator", "Commander"];

// ── RankDots ──────────────────────────────────────────────────────────────────

function RankDots({ unlockedRanks }: { unlockedRanks: string[] }) {
  return (
    <div className="flex items-center gap-1">
      {RANKS.map((rank) => (
        <div
          key={rank}
          title={rank}
          className={cn(
            "w-2.5 h-2.5 rounded-full transition-all",
            unlockedRanks.includes(rank)
              ? "bg-blueberry-500 scale-110"
              : "bg-neutral-100"
          )}
        />
      ))}
    </div>
  );
}

// ── ILMCard ───────────────────────────────────────────────────────────────────

interface ILMCardProps {
  ilm: ILM;
  unlockedRanks: string[];
  ilmIndex: number;
  isLocked: boolean;
}

function ILMCard({ ilm, unlockedRanks, ilmIndex, isLocked }: ILMCardProps) {
  const completedCount = unlockedRanks.length;
  const isStarted = completedCount > 0;
  const isComplete = completedCount === 5;

  const cardContent = (
    <div
      className={cn(
        "rounded-2xl p-5 transition-all duration-200 group",
        isLocked
          ? "opacity-60 cursor-not-allowed"
          : isComplete
          ? "bg-gradient-card elevation-4 ring-1 ring-blueberry-300 hover:-translate-y-0.5 cursor-pointer"
          : isStarted
          ? "elevation-3 hover:elevation-4 hover:-translate-y-0.5 cursor-pointer"
          : "elevation-2 hover:elevation-3 hover:-translate-y-0.5 cursor-pointer"
      )}
      style={!isComplete ? { background: "var(--surfaceELementWhite)" } : undefined}
    >
      <div className="flex items-start gap-4">
        {/* Number / status icon */}
        <div
          className={cn(
            "w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center text-[15px] font-bold font-manrope",
            isLocked
              ? "bg-neutral-100/80 text-neutral-300"
              : isComplete
              ? "bg-blueberry-500 text-white"
              : isStarted
              ? "bg-blueberry-alt-50 text-blueberry-alt-700"
              : "bg-neutral-100/80 text-neutral-400"
          )}
        >
          {isLocked ? (
            <Lock className="w-4 h-4" />
          ) : isComplete ? (
            <CheckCircle2 className="w-5 h-5" />
          ) : (
            String(ilmIndex + 1).padStart(2, "0")
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[11px] font-semibold text-neutral-300 font-manrope uppercase tracking-wider">
              {ilm.ilm_id}
            </span>
            {ilm.is_global ? (
              <Globe className="w-3.5 h-3.5 text-blueberry-300" />
            ) : (
              <MapPin className="w-3.5 h-3.5 text-sunshade-400" />
            )}
          </div>

          <h3
            className={cn(
              "text-[17px] font-bold font-manrope leading-snug truncate",
              isLocked ? "text-neutral-400" : "text-blueberry-alt-700"
            )}
          >
            {ilm.title}
          </h3>

          <p className="text-[13px] text-neutral-400 font-source-sans mt-0.5 truncate">
            {ilm.topic}
          </p>

          <div className="flex items-center justify-between mt-3">
            <RankDots unlockedRanks={unlockedRanks} />

            <div className="flex items-center gap-1.5">
              {isLocked ? (
                <span className="text-[12px] text-neutral-300 font-source-sans">
                  Complete previous class first
                </span>
              ) : completedCount > 0 ? (
                <span className="text-[12px] font-semibold font-manrope text-blueberry-500">
                  {completedCount}/5 ranks
                </span>
              ) : (
                <span className="text-[12px] text-neutral-300 font-source-sans">
                  Not started
                </span>
              )}
              {!isLocked && (
                <BookOpen
                  className={cn(
                    "w-4 h-4 transition-transform group-hover:translate-x-0.5",
                    isStarted ? "text-blueberry-500" : "text-neutral-300"
                  )}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (isLocked) {
    return <div>{cardContent}</div>;
  }

  return (
    <Link href={`/skills/${ilm.skill_id}/classes/${ilm.id}`} className="block">
      {cardContent}
    </Link>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ClassesPage({ params }: { params: { skillId: string } }) {
  const { skillId } = params;
  // profile is used only to satisfy type — rank-progress auth uses the JWT in the request header
  useUserStore((s) => s.profile);

  const { data: skill, isLoading: skillLoading } = useQuery({
    queryKey: ["skill", skillId],
    queryFn: () => fetchSkill(skillId),
  });

  const { data: ilms = [], isLoading: ilmsLoading } = useQuery({
    queryKey: ["ilms", skillId],
    queryFn: () => fetchILMs(skillId),
  });

  const { data: rankProgressMap = {} } = useQuery({
    queryKey: ["rank-progress", skillId],
    queryFn: () => fetchRankProgress(ilms.map((i) => i.id)),
    enabled: ilms.length > 0,
    // Re-fetch when user navigates back to this page
    staleTime: 0,
  });

  const isLoading = skillLoading || ilmsLoading;

  // ILM i is locked if i > 0 AND the previous ILM has zero ranks unlocked
  function isILMLocked(index: number): boolean {
    if (index === 0) return false;
    const prevIlm = ilms[index - 1];
    const prevUnlocked = rankProgressMap[prevIlm?.id] ?? [];
    return prevUnlocked.length === 0;
  }

  return (
    <div className="py-8">
      {/* Back link */}
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-neutral-400 font-manrope hover:text-blueberry-500 mb-6 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to Skills
      </Link>

      {/* Skill header */}
      {skill && !isLoading && (
        <div className="mb-8">
          <h1 className="text-[28px] font-extrabold text-blueberry-alt-700 font-manrope leading-tight">
            {skill.name}
          </h1>
          {skill.description && (
            <p className="text-[15px] text-neutral-400 font-source-sans mt-1">
              {skill.description}
            </p>
          )}
          <div className="flex items-center gap-3 mt-3">
            <span className="px-3 py-1 rounded-full bg-blueberry-alt-50 text-blueberry-alt-700 text-[13px] font-semibold font-manrope">
              {ilms.length} Classes
            </span>
            <span className="px-3 py-1 rounded-full bg-sunshade-50 text-sunshade-700 text-[13px] font-semibold font-manrope">
              5 Ranks each
            </span>
          </div>
        </div>
      )}

      {/* ILMs list */}
      {isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-[96px] skeleton rounded-2xl" />
          ))}
        </div>
      ) : ilms.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <Lock className="w-10 h-10 text-neutral-200" />
          <p className="text-[17px] font-semibold text-neutral-400 font-manrope">
            No classes available yet
          </p>
          <p className="text-[14px] text-neutral-300 font-source-sans">
            Content is being added. Check back soon!
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {ilms.map((ilm, i) => (
            <ILMCard
              key={ilm.id}
              ilm={ilm}
              unlockedRanks={rankProgressMap[ilm.id] ?? []}
              ilmIndex={i}
              isLocked={isILMLocked(i)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
