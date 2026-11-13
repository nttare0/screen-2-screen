import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/?demo=1')
  await expect(page.getByText('Interactive preview.')).toBeVisible()
  await page.waitForFunction(() => {
    const video = document.querySelector<HTMLVideoElement>('[data-testid="player"] video')
    return !!video && video.readyState >= 2 && !video.paused
  })
})

test('loads an explicitly labeled local stream and the activity panel', async ({ page }, testInfo) => {
  await expect(page.getByRole('heading', { name: 'Studio room' })).toBeVisible()
  if (testInfo.project.name === 'desktop') {
    await expect(page.getByTestId('side')).toBeVisible()
    await expect(page.getByTestId('chat-message')).toHaveCount(4)
  }
  await page.screenshot({ path: testInfo.outputPath('workspace.png'), fullPage: true })
})

test('sends a chat message through the reused plugin', async ({ page }, testInfo) => {
  if (testInfo.project.name === 'mobile') await page.getByTestId('side-toggle').click()
  const input = page.getByTestId('chat-input')
  await input.fill('Reviewing the shared screen together.')
  await input.press('Enter')
  await expect(
    page.getByTestId('chat-message').filter({ hasText: 'Reviewing the shared screen together.' }),
  ).toBeVisible()
  await expect(input).toHaveValue('')
})

test('requests and releases control', async ({ page }) => {
  const control = page.getByTestId('control-request')
  await expect(control).toContainText('Request Controls')
  await control.click()
  await expect(control).toContainText('Release Controls')
  await expect(page.getByText('You’re in control. Your keyboard and mouse are shared.')).toBeVisible()
  await control.click()
  await expect(control).toContainText('Request Controls')
})

test('navigates files, people, and settings', async ({ page }, testInfo) => {
  const mobile = testInfo.project.name === 'mobile'
  const open = async (name: string) => {
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
  await open('Files')
  await expect(page.getByTestId('file-name').filter({ hasText: 'Project brief.md' })).toBeVisible()
  const href = await page.getByRole('link', { name: 'Download Project brief.md' }).getAttribute('href')
  expect(href).toMatch(/^data:text\/plain/)
  await page
    .getByTestId('upload-input')
    .setInputFiles({ name: 'preview-note.txt', mimeType: 'text/plain', buffer: Buffer.from('local upload') })
  await expect(page.getByTestId('transfer').filter({ hasText: 'preview-note.txt' })).toHaveAttribute(
    'data-status',
    'completed',
  )
  await expect(page.getByTestId('file-name').filter({ hasText: 'preview-note.txt' })).toBeVisible()

  await page.getByRole('tab', { name: 'People' }).click()
  await expect(page.getByTestId('participant-row')).toHaveCount(4)
  await page.getByRole('button', { name: 'Actions for Jamie Chen' }).click()
  await page.getByRole('menuitem', { name: 'Give Controls' }).click()
  await expect(page.getByTestId('participant-row').filter({ hasText: 'Jamie Chen' }).getByText('Host')).toBeVisible()

  await page.getByRole('tab', { name: 'Settings' }).click()
  await page.getByRole('button', { name: 'Light', exact: true }).click()
  await expect(page.locator('html')).not.toHaveClass(/dark/)
  await page.getByRole('button', { name: 'Dark', exact: true }).click()
  await expect(page.locator('html')).toHaveClass(/dark/)
})

test('invite link strips credentials', async ({ page }) => {
  await page.goto('/?demo=1&token=secret-token&pwd=secret-password')
  await page.getByRole('button', { name: 'Invite' }).click()
  const value = await page.getByLabel('Room link').inputValue()
  expect(value).toContain('demo=1')
  expect(value).not.toContain('secret-token')
  expect(value).not.toContain('secret-password')
})

test('mobile keeps the screen usable and the panel dismissible', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'mobile layout only')
  await expect(page.getByTestId('side')).toHaveCount(0)
  await expect(page.getByTestId('player')).toBeVisible()
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  expect(overflow).toBeLessThanOrEqual(1)
  await page.getByTestId('side-toggle').click()
  await expect(page.getByTestId('side')).toBeVisible()
  await page.getByRole('button', { name: 'Close activity panel' }).click()
  await expect(page.getByTestId('side')).toHaveCount(0)
})
