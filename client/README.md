# Screen 2 Screen client

React 19 + TypeScript + Vite web client for the Neko v3 API, redesigned with shadcn/ui and Tailwind CSS v4. It is an npm workspace alongside `client/core` (`@m1k1o/neko`), the upstream framework-free REST/WebSocket/WebRTC library.

## Commands

Run from the repository root unless noted:

```bash
npm ci
npm run dev            # live mode; NEKO_URL proxies /api to a backend
npm run dev:demo       # explicit local preview (VITE_DEMO=true)
npm run build          # core build, typecheck, Vite build, dist checks
npm run preview        # serve client/dist on port 3000
npm run check          # types, format, lint, cycles, unit tests, build
npm run test:browser   # Playwright desktop/mobile suite from the root
```

Inside `client/`, `npm run test:e2e` runs the upstream two-user live-server smoke test against `NEKO_URL`. It needs a real Neko desktop; see the root README.

## Layout

```text
client/
  core/          @m1k1o/neko: framework-free client library (core/README.md)
  src/
    main.tsx     boot: i18n, instance, plugins, connection, render; lazy demo entry
    app/         App shell and ErrorBoundary
    layout/      Header, NavigationRail, Side, RoomBar, DemoBanner
    features/    video, controls, members, emotes, settings, connect, about, invite
    plugins/     registry, contract, chat/, filetransfer/
    components/  shared pieces and source-owned ui/ shadcn primitives
    state/       per-instance stores, provider, actions, settings, dialogs, events
    demo/        opt-in local API/socket/transport adapters and canvas surface
    i18n/        i18next setup and lazy locale loader
    locales/     common/chat/files strings per language
    index.css    Tailwind v4 semantic tokens and global rules
```

## Architecture rules

- Dependencies point one way: `app → layout → features → components`, with `state`, `i18n`, and `lib` below. ESLint and `tools/cycles.mjs` enforce this.
- The core is imported only through `@m1k1o/neko`. Vite aliases that to `core/src` so the GUI and core share one zustand copy; the built package exposes `core/dist`.
- There is no global client. `createNekoApp()` returns a `NekoApp` (core client, overlay, GUI store, bus). Components read it through `useNeko()`/`useClient()`/`useApp()` and select immutable store slices.
- Plugins contribute through the registry slots (`side.tab`, `header.item`, `member.menu`) and receive typed wire events. They do not import features or each other.
- The demo swaps only the core's injectable `api`, `socket`, and `transport` options. It is lazy-loaded for `?demo=1` or `VITE_DEMO=true`; the default connection path remains real WebRTC.

## UI conventions

- Semantic tokens (`background`, `card`, `primary`, `muted`, `destructive`, `stage`, …) with light/dark themes persisted as `s2s-theme`.
- shadcn/Radix primitives live in `src/components/ui/`; feature components compose them rather than hard-coding colors.
- The activity panel is inline at ≥1100px and a focus-trapped sheet below that. Navigation rail is hidden below `md`.
- Test IDs used by the browser suites are kept on interactive surfaces (`connect`, `side`, `chat-input`, `player`, `control-request`, `file`, `dialog`, …).

See `docs/PROVENANCE.md` for the upstream pin and modification boundaries, and `client/core/README.md` for the connection library.
