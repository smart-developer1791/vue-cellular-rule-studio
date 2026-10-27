import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
const fixture = JSON.parse(
  readFileSync(new URL('../public/sample-workspace.json', import.meta.url), 'utf8'),
)

import {
  parse,
  serialize,
  evolve,
  lookup,
  runPath,
  svgExport,
  pbmExport,
  textExport,
} from '../src/domain/automaton.ts'
test('sample rule 30 follows known opening rows and canonical UTF-8 provenance', () => {
  const w = parse({ ...fixture, seed: '000010000', rows: 4, boundary: 'empty' })
  assert.deepEqual(
    evolve(w).map((r) => r.join('')),
    ['000010000', '000111000', '001100100', '011011110'],
  )
  assert.equal(
    lookup(30)
      .map((r) => r.result)
      .join(''),
    '00011110',
  )
  assert.deepEqual(parse(serialize(w)), w)
  assert.match(serialize(w).provenance.marker, /^CA-[A-F0-9]{8}$/)
  assert.notEqual(
    serialize({ ...w, name: '🙂' }).provenance.marker,
    serialize({ ...w, name: '🙃' }).provenance.marker,
  )
})
test('all 256 rules and eight neighborhoods select the corresponding ordered bit', () => {
  for (let rule = 0; rule < 256; rule++)
    for (let neighborhood = 0; neighborhood < 8; neighborhood++) {
      const bits = neighborhood.toString(2).padStart(3, '0'),
        w = parse({ ...fixture, rule, seed: '000' + bits + '000', rows: 2 })
      assert.equal(evolve(w)[1]![4], Number(rule.toString(2).padStart(8, '0')[7 - neighborhood]))
    }
})
test('empty/wrapped edges differ correctly and constant/copy/XOR rules retain expected states', () => {
  const w = parse({ ...fixture, seed: '10000000', rows: 4, rule: 90 })
  assert.equal(evolve(w)[1]![7], 1)
  assert.equal(evolve({ ...w, boundary: 'empty' })[1]![7], 0)
  assert.deepEqual(
    evolve({ ...w, rule: 204 }),
    Array.from({ length: 4 }, () => Array.from(w.seed, Number)),
  )
  assert.deepEqual(
    evolve({ ...w, rule: 0 }).slice(1),
    Array.from({ length: 3 }, () => Array(8).fill(0)),
  )
  assert.deepEqual(
    evolve({ ...w, rule: 255 }).slice(1),
    Array.from({ length: 3 }, () => Array(8).fill(1)),
  )
  assert.equal(evolve({ ...w, rows: 1 }).length, 1)
})
test('merged SVG runs cover every one cell exactly once without covering zeros', () => {
  const grid = evolve(parse(fixture)),
    seen = new Set<string>()
  for (const m of runPath(grid).matchAll(/M(\d+) (\d+)h(\d+)v1h-\d+z/g))
    for (let x = Number(m[1]); x < Number(m[1]) + Number(m[3]); x++) {
      const key = x + ',' + m[2]
      assert.equal(seen.has(key), false)
      seen.add(key)
    }
  grid.forEach((row, y) => row.forEach((bit, x) => assert.equal(seen.has(x + ',' + y), !!bit)))
})
test('strict seed, dimensions, rule, boundary, color and primitive guards reject malformed candidates', () => {
  for (const change of [
    (w: any) => (w.seed = '010'),
    (w: any) => (w.seed = '0'.repeat(65)),
    (w: any) => (w.seed = '0000000x'),
    (w: any) => (w.rule = '30'),
    (w: any) => (w.rule = 256),
    (w: any) => (w.rule = -1),
    (w: any) => (w.rows = 0),
    (w: any) => (w.rows = 1.5),
    (w: any) => (w.boundary = 'mirror'),
    (w: any) => (w.ink = '#fff'),
    (w: any) => (w.version = 2),
  ]) {
    const w = structuredClone(fixture)
    change(w)
    assert.throws(() => parse(w))
  }
  assert.equal(parse({ ...fixture, ink: '#abcdef' }).ink, '#ABCDEF')
})
test('maximum plain PBM is ASCII P1 with exact raster, short lines, and escaped complete SVG/TXT/JSON', () => {
  const w = parse({
      ...fixture,
      name: '<script>' + '"'.repeat(64),
      seed: '1'.repeat(64),
      rows: 64,
      rule: 255,
    }),
    pbm = pbmExport(w),
    tokens = pbm
      .replace(/#[^\n]*/g, '')
      .trim()
      .split(/\s+/)
  assert.deepEqual(tokens.slice(0, 3), ['P1', '64', '64'])
  assert.equal(tokens.length, 4099)
  assert.ok(tokens.slice(3).every((t) => t === '1'))
  assert.ok(pbm.split('\n').every((line) => line.length <= 70))
  assert.ok(/^[\x00-\x7F]*$/.test(pbm))
  assert.ok(svgExport(w).includes('&lt;script&gt;'))
  assert.equal(svgExport(w).includes('<script>'), false)
  assert.ok(textExport(w).includes('64: ' + '1'.repeat(64)))
  assert.ok(textExport(w).includes(serialize(w).provenance.marker))
  assert.ok(JSON.stringify(serialize(w), null, 2).length < 120000)
  assert.deepEqual(parse(serialize(w)), w)
})
