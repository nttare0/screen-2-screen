import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/?demo=1')
  await page.waitForFunction(() => {
    const video = document.querySelector<HTMLVideoElement>('[data-testid="player"] video')
    return !!video && video.readyState >= 2 && !video.paused
  })
})

const openTab = async (page: import('@playwright/test').Page, name: string, mobile: boolean) => {
  if (mobile) {
    await page.getByTestId('side-toggle').click()
    await page.getByRole('tab', { name }).click()
  } else {
    await page
      .getByRole('navigation', { name: 'Workspace navigation' })
      .getByRole('button', { name, exact: true })
      .click()
  }
}

test('keyboard toggles the panel and moves between tabs', async ({ page }, testInfo) => {
  const toggle = page.getByTestId('side-toggle')
  await toggle.focus()
  const before = await toggle.getAttribute('aria-expanded')
  await page.keyboard.press('Enter')
  await expect(toggle).toHaveAttribute('aria-expanded', before === 'true' ? 'false' : 'true')
  if (testInfo.project.name === 'mobile') {
    await page.keyboard.press('Escape')
    await expect(toggle).toHaveAttribute('aria-expanded', before!)
  } else {
    await page.keyboard.press('Enter')
    await expect(toggle).toHaveAttribute('aria-expanded', before!)
    await page.getByRole('tab', { name: 'Chat' }).focus()
    await page.keyboard.press('ArrowRight')
    await expect(page.getByRole('tab', { name: 'Files' })).toBeFocused()
  }
})

test('resolution changes the local demonstration stream', async ({ page }) => {
  await page.getByTestId('resolution-open').click()
  await page.getByTestId('resolution-item').filter({ hasText: '1280x720' }).click()
  await expect(page.getByTestId('resolution-open')).toContainText('1280 × 720')
  await page.waitForFunction(
    () => document.querySelector<HTMLVideoElement>('[data-testid="player"] video')?.videoWidth === 1280,
  )
})

test('emotes animate without a backend echo', async ({ page }) => {
  await page.getByTestId('emotes-open').click()
  await page.getByRole('menuitem', { name: 'wave' }).click()
  await expect(page.getByTestId('emote-animation')).toHaveCount(1)
})

test('room permissions and file lock use the reused actions', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'mobile', 'the mobile sheet traps focus; permissions are exercised on desktop')
  await page.getByRole('button', { name: 'Room permissions' }).click()
  await page.getByTestId('lock-control').click()
  await page.getByRole('button', { name: 'Room permissions' }).click()
  await expect(page.getByTestId('lock-control')).toHaveAttribute('data-locked', 'true')
  await page.getByTestId('lock-control').click()

  await openTab(page, 'Files', testInfo.project.name === 'mobile')
  await page.getByRole('button', { name: 'Room permissions' }).click()
  await page.getByTestId('lock-files').click()
  await page.getByRole('button', { name: 'Room permissions' }).click()
  await expect(page.getByTestId('lock-files')).toHaveAttribute('data-locked', 'true')
  await page.getByTestId('lock-files').click()
})

test('file deletion asks for confirmation and updates the shared list', async ({ page }, testInfo) => {
  await openTab(page, 'Files', testInfo.project.name === 'mobile')
  await page.getByRole('button', { name: 'Delete Project brief.md' }).click()
  await expect(page.getByTestId('dialog')).toBeVisible()
  await page.getByTestId('dialog-confirm').click()
  await expect(page.getByTestId('file-name').filter({ hasText: 'Project brief.md' })).toHaveCount(0)
})

test('light theme remains readable and persists', async ({ page }, testInfo) => {
  await openTab(page, 'Settings', testInfo.project.name === 'mobile')
  await page.getByRole('button', { name: 'Light', exact: true }).click()
  await expect(page.locator('html')).not.toHaveClass(/dark/)
  if (testInfo.project.name === 'mobile') await page.getByRole('button', { name: 'Close activity panel' }).click()
  await page.screenshot({ path: testInfo.outputPath('light.png'), fullPage: true })
  await page.reload()
  await expect(page.locator('html')).not.toHaveClass(/dark/)
})
