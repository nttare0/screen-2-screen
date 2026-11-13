// modal dialogs (legacy SweetAlert look, components/Dialog) and toasts (sonner, components/ui/sonner)
import { toast as sonner } from 'sonner'
// ask() resolves true on confirm, tell() when dismissed
function dialog(app, d) {
  app.getState().dialog?.resolve(false)
  return new Promise((resolve) => app.setState({ dialog: { ...d, resolve } }))
}
export const ask = (app, title, text) => dialog(app, { title, text, icon: 'warning', cancel: true })
export const tell = (app, title, text, icon = 'error') => dialog(app, { title, text, icon, cancel: false })
// a toast of a kind for 5 s, like the legacy client's
export function toast(title, text, kind = 'info') {
  sonner[kind](title, { description: text, duration: 5000 })
}
export const dismissToasts = () => sonner.dismiss()
