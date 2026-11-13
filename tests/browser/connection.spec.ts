import { test, expect } from '@playwright/test'

test('live mode is the default and never falls back to a fake stream', async ({ page }) => {
  await page.route('**/api/oauth/config', (route) => route.abort())
  await page.goto('/')
  await expect(page.getByTestId('connect')).toBeVisible()
  await expect(page.getByText('No server reachable')).toBeVisible()
  await expect(page.getByText('Interactive preview.')).toHaveCount(0)
  await expect(page.getByTestId('header')).toContainText('Offline')
  const playing = await page.evaluate(() => {
    const video = document.querySelector<HTMLVideoElement>('[data-testid="player"] video')
    return !!video && !video.paused && video.readyState >= 2
  })
  expect(playing).toBe(false)
  await expect(page.getByRole('link', { name: 'Explore interactive preview' })).toHaveAttribute('href', '?demo=1')
})

test('preview sign-in validates locally and strips invite credentials', async ({ page }, testInfo) => {
  await page.goto('/?demo=1&usr=Taylor&pwd=demo')
  await expect(page.getByText('Interactive preview.')).toBeVisible()
  await expect(page).not.toHaveURL(/pwd=/)
  if (testInfo.project.name === 'desktop') {
    await page
      .getByRole('navigation', { name: 'Workspace navigation' })
      .getByRole('button', { name: 'Settings', exact: true })
      .click()
  } else {
    await page.getByTestId('side-toggle').click()
    await page.getByRole('tab', { name: 'Settings' }).click()
  }
  await page.getByTestId('logout').click()
  await expect(page.getByTestId('connect')).toBeVisible()
  await page.getByLabel('Enter your display name').fill('Taylor')
  await page.getByLabel('Password', { exact: true }).fill('wrong')
  await page.getByRole('button', { name: 'Enter preview' }).click()
  await expect(page.getByRole('alert')).toContainText('The preview password is demo.')
  await page.getByLabel('Password', { exact: true }).fill('demo')
  await page.getByRole('button', { name: 'Enter preview' }).click()
  await expect(page.getByTestId('connect')).toHaveCount(0)
  await expect(page.getByText('Interactive preview.')).toBeVisible()
})

test('preview issues no backend API requests', async ({ page }) => {
  const api: string[] = []
  page.on('request', (request) => {
    if (new URL(request.url()).pathname.startsWith('/api')) api.push(request.url())
  })
  await page.goto('/?demo=1')
  await expect(page.getByText('Interactive preview.')).toBeVisible()
  await page.waitForFunction(() => {
    const video = document.querySelector<HTMLVideoElement>('[data-testid="player"] video')
    return !!video && video.readyState >= 2 && !video.paused
  })
  expect(api).toEqual([])
})
