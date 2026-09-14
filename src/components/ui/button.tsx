import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/btn relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive hover:scale-[1.03] active:scale-[0.97] disabled:hover:scale-100",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90 hover:shadow-md",
        destructive:
          "bg-destructive text-white shadow-xs hover:bg-destructive/90 hover:shadow-md focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground hover:shadow-md dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80 hover:shadow-md",
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline hover:scale-100 active:scale-100",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

/** Dual-ring spinner that inherits the button's text colour. */
function ButtonSpinner() {
  return (
    <span className="relative inline-block size-4" aria-hidden="true">
      <span className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-current" />
      <span className="absolute inset-0.75 animate-[spin_.6s_linear_infinite_reverse] rounded-full border-2 border-transparent border-b-current opacity-60" />
    </span>
  )
}

type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
    /** Trailing icon that slides into view on hover. Ignored when `asChild`. */
    icon?: React.ReactNode
    /** Swap the label for `loadingText` (or keep it) and append a spinner. Ignored when `asChild`. */
    isLoading?: boolean
    loadingText?: React.ReactNode
  }

function Button({
  className,
  variant,
  size,
  asChild = false,
  icon,
  isLoading = false,
  loadingText,
  children,
  disabled,
  ...props
}: ButtonProps) {
  // `asChild` renders through Radix Slot, which requires a single child — pass
  // it straight through and skip the icon / loading affordances.
  if (asChild) {
    return (
      <Slot
        data-slot="button"
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      >
        {children}
      </Slot>
    )
  }

  return (
    <button
      data-slot="button"
      disabled={disabled || isLoading}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    >
      {isLoading ? (
        <>
          {loadingText ?? children}
          <ButtonSpinner />
        </>
      ) : (
        <>
          {children}
          {icon != null && (
            // `-ml-2` cancels the base `gap-2` so the collapsed icon takes no space.
            <span className="-ml-2 inline-flex w-0 overflow-hidden transition-[width,margin] duration-300 ease-out group-hover/btn:ml-1.5 group-hover/btn:w-4">
              <span className="inline-flex shrink-0 -translate-x-4 transition-transform duration-300 ease-out group-hover/btn:translate-x-0">
                {icon}
              </span>
            </span>
          )}
        </>
      )}
    </button>
  )
}

export { Button, buttonVariants }
