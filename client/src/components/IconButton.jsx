import { cva } from 'class-variance-authority'
import { cn } from '@/lib/utils'
const iconButton = cva(
  'inline-flex shrink-0 cursor-pointer items-center justify-center rounded-md transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 aria-disabled:cursor-default aria-disabled:opacity-60',
  {
    variants: {
      variant: {
        plain: 'text-muted-foreground hover:bg-accent hover:text-foreground',
        header: 'h-8 w-8 text-muted-foreground hover:bg-accent hover:text-foreground',
        video: 'h-8 w-8 bg-secondary/90 text-secondary-foreground shadow-sm hover:bg-secondary',
      },
    },
    defaultVariants: { variant: 'plain' },
  },
)
export function IconButton({ label, variant, className, ...props }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(iconButton({ variant }), className)}
      {...props}
    />
  )
}
