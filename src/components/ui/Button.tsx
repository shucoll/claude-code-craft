import { type ButtonHTMLAttributes, type ReactNode, forwardRef } from 'react'
import { cn } from '../../lib/cn'

type Variant = 'primary' | 'secondary' | 'destructive' | 'ghost'
type Size = 'sm' | 'md' | 'icon'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  leadingIcon?: ReactNode
  trailingIcon?: ReactNode
}

const base = cn(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap',
  'font-sans font-bold select-none cursor-pointer rounded-control',
  'transition-[transform,box-shadow,background-color] duration-150 ease-[var(--ease-out-soft)]',
  'disabled:pointer-events-none disabled:opacity-50',
)

const chunky = cn(
  'border-2 border-ink shadow-hard',
  'hover:shadow-hard-lg hover:-translate-x-px hover:-translate-y-px',
  'active:shadow-hard-sm active:translate-x-1 active:translate-y-1',
  'disabled:shadow-hard disabled:translate-x-0 disabled:translate-y-0',
)

const variants: Record<Variant, string> = {
  primary: cn(chunky, 'bg-primary text-primary-foreground hover:bg-primary-hover'),
  secondary: cn(chunky, 'bg-card text-card-foreground hover:bg-muted'),
  destructive: cn(chunky, 'bg-destructive text-destructive-foreground'),
  ghost: 'border-2 border-transparent bg-transparent text-foreground hover:bg-muted',
}

const sizes: Record<Size, string> = {
  sm: 'h-9 px-4 text-sm',
  md: 'h-11 px-5 text-base',
  icon: 'h-11 w-11 p-0',
}

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    </svg>
  )
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    loading = false,
    leadingIcon,
    trailingIcon,
    disabled,
    children,
    className,
    type = 'button',
    ...rest
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      data-variant={variant}
      data-size={size}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(base, variants[variant], sizes[size], className)}
      {...rest}
    >
      {loading ? <Spinner /> : leadingIcon}
      {children}
      {!loading && trailingIcon}
    </button>
  )
})
