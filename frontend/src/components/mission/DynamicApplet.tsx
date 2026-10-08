"use client";

import { useState } from "react";
import { CheckCircle2, XCircle, RefreshCw, ArrowRight, Unlock, Flame, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { AppletSpec } from "@/lib/stores/missionStore";

// ─── Design tokens matching FractionRevisionApplet reference ────────────────
const NAVY = {
  bg: "#0E1830",
  card: "#14213D",
  surface: "#1B2E50",
  border: "#22335A",
};

// One correct answer unlocks the rank — applet types other than misconception_drill
// have a single question per spec, so repeating isn't useful.
// misconception_drill manages its own queue and naturally requires more answers.
const STREAK_TARGET = 1;

// ─── Shared attempt result ───────────────────────────────────────────────────
type AttemptResult = { correct: boolean; message?: string };

// ─── Streak Badge ────────────────────────────────────────────────────────────
function StreakBadge({ streak, target }: { streak: number; target: number }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: target }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center text-[16px] transition-all duration-300",
            i < streak
              ? "bg-orange-400 scale-110 shadow-[0_0_12px_rgba(251,146,60,0.6)]"
              : "bg-white/10"
          )}
        >
          {i < streak ? "🔥" : "○"}
        </div>
      ))}
    </div>
  );
}

// ─── Feedback overlay ────────────────────────────────────────────────────────
function FeedbackRow({
  correct,
  message,
  onRetry,
}: {
  correct: boolean;
  message?: string;
  onRetry: () => void;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between p-4 rounded-2xl mt-4 animate-fade-in",
        correct
          ? "bg-green-900/40 border border-green-500/30"
          : "bg-red-900/40 border border-red-500/30"
      )}
    >
      <div className="flex items-center gap-3">
        {correct ? (
          <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
        ) : (
          <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
        )}
        <span className="text-[14px] font-semibold text-white font-manrope">
          {message ?? (correct ? "Correct!" : "Not quite — try again")}
        </span>
      </div>
      {!correct && (
        <button
          onClick={onRetry}
          className="flex items-center gap-1.5 text-[13px] font-semibold text-white/70 hover:text-white transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Retry
        </button>
      )}
    </div>
  );
}

// ─── ConceptMapper ───────────────────────────────────────────────────────────
interface ConceptMapperContent {
  concepts: { id: string; label: string }[];
  connections: { from: string; to: string; label?: string }[];
  question: string;
  target_concept: string;
}

