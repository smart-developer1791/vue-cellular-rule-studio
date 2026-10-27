import { test, expect, type Page } from '@playwright/test'
import { readFile } from 'node:fs/promises'
const fixture = JSON.parse(
  await readFile(new URL('../../public/sample-workspace.json', import.meta.url), 'utf8'),
)
async function importData(page: Page, value: unknown) {
  await page.getByRole('button', { name: 'Import', exact: true }).click()
  await page.getByLabel('Workspace JSON', { exact: true }).fill(JSON.stringify(value))
  await page.getByRole('button', { name: 'Import workspace', exact: true }).click()
  await expect(page.locator('dialog[open]')).toHaveCount(0)
}
async function deliver(page: Page, label: string) {
  const pending = page.waitForEvent('download')
  await page.getByRole('button', { name: label, exact: true }).click()
  const file = await pending
  return { name: file.suggestedFilename(), buffer: await readFile((await file.path())!) }
}

async function roundTrip(page: Page, value: unknown, parse: (v: unknown) => unknown) {
  await page.setViewportSize({ width: 320, height: 900 })
  await page.goto('/')
  await importData(page, value)
  const file = await deliver(page, 'JSON'),
    source = file.buffer.toString('utf8')
  expect(source.length).toBeLessThan(120000)
  expect(parse(JSON.parse(source))).toEqual(parse(value))
  await page.reload()
  await importData(page, JSON.parse(source))
  expect(parse(JSON.parse((await deliver(page, 'JSON')).buffer.toString('utf8')))).toEqual(
    parse(value),
  )
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
}

import { parse } from '../../src/domain/automaton.ts'
test('maximum escaped 64-by-64 workspace downloads and re-imports fully at 320px', async ({
  page,
}) => {
  await roundTrip(
    page,
    { ...fixture, name: '"'.repeat(80), seed: '1'.repeat(64), rows: 64, rule: 255, ink: '#000000' },
    parse,
  )
  await expect(page.locator('[data-ui="on-count"]')).toHaveText('4096')
})
