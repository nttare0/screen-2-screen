# Source provenance

Screen 2 Screen reuses Neko rather than reimplementing its streaming protocol.

## Upstream pin

- Repository: https://github.com/m1k1o/neko
- Release: `v3.2.0`
- Commit: `92420ca8e4709c1ac49961c4bf5d3cc786d44f0d`
- License: Apache-2.0, retained in `LICENSE`

Imported without upstream Git metadata:

- `client/` — React GUI, framework-free `client/core/`, locales, assets, tests, and build tooling
- `server/` — Go server, protocol types, plugins directory, OpenAPI description, and build script
- `SECURITY.md`

The upstream `LICENSE` and pre-existing copyright headers are preserved. Modified upstream files carry a short `Modified for Screen 2 Screen` notice where practical. New redesign files are original to this repository.

## Main modification boundaries

- `client/core/src/client.ts`, `api.ts`, `index.ts`, `transport.ts`: injectable REST/socket/transport adapters and a `demo` transport kind. The default path remains REST + WebSocket + WebRTC.
- `client/src/app/`, `layout/`, `features/`, `plugins/chat/Chat.tsx`, `plugins/filetransfer/`: redesigned shadcn/ui shell and feature surfaces over the existing stores/actions.
- `client/src/components/ui/`: source-owned shadcn primitives, pinned to `shadcn-ui/ui` commit `e62c9435fff729a175f38983dee73b2cb4f6a069` (`apps/v4/registry/new-york-v4/ui`). MIT license in `licenses/shadcn-ui.txt`. The point-anchored context menu is a local Radix wrapper.
- `client/src/demo/`: opt-in local preview adapters and canvas surface. Lazy-loaded only for `?demo=1` or `VITE_DEMO=true`.
- `client/src/index.css`, `hooks/use-theme.tsx`, branding assets: semantic light/dark tokens and Screen 2 Screen identity.
- `server/build`: downloads the checked-in module sums and builds with `-mod=readonly` instead of upgrading dependencies.
- Root `Dockerfile`, `docker-compose.yaml`, npm workspaces, Playwright tests, and the CI example in `docs/ci.example.yml`: packaging and verification for this repository. The root lockfile is authoritative; upstream nested lockfiles, standalone client Dockerfile/dev helpers, server dev helpers, and unused legacy branding icons were removed because the workspace/root container build supersedes them.

Bundled fonts are Inter and Manrope via Fontsource; their SIL Open Font License texts are in `licenses/fonts/`.

## Not imported

Upstream documentation site, room orchestrator, deployment tooling, and Git history are not part of this single-room application. The pinned upstream Firefox runtime image is reused by the container build instead of copying its desktop sources.
