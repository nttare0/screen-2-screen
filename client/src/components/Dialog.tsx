// Modified for Screen 2 Screen: the shared confirmation/error dialog on shadcn primitives.
import { useStore } from 'zustand'
import { useTranslation } from 'react-i18next'
import { InfoIcon, WarningIcon, XCircleIcon } from '@phosphor-icons/react'
import { useApp } from '@/state/provider'
import { Button } from '@/components/ui/button'
import { Dialog as Root, DialogContent, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

const ICON = { warning: WarningIcon, error: XCircleIcon, info: InfoIcon }

export function Dialog() {
  const { t } = useTranslation()
  const app = useApp()
  const d = useStore(app, (s) => s.dialog)
  const done = (ok: boolean) => {
    const resolve = app.getState().dialog?.resolve
    app.setState({ dialog: null })
    resolve?.(ok)
  }
  const Icon = d ? ICON[d.icon] : InfoIcon

  return (
    <Root open={d !== null} onOpenChange={(open) => !open && done(false)}>
      {d && (
        <DialogContent
          className="sm:max-w-md"
          data-testid="dialog"
          {...(d.text ? {} : { 'aria-describedby': undefined })}
        >
          <span
            className={cn(
              'flex size-11 items-center justify-center rounded-full',
              d.icon === 'error'
                ? 'bg-destructive/10 text-destructive'
                : d.icon === 'warning'
                  ? 'bg-warning/10 text-warning'
                  : 'bg-primary/10 text-primary',
            )}
          >
            <Icon className="size-5" />
          </span>
          <DialogTitle>{d.title}</DialogTitle>
          {d.text && <DialogDescription className="leading-6">{d.text}</DialogDescription>}
          <DialogFooter>
            {d.cancel && (
              <Button variant="outline" onClick={() => done(false)}>
                {t('context.confirm.button_cancel')}
              </Button>
            )}
            <Button data-testid="dialog-confirm" autoFocus onClick={() => done(true)}>
              {d.cancel ? t('context.confirm.button_yes') : t('connection.button_confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      )}
    </Root>
  )
}
