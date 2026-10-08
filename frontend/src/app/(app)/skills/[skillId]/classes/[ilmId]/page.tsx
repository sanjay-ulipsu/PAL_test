"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  ChevronLeft, Sword, Lock, CheckCircle2, Star, ChevronRight, Target
} from "lucide-react";
import { mockSupabase } from "@/lib/mock/supabase";
import { apiClient } from "@/lib/api/client";
import { useUserStore } from "@/lib/stores/userStore";
import { useMissionStore } from "@/lib/stores/missionStore";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils/cn";
import type { ILM, Rank } from "@/lib/types";
import { RANKS, RANK_ORDER } from "@/lib/types";

const RANK_DESCRIPTIONS: Record<Rank, string> = {
  Cadet: "Begin your journey — foundational concepts",
  Agent: "Apply what you've learned to new situations",
  Specialist: "Analyze and evaluate at depth",
  Operator: "Connect ideas across contexts",
  Commander: "Create, synthesize, and master",
};

const RANK_COLORS: Record<Rank, { bg: string; text: string; accent: string }> = {
  Cadet:     { bg: "#f6f5ff", text: "#3a2cb8", accent: "#7364ec" },
  Agent:     { bg: "#fef6e8", text: "#ad7615", accent: "#f4a71d" },
  Specialist: { bg: "#fce4f4", text: "#7e1f64", accent: "#e539b5" },
  Operator:  { bg: "#e8f9e8", text: "#2a7a2a", accent: "#5dda5d" },
  Commander: { bg: "#fff8f0", text: "#ad7615", accent: "#f4a71d" },
};

const RANK_ICONS: Record<Rank, string> = {
  Cadet: "🎖️",
  Agent: "⚡",
  Specialist: "🔬",
  Operator: "🎯",
  Commander: "👑",
};

async function fetchILM(ilmId: string): Promise<ILM> {
  const { data, error } = await mockSupabase
    .from("ilms")
    .select("*")
    .eq("id", ilmId)
    .single();
  if (error) throw error;
  return data;
}

async function fetchRankProgress(profileId: string, ilmId: string) {
  const { data } = await mockSupabase
    .from("rank_progress")
    .select("*")
    .eq("profile_id", profileId)
    .eq("ilm_id", ilmId);
  return data ?? [];
}

async function startMission(_profileId: string, ilmId: string, rank: Rank): Promise<string> {
  const data = await apiClient.post<{ mission_id: string }>("/api/v1/missions", { ilm_id: ilmId, rank });
  return data.mission_id;
}

interface RankCardProps {
  rank: Rank;
  isUnlocked: boolean;
  isAvailable: boolean;
  bestScore?: number;
  attempts?: number;
  onStart: (rank: Rank) => void;
  loading: boolean;
}

