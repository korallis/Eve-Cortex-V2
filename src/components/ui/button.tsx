'use client'

import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cortex-blue focus-visible:ring-offset-2 focus-visible:ring-offset-dark-primary disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default:
          'bg-cortex-blue text-white shadow-sm hover:bg-cortex-blue-dark hover:shadow-cortex',
        destructive: 'bg-error text-white shadow-sm hover:bg-error-dark',
        outline:
          'border-2 border-cortex-blue bg-transparent text-cortex-blue hover:bg-cortex-blue hover:text-white',
        secondary: 'bg-dark-secondary text-white shadow-sm hover:bg-dark-tertiary',
        ghost: 'text-white hover:bg-dark-secondary',
        link: 'text-cortex-blue underline-offset-4 hover:underline',
        gradient: 'bg-gradient-cortex text-white shadow-sm hover:shadow-cortex',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-12 rounded-lg px-8 text-base',
        xl: 'h-14 rounded-lg px-10 text-lg',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
