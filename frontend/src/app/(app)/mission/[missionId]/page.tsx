"use client";

import { useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useMutation } from "@tanstack/react-query";
import { ChevronLeft, Trophy, Star, Sparkles } from "lucide-react";
import { useMissionStore } from "@/lib/stores/missionStore";
import { useUserStore } from "@/lib/stores/userStore";
import { apiClient } from "@/lib/api/client";
import { mockSupabase } from "@/lib/mock/supabase";
import { RuahProgressBar } from "@/components/mission/RuahProgressBar";
import { QuestionCard } from "@/components/mission/QuestionCard";
import { DynamicApplet } from "@/components/mission/DynamicApplet";
import { Button } from "@/components/ui/Button";
import type { Question, AnswerResult, AppletSpec } from "@/lib/stores/missionStore";

// ────────────────────────────────────────────────────────────
// API helpers
// ────────────────────────────────────────────────────────────

async function fetchNextQuestion(missionId: string): Promise<Question> {
  return apiClient.post<Question>(`/api/v1/missions/${missionId}/question`);
}

async function submitAnswer(
  missionId: string,
  questionId: string,
  answer: string | number | number[]
): Promise<AnswerResult & { ruah_state: { block: string; ru: number; a: number; h: number; total: number; score: number; ideal: boolean } }> {
  return apiClient.post(`/api/v1/missions/${missionId}/answer`, { question_id: questionId, answer });
}

async function generateApplet(missionId: string): Promise<AppletSpec> {
  return apiClient.post<AppletSpec>(`/api/v1/missions/${missionId}/applet/generate`);
}

async function completeApplet(missionId: string): Promise<void> {
  await apiClient.post(`/api/v1/missions/${missionId}/applet/complete`);
}

// ────────────────────────────────────────────────────────────
// Mission complete screen
// ────────────────────────────────────────────────────────────

