# Verification

## Ran locally

- `npm run check`
  - TypeScript: pass
  - Prettier: pass
  - ESLint: pass
  - import cycles: pass (92 files)
  - Vitest: 21 files, 113 tests passed
  - production client build: pass
  - core/client dist checks: pass; 15 locale bundles remain lazy
- `npm run test:browser`
  - Playwright desktop (1440×960) and mobile (390×844)
  - 28 passed, 2 intentionally skipped
  - covers preview labeling, local stream playback, chat, control handoff, files/upload/delete, participants, settings/theme persistence, invite credential stripping, sign-in validation, keyboard navigation, resolution, emotes, room locks, and the absence of backend API calls in demo mode
  - live-mode check confirms an absent backend stays offline and does not fall back to a fake stream
- `node --check client/e2e.mjs`
- `bash -n server/build`
- `npx js-yaml docker-compose.yaml` and `docs/ci.example.yml`: parse successfully

The local browser run used a temporary Chromium binary outside the repository. No browser binary or test artifact is tracked.

## Not ran locally

The sandbox has no Go toolchain or Docker daemon, so these were not executed here:

- native Go server compilation
- Docker image construction
- `docker compose up`
- the upstream two-user live-server/WebRTC smoke test (`client/e2e.mjs`)

A ready-to-enable CI workflow is included at `docs/ci.example.yml` for the client checks, Playwright suite, and container build. A real deployment is still required to verify WebRTC media, remote input, microphone, clipboard, and the KDE/X typing step against the upstream runtime.
