"use client";

import { useState } from "react";
import { CheckCircle2, XCircle, RotateCcw, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils/cn";
import type { Question, AnswerResult } from "@/lib/stores/missionStore";

interface QuestionCardProps {
  question: Question;
  result: AnswerResult | null;
  onSubmit: (answer: string | number | number[]) => void;
  onNext: () => void;
  submitting: boolean;
}

// ── RUAH phase label map ──────────────────────────────────────────────────────
const RUAH_COLORS: Record<string, { color: string; bg: string; label: string }> = {
  R: { color: "#3a2cb8", bg: "#e0edff", label: "Remember" },
  U: { color: "#4839cd", bg: "#e8f0ff", label: "Understand" },
  A: { color: "#ad7615", bg: "#fff3e0", label: "Apply" },
  H: { color: "#a32881", bg: "#fce4ec", label: "Higher Order" },
};

const SOURCE_ICON: Record<string, string> = {
  content_bank: "📚",
  rag_gemini: "🤖",
  fallback: "🔧",
};

// ── Option button (shared by mcq_3, true_false, scenario_set) ────────────────
function OptionButton({
  label,
  letter,
  selected,
  correct,
  wrong,
  disabled,
  onClick,
}: {
  label: string;
  letter: string;
  selected: boolean;
  correct: boolean;
  wrong: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "w-full text-left px-4 py-3.5 rounded-xl border-2 transition-all duration-150 text-[15px] font-source-sans elevation-1",
        correct
          ? "border-[#5dda5d] bg-[#e8f9e8] text-[#2a7a2a]"
          : wrong
          ? "border-[#ff7448] bg-[#fff0ec] text-[#cc3300]"
          : selected
          ? "border-blueberry-500 bg-blueberry-alt-50 text-blueberry-alt-700"
          : "border-transparent bg-white text-neutral-500 hover:border-blueberry-200 hover:bg-blueberry-alt-50/50"
      )}
    >
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-[13px] font-bold font-manrope border",
            correct
              ? "bg-[#5dda5d] border-[#5dda5d] text-white"
              : wrong
              ? "bg-[#ff7448] border-[#ff7448] text-white"
              : selected
              ? "bg-blueberry-500 border-blueberry-500 text-white"
              : "border-neutral-200 text-neutral-400"
          )}
        >
          {letter}
        </span>
        <span className="flex-1">{label}</span>
        {correct && <CheckCircle2 className="w-5 h-5 text-[#5dda5d] flex-shrink-0" />}
        {wrong && <XCircle className="w-5 h-5 text-[#ff7448] flex-shrink-0" />}
      </div>
    </button>
  );
}

