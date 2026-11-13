// Modified for Screen 2 Screen: explicit preview composition and the production Neko connection.
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { initI18n } from './i18n'
import { plugins, initPlugins } from './plugins'
import { createNekoApp } from './state/neko'
import { NekoProvider } from './state/provider'
import { ThemeProvider } from './hooks/use-theme'
import { App } from './app/App'
import { ErrorBoundary } from './app/ErrorBoundary'

async function boot() {
  const params = new URL(location.href).searchParams
  const demo = params.get('demo') === '1' || import.meta.env.VITE_DEMO === 'true'
  const ready = initI18n(plugins.map((p) => p.ns))
  const neko = demo ? (await import('./demo')).createDemoApp() : createNekoApp()
  initPlugins(neko)
  await ready
  neko.client.setUrl(location.href)
  // Credentials are consumed once (by the core or the sign-in form) and must not linger in the address bar.
  const clean = new URL(location.href)
  for (const key of ['pwd', 'usr', 'token', 'password', 'displayname']) clean.searchParams.delete(key)
  if (clean.href !== location.href) history.replaceState(null, '', clean)
  document.title = demo ? 'Screen 2 Screen — Interactive preview' : 'Screen 2 Screen'
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <ErrorBoundary>
        <ThemeProvider>
          <NekoProvider neko={neko}>
            <App />
          </NekoProvider>
        </ThemeProvider>
      </ErrorBoundary>
    </StrictMode>,
  )
}

void boot()
