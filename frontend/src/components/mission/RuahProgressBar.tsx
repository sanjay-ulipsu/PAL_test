"use client";

import { cn } from "@/lib/utils/cn";
import type { RuahBlock } from "@/lib/stores/missionStore";

interface RuahProgressBarProps {
  currentBlock: RuahBlock;
  ruCount: number;
  aCount: number;
  hCount: number;
  totalAnswered: number;
}

const BLOCK_LABELS: Record<RuahBlock, string> = {
  R: "Remember",
  U: "Understand",
  A: "Apply",
  H: "Higher Order",
};

const IDEAL = { RU: 2, A: 2, H: 6 };

export function RuahProgressBar({
  currentBlock,
  ruCount,
  aCount,
  hCount,
  totalAnswered,
}: RuahProgressBarProps) {
  const ruProgress = Math.min(ruCount / IDEAL.RU, 1);
  const aProgress = Math.min(aCount / IDEAL.A, 1);
  const hProgress = Math.min(hCount / IDEAL.H, 1);

  const segments = [
    {
      key: "RU",
      label: "R/U",
      fullLabel: "Remember/Understand",
      count: ruCount,
      ideal: IDEAL.RU,
      progress: ruProgress,
      active: currentBlock === "R" || currentBlock === "U",
      color: "#3a2cb8",
      bg: "#e0edff",
    },
    {
      key: "A",
      label: "A",
      fullLabel: "Apply",
      count: aCount,
      ideal: IDEAL.A,
      progress: aProgress,
      active: currentBlock === "A",
      color: "#ad7615",
      bg: "#fff3e0",
    },
    {
      key: "H",
      label: "H",
      fullLabel: "Higher Order",
      count: hCount,
      ideal: IDEAL.H,
      progress: hProgress,
      active: currentBlock === "H",
      color: "#a32881",
      bg: "#fce4ec",
    },
  ];

  return (
    <div
      className="rounded-2xl p-4 elevation-2"
      style={{ background: "var(--surfaceELementWhite)" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-semibold font-manrope text-neutral-500">
            RUAH Progress
          </span>
          <span className="px-2 py-0.5 rounded-full bg-blueberry-alt-50 text-blueberry-alt-700 text-[11px] font-bold font-manrope">
            {BLOCK_LABELS[currentBlock]}
          </span>
        </div>
        <span className="text-[13px] font-semibold font-manrope text-neutral-400">
          {Math.min(totalAnswered, 10)} / 10 Q
        </span>
      </div>

      {/* Progress bars */}
      <div className="flex items-end gap-2">
        {segments.map((seg) => (
          <div key={seg.key} className="flex-1 flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span
                className="text-[11px] font-bold font-manrope uppercase"
                style={{ color: seg.active ? seg.color : "#a9acb2" }}
              >
                {seg.label}
              </span>
              <span
                className="text-[11px] font-semibold font-source-sans"
                style={{ color: seg.active ? seg.color : "#a9acb2" }}
              >
                {seg.count}/{seg.ideal}
              </span>
            </div>
            <div
              className="h-2.5 rounded-full overflow-hidden"
              style={{ background: seg.bg }}
            >
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${seg.progress * 100}%`,
                  background: seg.color,
                  opacity: seg.active ? 1 : 0.4,
                }}
              />
            </div>
            {seg.active && (
              <div
                className="flex items-center gap-1 mt-0.5"
              >
                <div
                  className="w-1.5 h-1.5 rounded-full animate-pulse"
                  style={{ background: seg.color }}
                />
                <span
                  className="text-[10px] font-semibold font-manrope"
                  style={{ color: seg.color }}
                >
                  Active
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
