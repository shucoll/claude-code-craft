import { type HTMLAttributes, forwardRef } from 'react'
import { cn } from '../../lib/cn'

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  interactive?: boolean
}

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { interactive = false, className, children, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn(
        'bg-card text-card-foreground border-2 border-ink rounded-card shadow-hard p-5',
        interactive &&
          cn(
            'cursor-pointer transition-[transform,box-shadow] duration-150 ease-[var(--ease-out-soft)]',
            'hover:shadow-hard-lg hover:-translate-x-px hover:-translate-y-px',
          ),
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  )
})
