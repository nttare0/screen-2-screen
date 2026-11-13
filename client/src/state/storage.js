// per-viewer settings, stored like the legacy client did (same keys, '1'/'0' booleans)
export function get(key, def) {
  try {
    const v = localStorage.getItem(key)
    if (!v) return def
    if (typeof def === 'boolean') return v === '1'
    if (typeof def === 'number') return isNaN(parseInt(v)) ? def : parseInt(v)
    return v
  } catch {
    return def
  }
}
export function set(key, val) {
  try {
    localStorage.setItem(key, typeof val === 'boolean' ? (val ? '1' : '0') : String(val))
  } catch {}
}
export const remember = set
