import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 glass-button shadow-sm",
  {
    variants: {
      variant: {
        default:
          "bg-primary/80 text-primary-foreground hover:bg-primary/90 border-primary/30",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 border-secondary/30",
        destructive:
          "bg-destructive/80 text-destructive-foreground hover:bg-destructive/90 border-destructive/30",
        outline: "text-foreground bg-transparent border-border",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