function MissionComplete({
  rank,
  score,
  ilmId,
  skillId,
}: {
  rank: string;
  score: number;
  ilmId: string;
  skillId?: string;
}) {
  return (
    <div className="flex flex-col items-center py-12 text-center gap-6 animate-slide-up">
      <div className="w-24 h-24 rounded-3xl bg-gradient-gold elevation-6 flex items-center justify-center">
        <Trophy className="w-12 h-12 text-white" />
      </div>

      <div>
        <p className="text-[13px] font-semibold text-sunshade-600 font-manrope uppercase tracking-wider mb-1">
          Rank Unlocked
        </p>
        <h2 className="text-[36px] font-extrabold text-blueberry-alt-700 font-manrope leading-none">
          {rank}
        </h2>
      </div>

      <div className="flex items-center gap-2">
        <Star className="w-6 h-6 text-sunshade-500 fill-sunshade-500" />
        <span className="text-[22px] font-bold text-blueberry-alt-700 font-manrope">
          {score}%
        </span>
      </div>

      <div
        className="w-full max-w-[320px] rounded-2xl p-5 elevation-3"
        style={{ background: "var(--surfaceELementWhite)" }}
      >
        <p className="text-[15px] font-source-sans text-neutral-500">
          You&apos;ve completed the <strong className="text-blueberry-alt-700">{rank}</strong> rank.
          Keep going to unlock the next challenge!
        </p>
      </div>

      <div className="flex gap-3">
        {skillId && (
          <Button variant="secondary" size="md" asChild>
            <Link href={`/skills/${skillId}`}>Back to Classes</Link>
          </Button>
        )}
        <Button variant="primary" size="lg" asChild>
          <Link href="/">Home</Link>
        </Button>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Main page
// ────────────────────────────────────────────────────────────

export default function MissionPage({
  params,
}: {
  params: { missionId: string };
}) {
  const { missionId } = params;
  const router = useRouter();
  const profile = useUserStore((s) => s.profile);

  const {
    phase,
    currentBlock,
    ruCount,
    aCount,
    hCount,
    totalAnswered,
    score,
    currentQuestion,
    lastAnswerResult,
    appletSpec,
    rank,
    ilmId,
    setCurrentQuestion,
    setAnswerResult,
    setAppletSpec,
    setAppletCompleted,
    setPhase,
  } = useMissionStore();

  // ── Fetch first question on mount ──
  const fetchQuestionMutation = useMutation({
    mutationFn: () => fetchNextQuestion(missionId),
    onSuccess: (q) => setCurrentQuestion(q),
  });

  const submitAnswerMutation = useMutation({
    mutationFn: ({ questionId, answer }: { questionId: string; answer: string | number | number[] }) =>
      submitAnswer(missionId, questionId, answer),
    onSuccess: (data) => {
      const { ruah_state, ...result } = data;
      setAnswerResult(
        result as AnswerResult,
        ruah_state.block as "R" | "U" | "A" | "H",
        ruah_state.ru,
        ruah_state.a,
        ruah_state.h,
        ruah_state.total,
        ruah_state.score,
        ruah_state.ideal
      );
      if (data.applet_required) {
        generateAppletMutation.mutate();
      }
    },
  });

  const generateAppletMutation = useMutation({
    mutationFn: () => generateApplet(missionId),
    onSuccess: (spec) => setAppletSpec(spec),
  });

  const completeAppletMutation = useMutation({
    mutationFn: () => completeApplet(missionId),
    onSuccess: () => setAppletCompleted(),
  });

  useEffect(() => {
    if (phase === "question" && !currentQuestion) {
      fetchQuestionMutation.mutate();
    }
  }, [phase, currentQuestion]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmitAnswer = useCallback(
    (answer: string | number | number[]) => {
      if (!currentQuestion) return;
      submitAnswerMutation.mutate({ questionId: currentQuestion.id, answer });
    },
    [currentQuestion, submitAnswerMutation]
  );

  const handleNext = useCallback(() => {
    if (lastAnswerResult?.mission_complete) {
      if (lastAnswerResult.applet_required) {
        // Applet generation was started in background when answer was submitted.
        // Switch to applet phase — the applet UI shows a loading state until the spec arrives.
        setPhase("applet");
      } else {
        setPhase("complete");
      }
    } else {
      fetchQuestionMutation.mutate();
    }
  }, [lastAnswerResult, fetchQuestionMutation, setPhase]);

  const handleAppletComplete = useCallback(() => {
    completeAppletMutation.mutate();
  }, [completeAppletMutation]);

  // ── Persist rank unlock when mission completes ──
  useEffect(() => {
    if (phase !== "complete" || !profile?.id || !ilmId || !rank) return;

    const save = async () => {
      const { data: existing } = await mockSupabase
        .from("rank_progress")
        .select("attempts, best_score, unlocked, unlocked_at")
        .eq("profile_id", profile.id)
        .eq("ilm_id", ilmId)
        .eq("rank", rank)
        .maybeSingle() as { data: { attempts: number; best_score: number; unlocked: boolean; unlocked_at: string | null } | null };

      await (mockSupabase.from("rank_progress") as any).upsert(
        {
          profile_id: profile.id,
          ilm_id: ilmId,
          rank,
          unlocked: true,
          best_score: Math.max(existing?.best_score ?? 0, score),
          attempts: (existing?.attempts ?? 0) + 1,
          unlocked_at: existing?.unlocked_at ?? new Date().toISOString(),
        },
        { onConflict: "profile_id,ilm_id,rank" }
      );
    };

    save();
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  const isLoading = fetchQuestionMutation.isPending && !currentQuestion;

  return (
    <div className="py-8 max-w-[720px] mx-auto">
      {/* Back + rank header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-lg text-neutral-400 hover:text-blueberry-500 hover:bg-blueberry-alt-50 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <p className="text-[12px] font-semibold text-neutral-400 font-manrope uppercase tracking-wide">
            Mission
          </p>
          <p className="text-[17px] font-bold text-blueberry-alt-700 font-manrope leading-none">
            {rank ?? "—"}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Star className="w-4 h-4 text-sunshade-500" />
          <span className="text-[15px] font-bold font-manrope text-blueberry-alt-700">{score}%</span>
        </div>
      </div>

      {/* RUAH progress */}
      {phase !== "complete" && phase !== "idle" && (
        <div className="mb-5">
          <RuahProgressBar
            currentBlock={currentBlock}
            ruCount={ruCount}
            aCount={aCount}
            hCount={hCount}
            totalAnswered={totalAnswered}
          />
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="h-[280px] skeleton rounded-3xl" />
      )}

      {/* Question */}
      {(phase === "question" || phase === "feedback") && currentQuestion && (
        <QuestionCard
          key={currentQuestion.id}
          question={currentQuestion}
          result={phase === "feedback" ? lastAnswerResult : null}
          onSubmit={handleSubmitAnswer}
          onNext={handleNext}
          submitting={submitAnswerMutation.isPending}
        />
      )}

      {/* Applet (F9) */}
      {phase === "applet" && (
        <div>
          {generateAppletMutation.isPending || !appletSpec ? (
            <div
              className="rounded-3xl p-8 elevation-3 text-center animate-fade-in"
              style={{ background: "var(--surfaceELementWhite)" }}
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-gold flex items-center justify-center mx-auto mb-4 animate-pulse">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <p className="text-[17px] font-bold text-blueberry-alt-700 font-manrope mb-1">
                Generating your activity…
              </p>
              <p className="text-[14px] text-neutral-400 font-source-sans">
                AI is crafting a personalised exercise based on your progress
              </p>
            </div>
          ) : (
            <DynamicApplet
              spec={appletSpec}
              onComplete={handleAppletComplete}
              completing={completeAppletMutation.isPending}
            />
          )}
        </div>
      )}

      {/* Complete */}
      {phase === "complete" && rank && (
        <MissionComplete rank={rank} score={score} ilmId={ilmId ?? ""} />
      )}

      {/* Errors */}
      {(fetchQuestionMutation.isError ||
        submitAnswerMutation.isError ||
        generateAppletMutation.isError) && (
        <div className="mt-4 px-4 py-3 rounded-xl bg-[#fff0ec] border border-[#ffd0c0] text-[14px] font-source-sans text-[#cc3300]">
          {fetchQuestionMutation.error?.message ??
            submitAnswerMutation.error?.message ??
            generateAppletMutation.error?.message ??
            "Something went wrong"}
          <button
            className="ml-3 underline font-semibold"
            onClick={() => fetchQuestionMutation.mutate()}
          >
            Retry
          </button>
        </div>
      )}
    </div>
  );
}
