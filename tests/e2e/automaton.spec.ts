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

import { parse, evolve, runPath } from '../../src/domain/automaton.ts'
test('Vue render-function SVG patches actual runs/color and retains its DOM while seed edits preserve pending rule fields', async ({
  page,
}) => {
  await page.goto('/')
  const svg = page.locator('[data-ui="automaton-grid"]')
  await svg.evaluate((e) => {
    ;(window as any).__grid = e
  })
  await page
    .getByRole('textbox', { name: 'Workspace name', exact: true })
    .fill('A pending pattern name')
  await page.locator('[data-seed-index="0"]').click()
  await expect(page.getByRole('textbox', { name: 'Workspace name', exact: true })).toHaveValue(
    'A pending pattern name',
  )
  await page.getByRole('spinbutton', { name: 'Rule number', exact: true }).fill('204')
  await page.getByRole('spinbutton', { name: 'Row count', exact: true }).fill('4')
  await page.getByRole('combobox', { name: 'Boundary', exact: true }).selectOption('empty')
  await page.getByRole('textbox', { name: 'Cell HEX', exact: true }).fill('#abcdef')
  await page.getByRole('button', { name: 'Apply rule settings', exact: true }).click()
  await expect(svg).toHaveAttribute('viewBox', '0 0 31 4')
  await expect(page.locator('[data-ui="cell-runs"]')).toHaveAttribute('fill', '#ABCDEF')
  await expect(page.locator('[data-ui="on-count"]')).toHaveText('8')
  const w = parse({
    ...fixture,
    rule: 204,
    rows: 4,
    boundary: 'empty',
    seed: '1' + fixture.seed.slice(1),
  })
  await expect(page.locator('[data-ui="cell-runs"]')).toHaveAttribute('d', runPath(evolve(w)))
  expect(await svg.evaluate((e) => e === (window as any).__grid)).toBe(true)
  await page.reload()
  await expect(page.getByRole('textbox', { name: 'Workspace name', exact: true })).toHaveValue(
    'A pending pattern name',
  )
})
test('strict seeds and finite boundary changes preserve invalid work and keep grid/row frames stable', async ({
  page,
}) => {
  await page.goto('/')
  const panel = page.locator('[data-ui="preview-panel"]'),
    height = await panel.evaluate((e) => e.getBoundingClientRect().height),
    before = await page.locator('[data-ui="cell-runs"]').getAttribute('d')
  await page.getByRole('textbox', { name: 'Seed bits', exact: true }).fill('001x')
  await page.getByRole('button', { name: 'Apply seed bits', exact: true }).click()
  await expect(page.locator('[data-ui="seed-form"]').getByRole('alert')).toContainText('8–64 bits')
  await expect(page.locator('[data-ui="cell-runs"]')).toHaveAttribute('d', before!)
  await page.getByRole('textbox', { name: 'Seed bits', exact: true }).fill('10000000')
  await page.getByRole('button', { name: 'Apply seed bits', exact: true }).click()
  await page.getByRole('spinbutton', { name: 'Rule number', exact: true }).fill('90')
  await page.getByRole('spinbutton', { name: 'Row count', exact: true }).fill('2')
  await page.getByRole('button', { name: 'Apply rule settings', exact: true }).click()
  await expect(page.locator('[data-ui="last-count"]')).toHaveText('2')
  await page.getByRole('combobox', { name: 'Boundary', exact: true }).selectOption('empty')
  await page.getByRole('button', { name: 'Apply rule settings', exact: true }).click()
  await expect(page.locator('[data-ui="last-count"]')).toHaveText('1')
  await page.getByRole('button', { name: 'Bit rows', exact: true }).click()
  await expect(page.locator('[data-ui="bit-rows"] p')).toHaveCount(2)
  expect(await panel.evaluate((e) => e.getBoundingClientRect().height)).toBe(height)
})
test('actual PBM raster matches independently rendered SVG pixels and full TXT preserves every row and provenance', async ({
  page,
}) => {
  await page.goto('/')
  const pbm = await deliver(page, 'Bitmap PBM'),
    text = pbm.buffer.toString('ascii'),
    tokens = text
      .replace(/#[^\n]*/g, '')
      .trim()
      .split(/\s+/),
    w = Number(tokens[1]),
    h = Number(tokens[2]),
    bits = tokens.slice(3).map(Number)
  expect(pbm.name).toMatch(/^CA-[A-F0-9]{8}\.pbm$/)
  expect(tokens[0]).toBe('P1')
  expect([w, h]).toEqual([31, 32])
  expect(bits).toEqual(evolve(parse(fixture)).flat())
  expect(text.split('\n').every((line) => line.length <= 70)).toBe(true)
  const svg = await deliver(page, 'Grid SVG'),
    raster = await page.evaluate(
      async ({ svg, w, h }) => {
        const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }))
        try {
          const img = new Image()
          img.src = url
          await img.decode()
          const canvas = document.createElement('canvas')
          canvas.width = w
          canvas.height = h
          const ctx = canvas.getContext('2d')!
          ctx.drawImage(img, 0, 0, w, h)
          const data = ctx.getImageData(0, 0, w, h).data
          return Array.from({ length: w * h }, (_, i) =>
            data[i * 4]! < 250 || data[i * 4 + 1]! < 250 || data[i * 4 + 2]! < 250 ? 1 : 0,
          )
        } finally {
          URL.revokeObjectURL(url)
        }
      },
      { svg: svg.buffer.toString('utf8'), w, h },
    )
  expect(raster).toEqual(bits)
  const rows = (await deliver(page, 'Rows TXT')).buffer.toString('utf8')
  expect(rows).toContain('32: ' + evolve(parse(fixture))[31]!.join(''))
  expect(rows).toContain(await page.locator('[data-ui="marker"]').innerText())
})
test('empty/all-on outcomes remain bounded, pending seeds survive unrelated settings and invalid rules do not alter exports', async ({
  page,
}) => {
  await page.goto('/')
  await importData(page, { ...fixture, seed: '00000000', rule: 0, rows: 64 })
  await expect(page.locator('[data-ui="cell-runs"]')).toHaveAttribute('d', '')
  await expect(page.locator('[data-ui="on-count"]')).toHaveText('0')
  await page.getByRole('textbox', { name: 'Seed bits', exact: true }).fill('11111111')
  await page.getByRole('spinbutton', { name: 'Rule number', exact: true }).fill('255')
  await page.getByRole('spinbutton', { name: 'Row count', exact: true }).fill('2')
  await page.getByRole('button', { name: 'Apply rule settings', exact: true }).click()
  await expect(page.getByRole('textbox', { name: 'Seed bits', exact: true })).toHaveValue(
    '11111111',
  )
  await expect(page.locator('[data-ui="on-count"]')).toHaveText('8')
  await page.getByRole('spinbutton', { name: 'Rule number', exact: true }).fill('256')
  await page.getByRole('button', { name: 'Apply rule settings', exact: true }).click()
  await expect(page.locator('[data-ui="settings-form"]').getByRole('alert')).toContainText(
    '0 to 255',
  )
  const json = JSON.parse((await deliver(page, 'JSON')).buffer.toString('utf8'))
  expect(json.rule).toBe(255)
  expect(json.seed).toBe('00000000')
  expect(json.grid).toBeUndefined()
  expect(json.mode).toBeUndefined()
})
