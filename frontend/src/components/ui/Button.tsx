"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[8px] font-manrope font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blueberry-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        // Gold primary (CTA)
        primary:
          "bg-gradient-gold border border-[#fbdba9] text-white shadow-gold-glow hover:opacity-90",
        // Purple primary
        purple:
          "bg-blueberry-500 text-white shadow-purple-glow hover:bg-blueberry-600",
        // Secondary (outlined gold)
        secondary:
          "bg-white border border-[#f6bc54cc] text-sunshade-500 shadow-elevation2 hover:bg-sunshade-50",
        // Ghost (no bg)
        ghost:
          "bg-transparent text-neutral-500 hover:bg-neutral-100/60 hover:text-neutral-700",
        // Danger
        danger:
          "bg-[#fff7f5] border border-[#fd8f70] text-[#ff5a48] shadow-[0px_1px_2px_0px_#ff704844]",
        // Neumorphic
        neo: "bg-gradient-element text-neutral-500 shadow-elevation3 hover:shadow-elevation4",
        // Link
        link: "bg-transparent text-blueberry-500 underline-offset-4 hover:underline p-0 h-auto",
      },
      size: {
        sm: "h-[38px] px-5 text-[14px] rounded-[6px]",
        md: "h-[44px] px-6 text-[15px]",
        lg: "h-[48px] px-8 text-[17px]",
        icon: "h-10 w-10",
        "icon-sm": "h-8 w-8",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "lg",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            {children}
          </span>
        ) : (
          children
        )}
      </Comp>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
