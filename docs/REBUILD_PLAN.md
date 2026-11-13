# Screen 2 Screen rebuild plan (historical)

This records the original redesign plan. The demo/preview described below was subsequently removed; see the README for current setup.

## Direction

Rebuild Neko as a focused, self-hosted shared-screen workspace. Preserve its single-room, multi-participant model and real streaming backend; redesign the application around an immersive screen, a compact navigation rail, and a collapsible activity panel. This is a Neko-compatible application, not a new multi-room SaaS platform.

The starting repository contained only a README. The implementation imports a pinned upstream release rather than a moving development snapshot.

## Steps and acceptance criteria

### 1. Audit and pin the source

- [x] Inspect the empty destination repository and the available tooling.
- [x] Inspect Neko's client, framework-independent core, Go server, protocol, tests, and license.
- [x] Select the stable `v3.2.0` release, commit `92420ca8e4709c1ac49961c4bf5d3cc786d44f0d`.
- [x] Confirm Apache-2.0 redistribution requirements.
- [x] Import the reusable client/core and server source without upstream Git metadata.
- [x] Record the source revision, imported paths, and modification boundaries.

**Acceptance:** the provenance is reproducible; the license is retained; no generated dependencies or upstream history enter the destination repository.

### 2. Establish the frontend foundation

- [x] Use npm workspaces, React, TypeScript, Vite, Tailwind CSS, and shadcn/ui's owned-component model.
- [x] Replace legacy color literals with semantic shadcn tokens and light/dark themes.
- [x] Add the missing accessible input, switch, slider, tooltip, badge, separator, and sheet primitives.
- [x] Keep the upstream core's REST, WebSocket, WebRTC, permissions, and input behavior intact.

**Acceptance:** type checking and the existing core/state tests pass; UI primitives are source-owned and keyboard accessible.

### 3. Redesign the workspace

- [x] Add a branded navigation rail and a session header with honest connection state.
- [x] Make the remote screen the primary surface, with a compact control dock.
- [x] Move chat, shared files, participants, and settings into a collapsible activity panel.
- [x] Preserve administrator controls, host handoff, clipboard, resolution, fullscreen, emotes, and microphone behavior.
- [x] Provide a responsive tablet/mobile layout and a distraction-free viewing mode.

**Acceptance:** the original feature components still use the real client stores and actions; the redesigned shell works at desktop and narrow viewport sizes.

### 4. Redesign connection and settings flows

- [x] Replace the legacy login overlay with a labeled, accessible shadcn sign-in form.
- [x] Preserve password, invite-link, saved-session, OAuth, disconnect, and reconnect flows.
- [x] Use shadcn settings controls while preserving persisted viewer preferences.
- [x] Add clear empty, loading, unsupported-browser, and disconnected states.

**Acceptance:** a failed or absent backend is never represented as a successful stream; demo mode is explicit and isolated.

### 5. Provide an inspectable local preview

- [x] Add an opt-in demo adapter using the same application shell and client state.
- [x] Use a locally rendered demonstration surface, not a claimed remote WebRTC stream.
- [x] Make sample chat, control handoff, participants, preferences, and file-list interactions usable.
- [x] Keep all demo fixtures and behavior outside the production connection path.

**Acceptance:** the preview is visibly labeled; live mode remains the default; demo actions do not issue requests to a real server.

### 6. Package and connect the real backend

- [x] Proxy `/api`, including WebSockets, in local development.
- [x] Provide a multi-stage container build for the redesigned client and pinned Go server.
- [x] Reuse the pinned upstream browser/runtime image for the virtual desktop.
- [x] Require explicit deployment passwords and a reachable WebRTC address; document HTTPS and UDP requirements.
- [x] Do not enable deployment connectors or deploy without authorization.

**Acceptance:** the production bundle contains the real connection path and no automatic demo fallback; deployment configuration has no hard-coded credentials.

### 7. Verify and hand over

- [x] Run TypeScript, lint, upstream unit tests, new adapter tests, and a production build.
- [x] Exercise the preview in a browser at desktop and mobile sizes.
- [x] Check keyboard navigation, theme switching, chat, controls, panel navigation, and sign-in states.
- [x] Review the final diff, generated-file exclusions, and license preservation.
- [x] Document commands, architecture, security assumptions, and verification limits.
- [x] Commit on the current Arena branch without signatures or trailers.

**Acceptance:** reported checks have actually run. Native Go compilation, Docker image construction, and end-to-end WebRTC require their respective tools/runtime and must not be reported as passed when unavailable.

## Verification limits

The local sandbox has Node.js but no Go toolchain or Docker daemon. TypeScript, lint, formatting, unit tests, the production client build, and Playwright preview tests run locally. The container build and live WebRTC path are exercised by CI / a real Neko deployment, not claimed as locally verified.

## Architecture

```text
React workspace / shadcn-ui components
                |
       existing GUI stores + plugins
                |
       upstream framework-free core
        REST / WebSocket / WebRTC
                |
          pinned Neko Go server
                |
      upstream browser + X11 runtime
```

The local preview replaces only the outermost connection/media boundary with an explicit demo adapter. It does not replace the production backend with a JavaScript imitation.

## Scope boundaries

- Included: a complete frontend redesign, reusable client/core and server source, local demo, container packaging, tests, and setup documentation.
- Preserved: one shared room, multiple participants, administrator/member permissions, real WebRTC streaming, remote input, chat, and file transfer.
- Not included: a new multi-room orchestrator, accounts database, billing, hosted deployment, or claims of OS-level isolation beyond the upstream runtime.