function RankCard({ rank, isUnlocked, isAvailable, bestScore, attempts, onStart, loading }: RankCardProps) {
  const colors = RANK_COLORS[rank];
  const isLocked = !isAvailable;

  return (
    <div
      className={cn(
        "rounded-2xl p-5 transition-all duration-200",
        isLocked
          ? "opacity-50 elevation-1"
          : isUnlocked
          ? "elevation-3 hover:elevation-4"
          : "elevation-2 hover:elevation-3"
      )}
      style={{ background: isUnlocked ? colors.bg : "var(--surfaceELementWhite)" }}
    >
      <div className="flex items-center gap-4">
        {/* Rank icon */}
        <div
          className="w-14 h-14 rounded-2xl flex-shrink-0 flex items-center justify-center text-2xl elevation-2"
          style={{ background: isUnlocked ? colors.accent : "#e8e8e8" }}
        >
          {isLocked ? <Lock className="w-6 h-6 text-neutral-300" /> : RANK_ICONS[rank]}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3
              className="text-[17px] font-bold font-manrope"
              style={{ color: isLocked ? "#a9acb2" : colors.text }}
            >
              {rank}
            </h3>
            {isUnlocked && (
              <CheckCircle2
                className="w-4.5 h-4.5 flex-shrink-0"
                style={{ color: colors.accent }}
              />
            )}
            {!isUnlocked && !isLocked && (
              <span className="px-2 py-0.5 rounded-full bg-sunshade-50 text-sunshade-700 text-[11px] font-bold font-manrope">
                Next
              </span>
            )}
          </div>

          <p className="text-[13px] text-neutral-400 font-source-sans mt-0.5 truncate">
            {isLocked ? "Complete previous rank to unlock" : RANK_DESCRIPTIONS[rank]}
          </p>

          {isUnlocked && (
            <div className="flex items-center gap-3 mt-2">
              {bestScore !== undefined && (
                <div className="flex items-center gap-1">
                  <Star className="w-3.5 h-3.5" style={{ color: colors.accent }} />
                  <span className="text-[12px] font-semibold font-manrope" style={{ color: colors.text }}>
                    {bestScore}%
                  </span>
                </div>
              )}
              {attempts !== undefined && attempts > 0 && (
                <span className="text-[12px] text-neutral-400 font-source-sans">
                  {attempts} {attempts === 1 ? "attempt" : "attempts"}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Action */}
        {!isLocked && (
          <Button
            variant={isUnlocked ? "secondary" : "primary"}
            size="md"
            onClick={() => onStart(rank)}
            loading={loading}
            className="flex-shrink-0"
          >
            {isUnlocked ? "Retry" : "Start"}
            <ChevronRight className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

export default function ILMDetailPage({
  params,
}: {
  params: { skillId: string; ilmId: string };
}) {
  const { skillId, ilmId } = params;
  const router = useRouter();
  const profile = useUserStore((s) => s.profile);
  const initMission = useMissionStore((s) => s.initMission);
  const [startingRank, setStartingRank] = useState<Rank | null>(null);

  const { data: ilm, isLoading: ilmLoading } = useQuery({
    queryKey: ["ilm", ilmId],
    queryFn: () => fetchILM(ilmId),
  });

  const { data: rankProgress = [] } = useQuery<{ id: string; profile_id: string; ilm_id: string; rank: string; unlocked: boolean; best_score: number; attempts: number; unlocked_at: string | null }[]>({
    queryKey: ["rank-progress-detail", profile?.id, ilmId],
    queryFn: () => fetchRankProgress(profile!.id, ilmId),
    enabled: !!profile?.id,
  });

  const unlockedRanks = new Set(
    rankProgress.filter((r) => r.unlocked).map((r) => r.rank)
  );
  const progressByRank = Object.fromEntries(
    rankProgress.map((r) => [r.rank, r])
  );

  const startMissionMutation = useMutation({
    mutationFn: ({ rank }: { rank: Rank }) =>
      startMission(profile!.id, ilmId, rank),
    onSuccess: (missionId, { rank }) => {
      initMission(missionId, ilmId, rank);
      router.push(`/mission/${missionId}`);
    },
  });

  const handleStartRank = (rank: Rank) => {
    setStartingRank(rank);
    startMissionMutation.mutate({ rank });
  };

  // A rank is available if it's Cadet (always) or the previous rank is unlocked
  const isRankAvailable = (rank: Rank) => {
    const order = RANK_ORDER[rank];
    if (order === 0) return true;
    const prevRank = RANKS[order - 1];
    return unlockedRanks.has(prevRank);
  };

  if (ilmLoading) {
    return (
      <div className="py-8">
        <div className="h-8 w-32 skeleton rounded-lg mb-6" />
        <div className="h-32 skeleton rounded-2xl mb-8" />
        <div className="flex flex-col gap-4">
          {RANKS.map((r) => <div key={r} className="h-[88px] skeleton rounded-2xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="py-8">
      {/* Back */}
      <Link
        href={`/skills/${skillId}`}
        className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-neutral-400 font-manrope hover:text-blueberry-500 mb-6 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to Classes
      </Link>

      {/* ILM detail card */}
      {ilm && (
        <div
          className="rounded-3xl p-6 mb-8 elevation-3"
          style={{ background: "var(--surfaceELementWhite)" }}
        >
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-purple flex items-center justify-center flex-shrink-0">
              <Target className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[12px] font-semibold text-neutral-300 font-manrope uppercase tracking-wider">
                  {ilm.ilm_id}
                </span>
              </div>
              <h1 className="text-[24px] font-extrabold text-blueberry-alt-700 font-manrope leading-tight">
                {ilm.title}
              </h1>
              <p className="text-[15px] text-neutral-400 font-source-sans mt-1">
                {ilm.topic}
              </p>
              {ilm.learning_outcome && (
                <div className="mt-4 px-4 py-3 rounded-xl bg-blueberry-alt-50">
                  <p className="text-[13px] font-semibold text-blueberry-alt-700 font-manrope mb-1">
                    Learning Outcome
                  </p>
                  <p className="text-[14px] text-blueberry-alt-600 font-source-sans">
                    {ilm.learning_outcome}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Progress summary */}
          <div className="flex items-center gap-4 mt-5 pt-4 border-t border-neutral-100">
            {RANKS.map((rank) => (
              <div key={rank} className="flex flex-col items-center gap-1">
                <div
                  className={cn(
                    "w-3 h-3 rounded-full",
                    unlockedRanks.has(rank)
                      ? "bg-blueberry-500"
                      : isRankAvailable(rank)
                      ? "bg-sunshade-300"
                      : "bg-neutral-100"
                  )}
                />
                <span className="text-[10px] text-neutral-400 font-manrope">{rank[0]}</span>
              </div>
            ))}
            <span className="ml-auto text-[13px] font-semibold text-blueberry-alt-700 font-manrope">
              {unlockedRanks.size}/5 unlocked
            </span>
          </div>
        </div>
      )}

      {/* Ranks */}
      <div className="flex items-center gap-2 mb-4">
        <Sword className="w-5 h-5 text-blueberry-500" />
        <h2 className="text-[19px] font-bold text-blueberry-alt-700 font-manrope">
          Choose Your Rank
        </h2>
      </div>

      <div className="flex flex-col gap-3">
        {RANKS.map((rank) => (
          <RankCard
            key={rank}
            rank={rank}
            isUnlocked={unlockedRanks.has(rank)}
            isAvailable={isRankAvailable(rank)}
            bestScore={progressByRank[rank]?.best_score}
            attempts={progressByRank[rank]?.attempts}
            onStart={handleStartRank}
            loading={startMissionMutation.isPending && startingRank === rank}
          />
        ))}
      </div>

      {startMissionMutation.isError && (
        <div className="mt-4 px-4 py-3 rounded-xl bg-[#fff0ec] border border-[#ffd0c0] text-[14px] font-source-sans text-[#cc3300]">
          {startMissionMutation.error instanceof Error
            ? startMissionMutation.error.message
            : "Failed to start mission"}
        </div>
      )}
    </div>
  );
}
