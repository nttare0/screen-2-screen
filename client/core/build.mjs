import { cpSync, rmSync } from 'node:fs'

rmSync('dist', { recursive: true, force: true })
cpSync('src', 'dist', {
  recursive: true,
  filter: (path) => !/\.test\.[jt]sx?$/.test(path) && !/(^|\/)test(\/|$)/.test(path),
})
