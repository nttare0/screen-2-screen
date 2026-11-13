// Runs one hook of every item and renders `children` with the results in item order. Hooks cannot
// run in a loop, so each item's hook runs in a component of its own, nested one in the next; the
// item list must be fixed (the plugin tabs are), which keeps every component's hooks the same on
// every render.
export function EachHook({ items, use, children, values = [] }) {
  if (!items.length) return children(values)
  return <OneHook items={items} use={use} values={values} children={children} />
}
function OneHook({ items: [item, ...rest], use, children, values = [] }) {
  const useValue = use(item)
  const value = useValue()
  return <EachHook items={rest} use={use} values={[...values, value]} children={children} />
}
