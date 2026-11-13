# Verification

Run `npm run check` for formatting, lint, import cycles, unit tests and a production client build. Run `npm run test:browser` for desktop and mobile offline/login checks. Browser tests stub API responses and do not establish a live room.

For end-to-end verification, start the Neko runtime as described in the README and run the retained `client/e2e.mjs` smoke test with two users. Real WebRTC also requires reachable UDP ports and the correct public IP.

An opt-in CI example is provided in `docs/ci.example.yml`.
