// Modified for Screen 2 Screen: an accessible sign-in/reconnection flow with explicit preview mode.
import { useCallback, useEffect, useReducer, useState } from 'react'
import { useStore } from 'zustand'
import { useShallow } from 'zustand/react/shallow'
import { useTranslation } from 'react-i18next'
import {
  ArrowRightIcon,
  CircleNotchIcon,
  MonitorPlayIcon,
  ShieldCheckIcon,
  UsersThreeIcon,
  WifiSlashIcon,
} from '@phosphor-icons/react'
import { actions } from '@/state/actions'
import { useNeko } from '@/state/provider'
import { BrandMark, Wordmark } from '@/components/Brand'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
const params = new URL(location.href).searchParams
let invite = params.get('pwd')
export function Connect() {
  const { t } = useTranslation()
  const neko = useNeko()
  const { client } = neko
  const { status, authenticated } = useStore(
    client.store,
    useShallow((s) => ({ status: s.connection.status, authenticated: s.authenticated })),
  )
  const [oauth, setOauth] = useState({})
  const [unavailable, setUnavailable] = useState(false)
  const [displayname, setDisplayname] = useState(params.get('usr') || '')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [, settled] = useReducer((n) => n + 1, 0)
  const loginOnce = useCallback(
    async (user, secret) => {
      setBusy(true)
      setError('')
      try {
        await actions(neko).login(user, secret)
      } catch (err) {
        setError(err.message || 'Unable to join this room.')
      } finally {
        invite = null
        setBusy(false)
        settled()
      }
    },
    [neko],
  )
  useEffect(() => {
    client.api
      .req('GET', '/oauth/config')
      .then((config) => {
        setOauth(config)
        setUnavailable(false)
      })
      .catch(() => setUnavailable(true))
    if (invite !== null || params.has('usr') || params.has('token')) {
      const url = new URL(location.href)
      for (const k of ['pwd', 'usr', 'token']) url.searchParams.delete(k)
      history.replaceState(null, '', url)
    }
    if (invite && params.get('usr')) void loginOnce(params.get('usr'), invite)
  }, [neko, client, loginOnce])
  const login = (e) => {
    e.preventDefault()
    if (!displayname.trim()) return setError(t('connect.empty_displayname'))
    void loginOnce(displayname.trim(), invite ?? password)
  }
  const connecting = status === 'connecting' || busy
  const passwordLogin = oauth.password_login_enabled !== false
  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center overflow-y-auto bg-background/95 p-4 backdrop-blur-md sm:p-8"
      data-testid="connect"
    >
      <div className="grid w-full max-w-4xl overflow-hidden rounded-2xl border bg-card shadow-2xl md:grid-cols-[1.05fr_1fr]">
        <div className="relative hidden min-h-[540px] flex-col justify-between overflow-hidden border-r bg-sidebar p-9 md:flex">
          <div className="flex items-center gap-2.5 text-primary">
            <BrandMark className="size-9" />
            <Wordmark className="text-foreground" />
          </div>
          <div className="space-y-5">
            <Badge
              variant="outline"
              className="gap-1.5 rounded-full border-primary/20 bg-primary/8 px-2.5 py-1 text-[10px] text-accent-foreground"
            >
              <span className="size-1.5 rounded-full bg-primary" /> Your shared corner of the web
            </Badge>
            <h2 className="font-display text-[34px] leading-[1.18] font-extrabold tracking-tight">
              One screen.
              <br />
              Everyone in sync.
            </h2>
            <p className="max-w-xs text-sm leading-6 text-muted-foreground">
              Watch, browse, and build together in a shared browser. Pass the controls without missing a moment.
            </p>
            <div className="relative mt-7 rounded-xl border bg-card p-3 shadow-sm" aria-hidden="true">
              <div className="mb-3 flex gap-1.5">
                <span className="size-1.5 rounded-full bg-border" />
                <span className="size-1.5 rounded-full bg-border" />
                <span className="size-1.5 rounded-full bg-border" />
              </div>
              <div className="flex h-28 items-center justify-center rounded-lg bg-gradient-to-br from-primary/15 via-secondary to-primary/5">
                <span className="flex size-11 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
                  <MonitorPlayIcon className="size-5" />
                </span>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <span className="h-1.5 w-20 rounded-full bg-border" />
                <span className="ml-auto h-1.5 w-8 rounded-full bg-primary/40" />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <ShieldCheckIcon className="size-3.5" /> Self-hosted
            </span>
            <span className="flex items-center gap-1.5">
              <UsersThreeIcon className="size-3.5" /> Built together
            </span>
          </div>
        </div>
        <div className="flex min-h-[480px] flex-col justify-center p-7 sm:p-10">
          <div className="mb-8 flex items-center gap-2 text-primary md:hidden">
            <BrandMark className="size-8" />
            <Wordmark className="text-foreground" />
          </div>
          {connecting ? (
            <div className="space-y-4 text-center" role="status">
              <CircleNotchIcon className="mx-auto size-9 animate-spin text-primary" />
              <h2 className="font-display text-xl font-bold">Connecting to your room</h2>
              <p className="text-sm text-muted-foreground">Getting the shared screen ready…</p>
            </div>
          ) : authenticated ? (
            <div className="space-y-5">
              <div className="space-y-2">
                <h2 className="font-display text-2xl font-bold tracking-tight">Reconnect to the room</h2>
                <p className="text-sm leading-6 text-muted-foreground">
                  Your session is still available. Reconnect to pick up where you left off.
                </p>
              </div>
              <Alert>
                <WifiSlashIcon className="size-4" />
                <AlertTitle>{t('connection.disconnected')}</AlertTitle>
                <AlertDescription>The shared screen is not currently connected.</AlertDescription>
              </Alert>
              <Button className="w-full" data-testid="reconnect" onClick={() => client.connect()}>
                {t('connect.connect')} <ArrowRightIcon className="size-4" />
              </Button>
              <Button variant="ghost" className="w-full" onClick={actions(neko).logout}>
                {t('logout')}
              </Button>
            </div>
          ) : (
            <form className="space-y-5" onSubmit={login}>
              <div className="space-y-2">
                <h2 className="font-display text-2xl font-bold tracking-tight">
                  {invite !== null ? t('connect.invitation_title') : 'Join the room'}
                </h2>
                <p className="text-sm leading-6 text-muted-foreground">
                  Enter your details to join the shared browser session.
                </p>
              </div>
              {unavailable && (
                <Alert>
                  <WifiSlashIcon className="size-4" />
                  <AlertTitle>No server reachable</AlertTitle>
                  <AlertDescription>Start the Neko backend and reload.</AlertDescription>
                </Alert>
              )}
              {passwordLogin && (
                <div className="space-y-2">
                  <Label htmlFor="display-name" className="text-xs">
                    {t('connect.displayname')}
                  </Label>
                  <Input
                    id="display-name"
                    className="h-11"
                    autoComplete="nickname"
                    placeholder="e.g. Alex Morgan"
                    value={displayname}
                    onChange={(e) => setDisplayname(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
              )}
              {passwordLogin && invite === null && (
                <div className="space-y-2">
                  <Label htmlFor="room-password" className="text-xs">
                    {t('connect.password')}
                  </Label>
                  <Input
                    id="room-password"
                    className="h-11"
                    type="password"
                    autoComplete="current-password"
                    placeholder="Enter the room password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              )}
              {error && (
                <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-xs leading-5 text-destructive">
                  {error}
                </p>
              )}
              {passwordLogin && (
                <Button className="h-11 w-full gap-2" type="submit">
                  {t('connect.connect')} <ArrowRightIcon className="size-4" />
                </Button>
              )}
              {oauth.enabled && invite === null && (
                <Button
                  variant="outline"
                  className="h-11 w-full"
                  type="button"
                  onClick={() => oauth.login_url && location.assign(oauth.login_url)}
                >
                  Continue with {oauth.name || 'OAuth'}
                </Button>
              )}
              <p className="text-center text-[10px] leading-5 text-muted-foreground">
                By joining, you share your display name with other people in this room.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
