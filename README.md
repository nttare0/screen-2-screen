# Screen 2 Screen

A self-hosted shared-screen workspace built on [Neko](https://github.com/m1k1o/neko) `v3.2.0`, redesigned with [shadcn/ui](https://ui.shadcn.com/). One room, multiple participants, one shared cursor: watch a remote browser together, hand off control, chat, react, and share files.

The streaming backend is Neko's Go server and browser runtime, not a JavaScript imitation. The redesign replaces the client shell and feature surfaces while keeping the upstream REST/WebSocket/WebRTC core, permissions, input overlay, plugins, and locales.

## What is here

- **Workspace UI** — navigation rail, session header, immersive screen, compact control dock, and a collapsible activity panel for chat, files, people, and settings.
- **Real room features** — control request/handoff/lock, administrator permissions, clipboard, resolution, fullscreen/PiP, emotes, microphone sharing, chat, and file transfer.
- **Light/dark themes** — semantic tokens, persisted theme choice, keyboard-accessible Radix/shadcn primitives, responsive mobile sheet.
- **Explicit local preview** — `?demo=1` renders a local canvas “stream” and in-memory room data so the UI can be explored without a server. It is clearly labeled and never pretends to be a live connection.
- **Container packaging** — multi-stage build of the redesigned client and pinned Go server on top of the upstream Firefox runtime image.

## Quick start: local preview

Requires Node.js 22.12+.

```bash
npm ci
npm run dev:demo
```

Open http://localhost:3000. The preview signs in automatically with local demo data. To exercise the sign-in flow, log out from Settings and use any display name with password `demo`.

The preview is also available on the normal dev server or a production build by appending `?demo=1`. It is opt-in; the default path always tries the real backend.

```bash
npm run dev            # live mode; set NEKO_URL to proxy a backend
npm run build          # production client bundle in client/dist
npm run preview        # serve the production bundle on port 3000
```

## Run the real room

### Docker Compose

```bash
cp .env.example .env
# Edit .env: set NEKO_PUBLIC_IP and both passwords.
docker compose up --build -d
```

Open http://localhost:8080. Sign in with any display name and the user or admin password from `.env`.

Important deployment settings:

- `NEKO_PUBLIC_IP` must be an IP address reachable by viewers. For remote access, use the host's public/LAN IP, not `127.0.0.1`.
- TCP `8080` serves the app and API. UDP `52000-52100` carries WebRTC media and must be allowed through firewalls/security groups.
- Put the app behind HTTPS for production. Clipboard, microphone, and secure-context browser APIs require it.
- Passwords are required; the compose file refuses to start with empty values. Do not commit `.env`.
- File transfer is enabled by default in this compose file (`NEKO_FILETRANSFER_ENABLED=true`). Disable it if you do not want a shared upload/download directory.

The container reuses `ghcr.io/m1k1o/neko/firefox:3.2.0` for the virtual desktop and replaces its web client and server binary with this repository's build. See `Dockerfile` for overridable Node/Go/base image arguments.

### Frontend against an existing Neko server

```bash
NEKO_URL=http://localhost:8080 npm run dev
```

Vite proxies `/api`, including WebSockets, to `NEKO_URL`. The browser talks only to the same origin. For a separate static deployment, serve `client/dist` and proxy `/api` to the Neko server yourself.

## Verify

```bash
npm run check          # types, format, lint, import cycles, unit tests, production build
npm run test:browser   # Playwright workspace tests at desktop and mobile sizes
```

Browser tests use the normal dev server and enter the preview through `?demo=1`; they also check that live mode does not fall back to demo when the backend is absent. Install a browser first if needed:

```bash
npx playwright install chromium
```

The upstream two-user live-server smoke test is retained as `client/e2e.mjs` and updated for the new selectors:

```bash
NEKO_URL=http://localhost:8080/ \
NEKO_ADMIN_PASSWORD=... NEKO_USER_PASSWORD=... \
npm run test:e2e --workspace=screen-2-screen-client
```

That test needs a running Neko desktop and, for its remote-typing step, a KDE/X session. It is not part of the local preview suite.

A ready-to-enable CI workflow is provided at `docs/ci.example.yml` (client checks, browser tests, and a container image build). Copy it to `.github/workflows/ci.yml` in a checkout whose GitHub connection has workflow permission.

## Architecture

```text
React workspace / shadcn-ui primitives
        |
existing GUI stores, actions, plugins
        |
upstream framework-free core (@m1k1o/neko)
 REST / WebSocket / WebRTC + binary input
        |
pinned Neko Go server
        |
upstream Firefox + X11 runtime
```

The preview swaps only the outer connection/media boundary (`client/src/demo/`) through the core's injectable API/socket/transport options. Production code paths remain the default.

More detail: `docs/REBUILD_PLAN.md`, `docs/PROVENANCE.md`, `client/README.md`, and `client/core/README.md`.

## Security and scope

This is a single-room application, not a multi-room SaaS. Anyone with the room password can join; administrators can lock the room, lock controls, mute, kick, and hand off control. The remote browser is a shared desktop, not a per-user sandbox. Treat credentials, stream keys, clipboard contents, and uploaded files as shared room data. Upstream security guidance is retained in `SECURITY.md`.

## License

Apache-2.0. Upstream Neko code and copyright headers are preserved; see `LICENSE` and `docs/PROVENANCE.md`. shadcn/ui primitives are MIT (`licenses/shadcn-ui.txt`); bundled Inter/Manrope fonts are SIL OFL (`licenses/fonts/`).