function ConceptMapper({
  content,
  onAttempt,
}: {
  content: ConceptMapperContent;
  onAttempt: (r: AttemptResult) => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [result, setResult] = useState<AttemptResult | null>(null);

  const handleCheck = () => {
    const correct = selected === content.target_concept;
    const r: AttemptResult = {
      correct,
      message: correct
        ? "That's the right concept!"
        : "Hmm, that's not it — look at the connections again",
    };
    setResult(r);
    onAttempt(r);
  };

  const handleRetry = () => {
    setSelected(null);
    setResult(null);
  };

  return (
    <div className="flex flex-col gap-4">
      <p className="text-[15px] font-semibold text-white font-manrope">{content.question}</p>

      <div className="grid grid-cols-2 gap-3">
        {content.concepts.map((concept) => {
          const isSelected = selected === concept.id;
          const isCorrect = result?.correct && isSelected;
          const isWrong = result && !result.correct && isSelected;
          return (
            <button
              key={concept.id}
              onClick={() => !result && setSelected(concept.id)}
              disabled={!!result}
              className={cn(
                "p-3 rounded-xl border-2 text-[14px] font-semibold font-manrope text-center transition-all",
                isCorrect
                  ? "border-green-400 bg-green-900/40 text-green-300"
                  : isWrong
                  ? "border-red-400 bg-red-900/40 text-red-300"
                  : isSelected
                  ? "border-blue-400 bg-blue-900/40 text-white"
                  : "border-white/10 bg-white/5 text-white/60 hover:border-white/30 hover:bg-white/10"
              )}
            >
              {concept.label}
            </button>
          );
        })}
      </div>

      {content.connections.length > 0 && (
        <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1.5">
          <p className="text-[11px] font-semibold text-white/40 font-manrope uppercase tracking-wide">
            Connections
          </p>
          {content.connections.map((conn, i) => {
            const from = content.concepts.find((c) => c.id === conn.from)?.label;
            const to = content.concepts.find((c) => c.id === conn.to)?.label;
            return (
              <p key={i} className="text-[13px] font-source-sans text-white/60">
                <strong className="text-white/80">{from}</strong>
                {conn.label ? ` ${conn.label} ` : " → "}
                <strong className="text-white/80">{to}</strong>
              </p>
            );
          })}
        </div>
      )}

      {!result && (
        <button
          onClick={handleCheck}
          disabled={!selected}
          className={cn(
            "py-3 rounded-xl text-[14px] font-bold font-manrope transition-all",
            selected
              ? "bg-blue-500 hover:bg-blue-400 text-white"
              : "bg-white/10 text-white/30 cursor-not-allowed"
          )}
        >
          Check Answer
        </button>
      )}

      {result && (
        <FeedbackRow correct={result.correct} message={result.message} onRetry={handleRetry} />
      )}
    </div>
  );
}

// ─── StepSequencer ───────────────────────────────────────────────────────────
interface StepSequencerContent {
  steps: { id: string; text: string; correct_order: number }[];
  instruction: string;
}

function StepSequencer({
  content,
  onAttempt,
}: {
  content: StepSequencerContent;
  onAttempt: (r: AttemptResult) => void;
}) {
  const [order, setOrder] = useState(() => [...content.steps].sort(() => 0.5 - Math.random()));
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [result, setResult] = useState<AttemptResult | null>(null);

  const handleDrop = (i: number) => {
    if (dragIdx === null || dragIdx === i) return;
    const next = [...order];
    [next[dragIdx], next[i]] = [next[i], next[dragIdx]];
    setOrder(next);
    setDragIdx(null);
  };

  const handleCheck = () => {
    // Sort steps by correct_order to get the intended sequence, then compare against current display order
    const correctSequence = [...content.steps].sort((a, b) => a.correct_order - b.correct_order);
    const correct = order.every((step, i) => step.id === correctSequence[i].id);
    const r: AttemptResult = {
      correct,
      message: correct ? "Perfect order!" : "The sequence isn't quite right — try again",
    };
    setResult(r);
    onAttempt(r);
  };

  const handleRetry = () => {
    setOrder([...content.steps].sort(() => 0.5 - Math.random()));
    setResult(null);
  };

  return (
    <div className="flex flex-col gap-4">
      <p className="text-[15px] font-semibold text-white font-manrope">{content.instruction}</p>

      <div className="flex flex-col gap-2">
        {order.map((step, i) => (
          <div
            key={step.id}
            draggable={!result}
            onDragStart={() => setDragIdx(i)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(i)}
            className={cn(
              "flex items-center gap-3 p-4 rounded-xl border transition-all",
              result?.correct
                ? "border-green-500/40 bg-green-900/20"
                : result && !result.correct
                ? "border-red-500/40 bg-red-900/20"
                : "border-white/10 bg-white/5 hover:border-white/20 cursor-grab active:cursor-grabbing"
            )}
          >
            <span className="w-7 h-7 rounded-full bg-white/10 flex-shrink-0 flex items-center justify-center text-[12px] font-bold font-manrope text-white/60">
              {i + 1}
            </span>
            <span className="text-[14px] font-source-sans text-white/80 flex-1">{step.text}</span>
            {!result && (
              <svg className="w-4 h-4 text-white/20" fill="none" viewBox="0 0 16 16">
                <path
                  d="M4 5h8M4 8h8M4 11h8"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            )}
          </div>
        ))}
      </div>

      {!result && (
        <button
          onClick={handleCheck}
          className="py-3 rounded-xl text-[14px] font-bold font-manrope bg-blue-500 hover:bg-blue-400 text-white transition-all"
        >
          Check Order
        </button>
      )}

      {result && (
        <FeedbackRow correct={result.correct} message={result.message} onRetry={handleRetry} />
      )}
    </div>
  );
}

// ─── ScenarioSorter ──────────────────────────────────────────────────────────
interface ScenarioSorterContent {
  scenarios: { id: string; text: string; category: string }[];
  categories: { id: string; label: string }[];
  instruction: string;
}

function ScenarioSorter({
  content,
  onAttempt,
}: {
  content: ScenarioSorterContent;
  onAttempt: (r: AttemptResult) => void;
}) {
  const [assignments, setAssignments] = useState<Record<string, string>>({});
  const [result, setResult] = useState<AttemptResult | null>(null);

  const handleCheck = () => {
    const correct = content.scenarios.every((s) => assignments[s.id] === s.category);
    const r: AttemptResult = {
      correct,
      message: correct
        ? "All sorted correctly!"
        : "Some categories are wrong — review and try again",
    };
    setResult(r);
    onAttempt(r);
  };

  const handleRetry = () => {
    setAssignments({});
    setResult(null);
  };

  const allAssigned = content.scenarios.every((s) => assignments[s.id]);

  return (
    <div className="flex flex-col gap-4">
      <p className="text-[15px] font-semibold text-white font-manrope">{content.instruction}</p>

      <div className="flex flex-col gap-3">
        {content.scenarios.map((scenario) => (
          <div key={scenario.id} className="p-4 rounded-xl bg-white/5 border border-white/10">
            <p className="text-[13px] font-source-sans text-white/70 mb-3">{scenario.text}</p>
            <div className="flex flex-wrap gap-2">
              {content.categories.map((cat) => {
                const isSelected = assignments[scenario.id] === cat.id;
                const isCorrect = result?.correct && isSelected;
                const isWrong =
                  result && !result.correct && isSelected && cat.id !== scenario.category;
                return (
                  <button
                    key={cat.id}
                    onClick={() => !result && setAssignments((p) => ({ ...p, [scenario.id]: cat.id }))}
                    disabled={!!result}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-[12px] font-semibold font-manrope border transition-all",
                      isCorrect
                        ? "border-green-400 bg-green-900/40 text-green-300"
                        : isWrong
                        ? "border-red-400 bg-red-900/40 text-red-300"
                        : isSelected
                        ? "border-blue-400 bg-blue-900/40 text-white"
                        : "border-white/10 text-white/50 hover:border-white/30"
                    )}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {!result && (
        <button
          onClick={handleCheck}
          disabled={!allAssigned}
          className={cn(
            "py-3 rounded-xl text-[14px] font-bold font-manrope transition-all",
            allAssigned
              ? "bg-blue-500 hover:bg-blue-400 text-white"
              : "bg-white/10 text-white/30 cursor-not-allowed"
          )}
        >
          Check Answers
        </button>
      )}

      {result && (
        <FeedbackRow correct={result.correct} message={result.message} onRetry={handleRetry} />
      )}
    </div>
  );
}

// ─── FillTheGap ──────────────────────────────────────────────────────────────
interface FillTheGapContent {
  sentence_template: string;
  blanks: { id: string; correct_answer: string; hint?: string }[];
  options: string[];
}

function FillTheGap({
  content,
  onAttempt,
}: {
  content: FillTheGapContent;
  onAttempt: (r: AttemptResult) => void;
}) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<AttemptResult | null>(null);

  const handleCheck = () => {
    const correct = content.blanks.every(
      (b) => answers[b.id]?.toLowerCase().trim() === b.correct_answer.toLowerCase().trim()
    );
    const r: AttemptResult = {
      correct,
      message: correct ? "All blanks filled correctly!" : "Some answers are wrong — try again",
    };
    setResult(r);
    onAttempt(r);
  };

  const handleRetry = () => {
    setAnswers({});
    setResult(null);
  };

  const allFilled = content.blanks.every((b) => answers[b.id]);
  const parts = content.sentence_template.split("[BLANK]");
  let blankIndex = 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="p-5 rounded-2xl bg-white/5 border border-white/10 text-[16px] font-manrope font-semibold text-white leading-relaxed">
        {parts.map((part, i) => {
          if (i === parts.length - 1) return <span key={i}>{part}</span>;
          const blank = content.blanks[blankIndex++];
          const isCorrect =
            result?.correct &&
            answers[blank?.id]?.toLowerCase().trim() === blank?.correct_answer.toLowerCase().trim();
          const isWrong =
            result &&
            !isCorrect &&
            answers[blank?.id]?.toLowerCase().trim() !== blank?.correct_answer.toLowerCase().trim();
          return (
            <span key={i}>
              {part}
              <input
                type="text"
                value={answers[blank?.id] ?? ""}
                onChange={(e) =>
                  !result && setAnswers((prev) => ({ ...prev, [blank?.id]: e.target.value }))
                }
                disabled={!!result}
                placeholder={blank?.hint ?? "…"}
                className={cn(
                  "inline-block mx-1 px-2 py-0.5 rounded-lg border-2 text-[15px] font-source-sans text-center",
                  "min-w-[80px] max-w-[140px] focus:outline-none transition-all bg-transparent",
                  isCorrect
                    ? "border-green-400 text-green-300"
                    : isWrong
                    ? "border-red-400 text-red-300"
                    : "border-white/30 text-white focus:border-blue-400"
                )}
              />
            </span>
          );
        })}
      </div>

      {content.options?.length > 0 && (
        <div>
          <p className="text-[11px] font-semibold text-white/40 font-manrope uppercase tracking-wide mb-2">
            Word Bank
          </p>
          <div className="flex flex-wrap gap-2">
            {content.options.map((opt) => (
              <span
                key={opt}
                className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[13px] font-source-sans text-white/60"
              >
                {opt}
              </span>
            ))}
          </div>
        </div>
      )}

      {!result && (
        <button
          onClick={handleCheck}
          disabled={!allFilled}
          className={cn(
            "py-3 rounded-xl text-[14px] font-bold font-manrope transition-all",
            allFilled
              ? "bg-blue-500 hover:bg-blue-400 text-white"
              : "bg-white/10 text-white/30 cursor-not-allowed"
          )}
        >
          Check Answers
        </button>
      )}

      {result && (
        <FeedbackRow correct={result.correct} message={result.message} onRetry={handleRetry} />
      )}
    </div>
  );
}

// ─── MisconceptionDrill ───────────────────────────────────────────────────────
// Streak-based two-choice drill generated dynamically from Gemini.
// Manages its own question index and per-question feedback internally.
// Parent streak is updated via onAttempt; parent does NOT remount on wrong answer.

interface DrillQuestion {
  prompt: string;
  choices: { label: string; tag: string }[];
  answer: string;
  explanation: string;
}

interface MisconceptionDrillContent {
  misconception: string;
  topic: string;
  instruction: string;
  target: number;
  questions: DrillQuestion[];
}

function MisconceptionDrill({
  content,
  onAttempt,
}: {
  content: MisconceptionDrillContent;
  onAttempt: (r: AttemptResult) => void;
}) {
  const [qIndex, setQIndex] = useState(0);
  const [phase, setPhase] = useState<"pick" | "feedback">("pick");
  const [lastCorrect, setLastCorrect] = useState(false);
  const [lastExplanation, setLastExplanation] = useState("");

  const q = content.questions[qIndex % content.questions.length];

  function handleChoice(tag: string) {
    if (phase !== "pick") return;
    const correct = tag === q.answer;
    setLastCorrect(correct);
    setLastExplanation(q.explanation);
    setPhase("feedback");
    onAttempt({ correct, message: correct ? q.explanation : q.explanation });
  }

  function handleNext() {
    setQIndex((i) => i + 1);
    setPhase("pick");
  }

  function handleRetry() {
    setPhase("pick");
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Instruction */}
      <p className="text-[13px] font-source-sans" style={{ color: "#8FA0C4" }}>
        {content.instruction}
      </p>

      {/* Question card */}
      <div
        className="rounded-2xl p-5"
        style={{ background: NAVY.surface, border: `1px solid ${NAVY.border}` }}
      >
        <p className="text-[16px] font-bold font-manrope text-white leading-snug mb-5">
          {q.prompt}
        </p>

        <div className="flex flex-col gap-3">
          {q.choices.map((c) => {
            const isThisCorrect = c.tag === q.answer;
            const highlightCorrect = phase === "feedback" && isThisCorrect;
            const highlightWrong = phase === "feedback" && !lastCorrect && !isThisCorrect;

            return (
              <button
                key={c.tag}
                disabled={phase === "feedback"}
                onClick={() => handleChoice(c.tag)}
                className="flex items-start gap-3 rounded-xl px-4 py-3 text-left transition-all active:scale-[0.98]"
                style={{
                  background: highlightCorrect
                    ? "rgba(34,197,94,0.15)"
                    : highlightWrong
                    ? "rgba(239,68,68,0.10)"
                    : "rgba(255,255,255,0.05)",
                  border: `2px solid ${
                    highlightCorrect
                      ? "#22c55e"
                      : highlightWrong
                      ? "#ef4444"
                      : "rgba(255,255,255,0.1)"
                  }`,
                  cursor: phase === "feedback" ? "default" : "pointer",
                }}
              >
                <span
                  className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-[13px] font-bold font-manrope"
                  style={{
                    background: highlightCorrect
                      ? "#22c55e"
                      : highlightWrong
                      ? "#ef4444"
                      : "rgba(255,255,255,0.1)",
                    color: highlightCorrect || highlightWrong ? "#fff" : "rgba(255,255,255,0.5)",
                  }}
                >
                  {c.tag}
                </span>
                <span
                  className="text-[14px] font-source-sans leading-snug mt-0.5"
                  style={{
                    color: highlightCorrect
                      ? "#86efac"
                      : highlightWrong
                      ? "#fca5a5"
                      : "rgba(255,255,255,0.75)",
                  }}
                >
                  {c.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Feedback */}
      {phase === "feedback" && (
        <div
          className="rounded-xl px-4 py-3 animate-fade-in"
          style={{
            background: lastCorrect ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)",
            border: `1px solid ${lastCorrect ? "#22c55e44" : "#ef444444"}`,
          }}
        >
          <div className="flex items-center gap-2 mb-1">
            {lastCorrect ? (
              <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
            ) : (
              <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            )}
            <span className="text-[13px] font-bold font-manrope" style={{ color: lastCorrect ? "#86efac" : "#fca5a5" }}>
              {lastCorrect ? "Correct!" : "Not quite"}
            </span>
          </div>
          <p className="text-[13px] font-source-sans text-white/60 leading-snug">
            {lastExplanation}
          </p>
        </div>
      )}

      {/* Action buttons */}
      {phase === "feedback" && (
        <div className="flex gap-3">
          {!lastCorrect && (
            <button
              onClick={handleRetry}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[14px] font-semibold font-manrope transition-all"
              style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)" }}
            >
              <RotateCcw className="w-4 h-4" />
              Try again
            </button>
          )}
          <button
            onClick={handleNext}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[14px] font-bold font-manrope text-white transition-all active:scale-[0.98]"
            style={{
              background: lastCorrect
                ? "linear-gradient(135deg,#3B82F6,#8B5CF6)"
                : "rgba(255,255,255,0.08)",
            }}
          >
            Next question
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main DynamicApplet ──────────────────────────────────────────────────────

interface DynamicAppletProps {
  spec: AppletSpec;
  onComplete: () => void;
  completing: boolean;
}

export function DynamicApplet({ spec, onComplete, completing }: DynamicAppletProps) {
  const [streak, setStreak] = useState(0);
  const [unlocked, setUnlocked] = useState(false);
  const [attemptKey, setAttemptKey] = useState(0);

  const handleAttempt = (result: AttemptResult) => {
    if (result.correct) {
      const next = streak + 1;
      setStreak(next);
      if (next >= STREAK_TARGET) setUnlocked(true);
    } else {
      setStreak(0);
      // misconception_drill handles retry internally — no remount needed
      if (spec.type !== "misconception_drill") {
        setTimeout(() => setAttemptKey((k) => k + 1), 800);
      }
    }
  };

  const subProps = { onAttempt: handleAttempt };

  return (
    <div
      className="rounded-3xl overflow-hidden animate-slide-up"
      style={{
        background: `radial-gradient(ellipse at 30% 20%, ${NAVY.surface} 0%, ${NAVY.bg} 70%)`,
        border: `1px solid ${NAVY.border}`,
        boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-6 py-4 border-b"
        style={{ borderColor: NAVY.border }}
      >
        <div>
          <p className="text-[11px] font-semibold text-blue-400 font-manrope uppercase tracking-widest mb-0.5">
            AI-Generated Activity
          </p>
          <h3 className="text-[18px] font-extrabold text-white font-manrope leading-tight">
            {spec.title}
          </h3>
        </div>
        {spec.type === "misconception_drill" ? (
          <div
            className="flex items-center gap-2 border rounded-full px-4 py-2"
            style={{ backgroundColor: NAVY.bg, borderColor: NAVY.border }}
          >
            <Flame
              size={18}
              style={{ color: streak > 0 ? "#E8A33D" : "#5A6B8C" }}
            />
            <span className="font-manrope font-bold text-[15px] text-white">
              {streak}/{STREAK_TARGET}
            </span>
          </div>
        ) : (
          <StreakBadge streak={streak} target={STREAK_TARGET} />
        )}
      </div>

      {/* Description */}
      <div className="px-6 pt-4">
        <p className="text-[13px] text-white/50 font-source-sans">{spec.description}</p>
      </div>

      {/* Applet content card */}
      <div className="px-6 pt-4 pb-6">
        <div
          className="rounded-2xl p-5"
          style={{ background: NAVY.card, border: `1px solid ${NAVY.border}` }}
        >
          {spec.type === "concept_mapper" && (
            <ConceptMapper
              key={attemptKey}
              content={spec.content as unknown as ConceptMapperContent}
              {...subProps}
            />
          )}
          {spec.type === "step_sequencer" && (
            <StepSequencer
              key={attemptKey}
              content={spec.content as unknown as StepSequencerContent}
              {...subProps}
            />
          )}
          {spec.type === "scenario_sorter" && (
            <ScenarioSorter
              key={attemptKey}
              content={spec.content as unknown as ScenarioSorterContent}
              {...subProps}
            />
          )}
          {spec.type === "fill_the_gap" && (
            <FillTheGap
              key={attemptKey}
              content={spec.content as unknown as FillTheGapContent}
              {...subProps}
            />
          )}
          {spec.type === "misconception_drill" && (
            <MisconceptionDrill
              content={spec.content as unknown as MisconceptionDrillContent}
              onAttempt={handleAttempt}
            />
          )}
        </div>

        {/* Continue — locked until 2 consecutive correct */}
        <div className="mt-5">
          {unlocked ? (
            <button
              onClick={onComplete}
              disabled={completing}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-[16px] font-extrabold font-manrope text-white transition-all active:scale-[0.98]"
              style={{
                background: completing
                  ? "rgba(255,255,255,0.1)"
                  : "linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)",
                boxShadow: completing ? "none" : "0 8px 24px rgba(59,130,246,0.4)",
              }}
            >
              {completing ? "Saving…" : (
                <>
                  <ArrowRight className="w-5 h-5" />
                  Continue
                </>
              )}
            </button>
          ) : (
            <div
              className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl border"
              style={{ borderColor: NAVY.border, background: NAVY.surface }}
            >
              <Unlock className="w-4 h-4 text-white/30" />
              <span className="text-[14px] font-semibold font-manrope text-white/30">
                {streak === 0
                  ? `Get ${STREAK_TARGET} correct in a row to continue`
                  : `${STREAK_TARGET - streak} more correct to unlock`}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
