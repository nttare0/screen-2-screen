// Modified for Screen 2 Screen: redesign and connection-adapter integration.
import { useStore } from 'zustand'
import { selectIsAdmin } from '@m1k1o/neko'
import { api } from '@/state/api'
import { useNeko } from '@/state/provider'
import { store } from './store'
import { uid } from '@/lib/utils'
export const refresh = ({ client }) => client.send('filetransfer/update')
// the admin's lock: users may not transfer files while it is set
export const locked = (settings) => settings.plugins?.['filetransfer.enabled'] === false
export const toggleLock = (neko) =>
  api(neko, 'POST', '/room/settings', { plugins: { 'filetransfer.enabled': locked(neko.client.state.settings) } })
// whether this viewer gets the Files tab
export function useAllowed() {
  const neko = useNeko()
  const f = useStore(store(neko), (s) => s.files)
  const admin = useStore(neko.client.store, selectIsAdmin)
  const lock = useStore(neko.client.store, (s) => locked(s.settings))
  return !!f?.enabled && (admin || !lock) && (admin || f.user_download || f.user_upload)
}
// plain link so the browser streams the download; the token only goes in the URL when the
// server runs without cookies (otherwise the session cookie authenticates it)
export const fileUrl = ({ client }, name) =>
  client.api.downloadUrl(`/filetransfer?filename=${encodeURIComponent(name)}`)
export const fileDelete = (neko, name) => api(neko, 'DELETE', `/filetransfer?filename=${encodeURIComponent(name)}`)
export function upload(neko, files) {
  const uploads = store(neko)
  for (const file of files) {
    const u = { id: uid(), name: file.name, size: file.size, progress: 0, status: 'inprogress' }
    uploads.setState((s) => ({ uploads: [...s.uploads, u] }))
    const update = (part) =>
      uploads.setState((s) => ({ uploads: s.uploads.map((x) => (x.id === u.id ? { ...x, ...part } : x)) }))
    const form = new FormData()
    form.append('files', file)
    neko.client.api
      .upload('/filetransfer', form, (p) => update({ progress: p.loaded }))
      .then(() => update({ progress: file.size, status: 'completed' }))
      .catch((err) => update({ status: 'failed', error: err.message }))
  }
}
