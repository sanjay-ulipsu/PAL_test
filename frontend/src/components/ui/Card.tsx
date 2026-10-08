import * as React from "react";
import { cn } from "@/lib/utils/cn";

// Plain neumorphic card
const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { elevation?: 1 | 2 | 3 | 4 | 5 | 6 }
>(({ className, elevation = 3, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-2xl bg-gradient-element p-5",
      `elevation-${elevation}`,
      className
    )}
    {...props}
  />
));
Card.displayName = "Card";

// Card with gradient border
const GradientCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("gradient-card-border", className)}
    {...props}
  >
    <div className="p-5">{children}</div>
  </div>
));
GradientCard.displayName = "GradientCard";

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex flex-col gap-1 mb-4", className)} {...props} />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-[19px] font-bold leading-6 text-blueberry-alt-700 font-manrope",
      className
    )}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn(
      "text-[15px] leading-[18px] text-neutral-400 font-source-sans",
      className
    )}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("", className)} {...props} />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex items-center mt-4 gap-3", className)} {...props} />
));
CardFooter.displayName = "CardFooter";

export { Card, GradientCard, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
