// Modified for Screen 2 Screen: file-transfer permission as a room-menu action.
import { useStore } from 'zustand'
import { selectIsAdmin } from '@m1k1o/neko'
import { useTranslation } from 'react-i18next'
import { FileIcon, LockKeyIcon } from '@phosphor-icons/react'
import { useNeko } from '@/state/provider'
import { DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { store } from './store'
import { locked, toggleLock } from './actions'
export function FileLock() {
  const { t } = useTranslation()
  const neko = useNeko()
  const { client } = neko
  const enabled = useStore(store(neko), (s) => !!s.files?.enabled)
  const admin = useStore(client.store, selectIsAdmin)
  const isLocked = useStore(client.store, (s) => locked(s.settings))
  if (!enabled) return null
  const tip = admin
    ? t(`files:locks.${isLocked ? 'unlock' : 'lock'}`)
    : t(`files:locks.${isLocked ? 'locked' : 'unlocked'}`)
  return (
    <DropdownMenuItem
      data-testid="lock-files"
      data-locked={isLocked || undefined}
      disabled={!admin}
      onSelect={() => admin && toggleLock(neko)}
    >
      <FileIcon className="size-4" /> {tip}
      {isLocked && <LockKeyIcon className="ml-auto size-3.5 text-warning" />}
    </DropdownMenuItem>
  )
}
