// Modified for Screen 2 Screen: responsive workspace shell around the reused Neko features.
import { useStore } from 'zustand'
import { useShallow } from 'zustand/react/shallow'
import { WebRTCTransport } from '@m1k1o/neko'
import { useTranslation } from 'react-i18next'
import { useNeko } from '@/state/provider'
import { useSlot } from '@/plugins'
import { useMediaQuery } from '@/hooks/use-media-query'
import { BrandMark, Wordmark } from '@/components/Brand'
import { Dialog } from '@/components/Dialog'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { remember } from '@/state/storage'
import { Header } from '@/layout/Header'
import { NavigationRail } from '@/layout/NavigationRail'
import { Side } from '@/layout/Side'
import { RoomBar } from '@/layout/RoomBar'
import { Stage } from '@/features/video/Stage'
import { MemberMenu } from '@/features/members/MemberMenu'
import { Connect } from '@/features/connect/Connect'
import { About } from '@/features/about/About'
const params = new URL(location.href).searchParams
const cast = !!params.get('cast')
const videoOnly = cast || !!params.get('embed')
export function App() {
  const { t } = useTranslation()
  const { client, app } = useNeko()
  const connected = useStore(client.store, (s) => s.connection.status === 'connected')
  const { side, about } = useStore(
    app,
    useShallow((s) => ({ side: s.side, about: s.about })),
  )
  const memberMenu = useSlot('member.menu')
  const desktop = useMediaQuery('(min-width: 1100px)')
  if (!WebRTCTransport.supported()) {
    return (
      <div className="flex h-dvh items-center justify-center bg-background p-6">
        <div className="max-w-md space-y-5 rounded-2xl border bg-card p-8 text-center shadow-sm">
          <BrandMark className="mx-auto size-12 text-primary" />
          <Wordmark />
          <h1 className="font-display text-xl font-bold">A newer browser is needed</h1>
          <p className="text-sm leading-6 text-muted-foreground">{t('unsupported')}</p>
        </div>
      </div>
    )
  }
  if (videoOnly) {
    return (
      <div className="h-dvh bg-stage">
        <Stage hideControls={cast} extraControls />
      </div>
    )
  }
  const setSide = (open) => {
    app.setState({ side: open })
    remember('side', open)
  }
  return (
    <TooltipProvider delayDuration={250}>
      <div id="neko" className="flex h-dvh overflow-hidden bg-background text-foreground">
        <a
          href="#shared-screen"
          className="sr-only z-[100] rounded-md bg-primary px-4 py-2 text-primary-foreground focus:not-sr-only focus:absolute focus:top-3 focus:left-3"
        >
          Skip to shared screen
        </a>
        <NavigationRail />
        <div className="flex min-w-0 flex-1 flex-col">
          <Header />
          <main className="flex min-h-0 flex-1 gap-5 p-3 sm:p-4 lg:p-6" id="main-content">
            <section
              id="shared-screen"
              tabIndex={-1}
              aria-label="Shared screen"
              className="flex min-w-0 flex-1 flex-col gap-3 outline-none"
            >
              <Stage hideControls={false} extraControls={false} />
              <RoomBar />
            </section>
            {desktop && side && <Side />}
          </main>
        </div>
        {!desktop && connected && (
          <Sheet open={side} onOpenChange={setSide}>
            <SheetContent
              side="right"
              showCloseButton={false}
              className="w-[380px] max-w-[calc(100vw-1.25rem)] gap-0 p-0"
              onPointerDownOutside={(event) => event.preventDefault()}
              onInteractOutside={(event) => event.preventDefault()}
            >
              <SheetHeader className="sr-only">
                <SheetTitle>Room activity</SheetTitle>
                <SheetDescription>Chat, shared files, participants, and room settings.</SheetDescription>
              </SheetHeader>
              <Side inSheet />
            </SheetContent>
          </Sheet>
        )}
        <MemberMenu items={memberMenu} />
        <Toaster position="top-center" offset={{ top: 90 }} mobileOffset={{ top: 80 }} richColors closeButton />
        {about && <About />}
        <Dialog />
        {!connected && <Connect />}
      </div>
    </TooltipProvider>
  )
}
