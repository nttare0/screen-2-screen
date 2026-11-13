// Modified for Screen 2 Screen: a point-anchored Radix menu with shadcn surface tokens.
import { useRef, type ComponentProps, type ReactNode } from 'react'
import * as MenuPrimitive from '@radix-ui/react-menu'
import { cn } from '@/lib/utils'

function ContextMenu({
  x,
  y,
  open,
  onOpenChange,
  children,
}: {
  x: number
  y: number
  open: boolean
  onOpenChange: (open: boolean) => void
  children: ReactNode
}) {
  const anchor = useRef({ getBoundingClientRect: () => DOMRect.fromRect({ x, y }) })
  anchor.current.getBoundingClientRect = () => DOMRect.fromRect({ x, y })
  return (
    <MenuPrimitive.Root open={open} onOpenChange={onOpenChange} modal={false}>
      <MenuPrimitive.Anchor virtualRef={anchor} />
      {children}
    </MenuPrimitive.Root>
  )
}

function ContextMenuContent({ className, ...props }: ComponentProps<typeof MenuPrimitive.Content>) {
  return (
    <MenuPrimitive.Portal>
      <MenuPrimitive.Content
        data-slot="context-menu-content"
        side="right"
        align="start"
        className={cn(
          'z-50 max-h-[calc(100vh-3rem)] min-w-48 overflow-y-auto rounded-lg border bg-popover p-1 text-popover-foreground shadow-lg outline-none',
          className,
        )}
        {...props}
      />
    </MenuPrimitive.Portal>
  )
}

function ContextMenuItem({ className, ...props }: ComponentProps<typeof MenuPrimitive.Item>) {
  return (
    <MenuPrimitive.Item
      data-slot="context-menu-item"
      className={cn(
        'relative flex cursor-default items-center gap-2 rounded-md px-2 py-2 text-sm outline-none select-none data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        className,
      )}
      {...props}
    />
  )
}

function ContextMenuLabel({ className, ...props }: ComponentProps<typeof MenuPrimitive.Label>) {
  return (
    <MenuPrimitive.Label
      data-slot="context-menu-label"
      className={cn('flex items-center gap-2 px-2 py-2 text-sm font-medium', className)}
      {...props}
    />
  )
}

function ContextMenuSeparator({ className, ...props }: ComponentProps<typeof MenuPrimitive.Separator>) {
  return (
    <MenuPrimitive.Separator
      data-slot="context-menu-separator"
      className={cn('-mx-1 my-1 h-px bg-border', className)}
      {...props}
    />
  )
}

export { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuLabel, ContextMenuSeparator }