export function QuestionCard({ question, result, onSubmit, onNext, submitting }: QuestionCardProps) {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [selectedMulti, setSelectedMulti] = useState<Set<number>>(new Set());
  const [fibTextAnswer, setFibTextAnswer] = useState("");
  const [fibWordAnswer, setFibWordAnswer] = useState<number | null>(null); // for option-based fib
  const [reorderItems, setReorderItems] = useState<string[]>(question.items ?? []);
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  const isAnswered = result !== null;
  const phase = RUAH_COLORS[question.ruah_phase] ?? RUAH_COLORS.R;

  // Is this a fib rendered as word-bank (options exist)?
  const isFibWordBank = question.type === "fib" && (question.options?.length ?? 0) > 0;

  const canSubmit = (): boolean => {
    if (isAnswered) return false;
    if (question.type === "mcq_3" || question.type === "true_false" || question.type === "scenario_set") {
      return selectedIdx !== null;
    }
    if (question.type === "mcq_multi_4") return selectedMulti.size > 0;
    if (question.type === "fib") {
      return isFibWordBank ? fibWordAnswer !== null : fibTextAnswer.trim().length > 0;
    }
    return true; // reorder is always submittable
  };

  const handleSubmit = () => {
    if (question.type === "mcq_3" || question.type === "true_false" || question.type === "scenario_set") {
      if (selectedIdx === null) return;
      onSubmit(selectedIdx);
    } else if (question.type === "mcq_multi_4") {
      if (selectedMulti.size === 0) return;
      onSubmit(Array.from(selectedMulti));
    } else if (question.type === "fib") {
      if (isFibWordBank) {
        if (fibWordAnswer === null) return;
        onSubmit(fibWordAnswer);
      } else {
        if (!fibTextAnswer.trim()) return;
        onSubmit(fibTextAnswer.trim());
      }
    } else if (question.type === "reorder") {
      // Submit current order as indices into the original items list
      onSubmit(reorderItems.map((item) => (question.items ?? []).indexOf(item)));
    }
  };

  const handleDragStart = (i: number) => setDragIdx(i);
  const handleDrop = (i: number) => {
    if (dragIdx === null || dragIdx === i) return;
    const next = [...reorderItems];
    [next[dragIdx], next[i]] = [next[i], next[dragIdx]];
    setReorderItems(next);
    setDragIdx(null);
  };

  return (
    <div
      className="rounded-3xl p-6 elevation-3 animate-slide-up"
      style={{ background: "var(--surfaceELementWhite)" }}
    >
      {/* Header: RUAH phase + source icon */}
      <div className="flex items-center gap-2 mb-4">
        <span
          className="px-2.5 py-1 rounded-full text-[12px] font-bold font-manrope uppercase tracking-wide"
          style={{ background: phase.bg, color: phase.color }}
        >
          {question.ruah_phase} — {phase.label}
        </span>
        <span className="text-[12px] text-neutral-300 font-source-sans ml-auto">
          {SOURCE_ICON[question.source] ?? "🔧"}
        </span>
      </div>

      {/* Scenario context banner (for expanded scenario_set questions) */}
      {question.context && (
        <div className="mb-4 p-4 rounded-xl bg-blueberry-alt-50 border-l-4 border-blueberry-500">
          <p className="text-[12px] font-bold font-manrope text-blueberry-alt-600 uppercase tracking-wide mb-1">
            Scenario
          </p>
          <p className="text-[14px] font-source-sans text-blueberry-alt-700 leading-relaxed">
            {question.context}
          </p>
        </div>
      )}

      {/* Question text */}
      <p className="text-[18px] font-semibold text-blueberry-alt-700 font-manrope leading-snug mb-6">
        {question.question}
      </p>

      {/* ── MCQ_3 / true_false / scenario_set ─────────────────────────────── */}
      {(question.type === "mcq_3" ||
        question.type === "true_false" ||
        question.type === "scenario_set") &&
        question.options && (
          <div className="flex flex-col gap-3">
            {question.type === "true_false" && (
              <p className="text-[13px] text-neutral-400 font-source-sans -mt-2 mb-1">
                Select True or False
              </p>
            )}
            {question.options.map((opt, i) => (
              <OptionButton
                key={i}
                label={opt}
                letter={["A", "B", "C", "D"][i]}
                selected={selectedIdx === i}
                correct={isAnswered && i === (question.answer_index as number)}
                wrong={isAnswered && i === selectedIdx && i !== (question.answer_index as number)}
                disabled={isAnswered}
                onClick={() => setSelectedIdx(i)}
              />
            ))}
          </div>
        )}

      {/* ── MCQ Multi-select ───────────────────────────────────────────────── */}
      {question.type === "mcq_multi_4" && question.options && (
        <div className="flex flex-col gap-3">
          <p className="text-[13px] text-neutral-400 font-source-sans -mt-2 mb-1">
            Select all that apply
          </p>
          {question.options.map((opt, i) => {
            const isCorrectOpt = isAnswered && (question.correct_indices ?? []).includes(i);
            const isSelected = selectedMulti.has(i);
            const isWrongSelected = isAnswered && isSelected && !isCorrectOpt;
            return (
              <button
                key={i}
                disabled={isAnswered}
                onClick={() => {
                  const next = new Set(selectedMulti);
                  next.has(i) ? next.delete(i) : next.add(i);
                  setSelectedMulti(next);
                }}
                className={cn(
                  "w-full text-left px-4 py-3.5 rounded-xl border-2 transition-all duration-150 text-[15px] font-source-sans elevation-1",
                  isCorrectOpt
                    ? "border-[#5dda5d] bg-[#e8f9e8] text-[#2a7a2a]"
                    : isWrongSelected
                    ? "border-[#ff7448] bg-[#fff0ec] text-[#cc3300]"
                    : isSelected
                    ? "border-blueberry-500 bg-blueberry-alt-50 text-blueberry-alt-700"
                    : "border-transparent bg-white text-neutral-500 hover:border-blueberry-200"
                )}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center",
                      isCorrectOpt
                        ? "bg-[#5dda5d] border-[#5dda5d]"
                        : isWrongSelected
                        ? "bg-[#ff7448] border-[#ff7448]"
                        : isSelected
                        ? "bg-blueberry-500 border-blueberry-500"
                        : "border-neutral-200"
                    )}
                  >
                    {(isSelected || isCorrectOpt) && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 12 12">
                        <path
                          d="M2 6l3 3 5-5"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </div>
                  <span className="flex-1">{opt}</span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* ── FIB — option word-bank (content bank format) ──────────────────── */}
      {isFibWordBank && (
        <div className="flex flex-col gap-4">
          {/* Sentence with blank placeholder */}
          <div className="p-4 rounded-xl bg-blueberry-alt-50 text-[16px] font-manrope font-semibold text-blueberry-alt-700 leading-relaxed">
            {question.question.split("________").map((part, i, arr) => {
              if (i === arr.length - 1) return <span key={i}>{part}</span>;
              const filled =
                fibWordAnswer !== null ? (question.options ?? [])[fibWordAnswer] : null;
              return (
                <span key={i}>
                  {part}
                  <span
                    className={cn(
                      "inline-block min-w-[100px] mx-1 px-3 py-0.5 rounded-lg border-2 text-center transition-all",
                      isAnswered && result?.is_correct
                        ? "border-[#5dda5d] bg-[#e8f9e8] text-[#2a7a2a]"
                        : isAnswered && !result?.is_correct
                        ? "border-[#ff7448] bg-[#fff0ec] text-[#cc3300]"
                        : filled
                        ? "border-blueberry-400 bg-white text-blueberry-alt-700"
                        : "border-dashed border-neutral-300 text-neutral-300"
                    )}
                  >
                    {filled ?? "______"}
                  </span>
                </span>
              );
            })}
          </div>

          {/* Word bank buttons */}
          <div>
            <p className="text-[12px] font-semibold text-neutral-400 font-manrope uppercase tracking-wide mb-2">
              Word Bank
            </p>
            <div className="flex flex-wrap gap-2">
              {(question.options ?? []).map((opt, i) => {
                const isSelected = fibWordAnswer === i;
                const isCorrect = isAnswered && i === (question.answer_index as number);
                const isWrong = isAnswered && isSelected && !isCorrect;
                return (
                  <button
                    key={i}
                    disabled={isAnswered}
                    onClick={() => setFibWordAnswer(i)}
                    className={cn(
                      "px-4 py-2 rounded-xl border-2 text-[14px] font-semibold font-manrope transition-all",
                      isCorrect
                        ? "border-[#5dda5d] bg-[#e8f9e8] text-[#2a7a2a]"
                        : isWrong
                        ? "border-[#ff7448] bg-[#fff0ec] text-[#cc3300]"
                        : isSelected
                        ? "border-blueberry-500 bg-blueberry-alt-50 text-blueberry-alt-700"
                        : "border-neutral-200 bg-white text-neutral-500 hover:border-blueberry-300 hover:bg-blueberry-alt-50/50"
                    )}
                  >
                    {opt}
                    {isCorrect && " ✓"}
                    {isWrong && " ✗"}
                  </button>
                );
              })}
            </div>
          </div>

          {isAnswered && !result?.is_correct && (
            <p className="text-[13px] font-source-sans text-[#cc3300]">
              Correct answer:{" "}
              <strong>{(question.options ?? [])[(question.answer_index as number) ?? 0]}</strong>
            </p>
          )}
        </div>
      )}

      {/* ── FIB — text input ──────────────────────────────────────────────── */}
      {question.type === "fib" && !isFibWordBank && (
        <div className="flex flex-col gap-3">
          <input
            type="text"
            value={fibTextAnswer}
            onChange={(e) => setFibTextAnswer(e.target.value)}
            disabled={isAnswered}
            placeholder="Type your answer here…"
            onKeyDown={(e) => e.key === "Enter" && canSubmit() && handleSubmit()}
            className={cn(
              "w-full h-[52px] px-4 rounded-xl border-2 text-[16px] font-source-sans text-neutral-500 bg-white focus:outline-none transition-all",
              isAnswered && result?.is_correct
                ? "border-[#5dda5d] bg-[#e8f9e8] text-[#2a7a2a]"
                : isAnswered && !result?.is_correct
                ? "border-[#ff7448] bg-[#fff0ec] text-[#cc3300]"
                : "border-neutral-100 focus:border-blueberry-300 focus:ring-2 focus:ring-blueberry-100"
            )}
            style={{ boxShadow: "var(--depth4)" }}
          />
          {isAnswered && !result?.is_correct && (
            <p className="text-[13px] font-source-sans text-[#cc3300]">
              Correct answer: <strong>{String(question.answer ?? result?.correct_answer ?? "")}</strong>
            </p>
          )}
        </div>
      )}

      {/* ── Reorder ───────────────────────────────────────────────────────── */}
      {question.type === "reorder" && (
        <div className="flex flex-col gap-2">
          <p className="text-[13px] text-neutral-400 font-source-sans -mt-2 mb-1">
            Drag items into the correct order
          </p>
          {reorderItems.map((item, i) => (
            <div
              key={item}
              draggable={!isAnswered}
              onDragStart={() => handleDragStart(i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(i)}
              className={cn(
                "flex items-center gap-3 px-4 py-3.5 rounded-xl bg-white border-2 border-neutral-100 elevation-1",
                "text-[15px] font-source-sans text-neutral-500 transition-all",
                !isAnswered && "cursor-grab active:cursor-grabbing hover:border-blueberry-200",
                isAnswered && result?.is_correct && "border-[#5dda5d] bg-[#e8f9e8]"
              )}
            >
              <span className="w-7 h-7 rounded-full bg-blueberry-alt-50 flex-shrink-0 flex items-center justify-center text-[13px] font-bold font-manrope text-blueberry-alt-700">
                {i + 1}
              </span>
              <span className="flex-1">{item}</span>
              {!isAnswered && (
                <svg className="w-4 h-4 text-neutral-300 flex-shrink-0" fill="none" viewBox="0 0 16 16">
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
          {isAnswered && result?.is_correct && (
            <p className="text-[13px] font-source-sans text-[#2a7a2a] font-semibold mt-1">
              Correct order confirmed ✓
            </p>
          )}
        </div>
      )}

      {/* ── Feedback panel ────────────────────────────────────────────────── */}
      {isAnswered && (
        <div
          className={cn(
            "mt-5 p-4 rounded-xl animate-fade-in",
            result.is_correct
              ? "bg-[#e8f9e8] border border-[#b8f0b8]"
              : "bg-[#fff0ec] border border-[#ffd0c0]"
          )}
        >
          <div className="flex items-center gap-2 mb-2">
            {result.is_correct ? (
              <CheckCircle2 className="w-5 h-5 text-[#5dda5d] flex-shrink-0" />
            ) : (
              <XCircle className="w-5 h-5 text-[#ff7448] flex-shrink-0" />
            )}
            <p
              className="text-[15px] font-bold font-manrope"
              style={{ color: result.is_correct ? "#2a7a2a" : "#cc3300" }}
            >
              {result.is_correct ? "Correct!" : "Not quite"}
            </p>
            {result.block_advanced && (
              <span className="ml-auto px-2 py-0.5 rounded-full bg-blueberry-500 text-white text-[11px] font-bold font-manrope">
                Block advanced ↑
              </span>
            )}
          </div>
          {!result.is_correct && (
            <div className="flex items-center gap-1 mb-2">
              <RotateCcw className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#cc3300" }} />
              <span className="text-[12px] font-source-sans" style={{ color: "#cc3300" }}>
                Same block will repeat until both answers are correct
              </span>
            </div>
          )}
          <p className="text-[14px] font-source-sans text-neutral-500">{result.explanation}</p>
        </div>
      )}

      {/* ── Action buttons ────────────────────────────────────────────────── */}
      <div className="flex justify-end mt-6 gap-3">
        {!isAnswered && (
          <Button
            variant="primary"
            size="lg"
            onClick={handleSubmit}
            disabled={!canSubmit()}
            loading={submitting}
          >
            Submit Answer
          </Button>
        )}
        {isAnswered && result?.mission_complete && (
          <Button variant="primary" size="lg" onClick={onNext}>
            See Results
            <ChevronRight className="w-5 h-5" />
          </Button>
        )}
        {isAnswered && !result?.mission_complete && !result?.applet_required && (
          <Button variant="purple" size="lg" onClick={onNext}>
            Next Question
            <ChevronRight className="w-5 h-5" />
          </Button>
        )}
      </div>
    </div>
  );
}
