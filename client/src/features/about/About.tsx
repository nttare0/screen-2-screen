// Modified for Screen 2 Screen: product information and a concise keyboard guide.
import { useTranslation } from 'react-i18next'
import { GithubLogoIcon, KeyboardIcon } from '@phosphor-icons/react'
import { useApp } from '@/state/provider'
import { BrandMark, Wordmark } from '@/components/Brand'
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

export function About() {
  const { t } = useTranslation()
  const app = useApp()
  const close = () => app.setState({ about: false })
  return (
    <Dialog open onOpenChange={(open) => !open && close()}>
      <DialogContent className="sm:max-w-md" data-testid="about">
        <div className="flex items-center gap-2 text-primary">
          <BrandMark className="size-9" />
          <Wordmark className="text-foreground" />
        </div>
        <DialogTitle className="font-display text-xl">A better place to share a screen</DialogTitle>
        <DialogDescription className="leading-6">
          A self-hosted shared browser for watching, browsing, and working together in real time.
        </DialogDescription>
        <Separator />
        <div className="space-y-3 text-xs">
          <p className="flex items-center gap-2 font-medium">
            <KeyboardIcon className="size-4 text-primary" /> A few useful shortcuts
          </p>
          <div className="flex justify-between text-muted-foreground">
            <span>Send a chat message</span>
            <kbd className="rounded border bg-muted px-1.5 py-0.5 text-[10px]">Enter</kbd>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>New line in chat</span>
            <kbd className="rounded border bg-muted px-1.5 py-0.5 text-[10px]">Shift + Enter</kbd>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Open a member menu</span>
            <kbd className="rounded border bg-muted px-1.5 py-0.5 text-[10px]">Shift + F10</kbd>
          </div>
        </div>
        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span>Client {__APP_VERSION__}</span>
          <a
            className="flex items-center gap-1.5 hover:text-foreground"
            href="https://github.com/nttare0/screen-2-screen"
            target="_blank"
            rel="noopener noreferrer"
          >
            <GithubLogoIcon className="size-3.5" /> Source
          </a>
        </div>
        <DialogFooter>
          <Button data-testid="about-close" onClick={close}>
            {t('connection.button_confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
