// Modified for Screen 2 Screen: redesign and connection-adapter integration.
import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { IconButton } from './IconButton'

describe('IconButton', () => {
  it('is a real button, named and titled by its label, with the icon as its child', () => {
    const html = renderToStaticMarkup(
      <IconButton label="Toggle side panel">
        <svg />
      </IconButton>,
    )
    expect(html).toMatch(
      /^<button type="button" aria-label="Toggle side panel" title="Toggle side panel" class="[^"]*"><svg><\/svg><\/button>$/,
    )
  })
  it('takes a variant, merges a class name and passes the rest through', () => {
    const html = renderToStaticMarkup(
      <IconButton label="x" variant="header" className="w-10" data-testid="t" disabled />,
    )
    expect(html).toContain('data-testid="t"')
    expect(html).toContain('disabled=""')
    expect(html).toMatch(/class="[^"]*h-8[^"]*"/)
    expect(html).toMatch(/class="[^"]*w-10[^"]*"/)
    expect(html).not.toMatch(/class="[^"]*w-8[^"]*"/) // the caller's width wins
    expect(html).toContain('focus-visible:ring-ring')
  })
})
