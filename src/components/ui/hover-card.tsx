import * as React from "react"
import { cn } from "@/lib/utils"

interface HoverCardProps extends React.HTMLAttributes<HTMLDivElement> {}

const HoverCard = React.forwardRef<HTMLDivElement, HoverCardProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={className} {...props} />
  )
)
HoverCard.displayName = "HoverCard"

const HoverCardTrigger = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={className} {...props} />
  )
)
HoverCardTrigger.displayName = "HoverCardTrigger"

const HoverCardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "z-50 w-64 rounded-md border bg-popover p-4 text-popover-foreground shadow-md",
      className,
    )}
    {...props}
  />
))
HoverCardContent.displayName = "HoverCardContent"

export { HoverCard, HoverCardTrigger, HoverCardContent }
