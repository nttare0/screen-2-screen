import { createStore } from 'zustand/vanilla'
import { scoped } from '@/state/app'
// the store of an instance (`store(neko)`, `store(useNeko())`)
export const store = scoped(() =>
  createStore(() => ({
    files: null,
    uploads: [],
  })),
)
