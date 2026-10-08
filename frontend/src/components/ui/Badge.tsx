import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-[12px] font-semibold font-manrope transition-colors",
  {
    variants: {
      variant: {
        default: "bg-blueberry-alt-50 text-blueberry-alt-700 border border-blueberry-alt-100",
        purple: "bg-blueberry-500 text-white",
        gold: "bg-sunshade-50 text-sunshade-700 border border-sunshade-100",
        success: "bg-[#e8f9e8] text-[#2a8a2a]",
        danger: "bg-[#fff0ec] text-[#cc3300]",
        pink: "bg-[#fce4f4] text-[#a32881]",
        // RUAH phase badges
        "ruah-r": "bg-[#e0edff] text-blueberry-alt-700",
        "ruah-u": "bg-[#e8f0ff] text-blueberry-alt-600",
        "ruah-a": "bg-[#fff3e0] text-sunshade-700",
        "ruah-h": "bg-[#fce4ec] text-p-rose-700",
        // Rank badges
        "rank-cadet": "bg-blueberry-alt-50 text-blueberry-alt-700",
        "rank-agent": "bg-sunshade-50 text-sunshade-700",
        "rank-specialist": "bg-[#fce4f4] text-p-rose-700",
        "rank-operator": "bg-[#e8f9e8] text-[#2a8a2a]",
        "rank-commander": "bg-gradient-gold text-white",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
