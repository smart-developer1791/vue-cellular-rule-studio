import { record } from './validation.ts'
import { single, integer, provenance } from './shared.ts'
export type Workspace = {
  version: 1
  name: string
  rule: number
  rows: number
  boundary: 'wrap' | 'empty'
  seed: string
  ink: string
}
export function parse(value: unknown): Workspace {
  const w = record(value, 'Workspace')
  if (w.version !== 1) throw new Error('Unsupported workspace version.')
  if (w.boundary !== 'wrap' && w.boundary !== 'empty')
    throw new Error('Boundary must be wrap or empty.')
  if (typeof w.seed !== 'string' || !/^[01]{8,64}$/.test(w.seed))
    throw new Error('Seed must have 8–64 bits, using only 0 and 1.')
  if (typeof w.ink !== 'string' || !/^#[0-9a-f]{6}$/i.test(w.ink))
    throw new Error('Ink must be six-digit HEX.')
  return {
    version: 1,
    name: single(w.name, 'Workspace name', 80),
    rule: integer(w.rule, 'Rule', 0, 255),
    rows: integer(w.rows, 'Row count', 1, 64),
    boundary: w.boundary,
    seed: w.seed,
    ink: w.ink.toUpperCase(),
  }
}
export function serialize(value: unknown) {
  const w = parse(value)
  return { ...w, provenance: provenance('CA', 'vue-cellular-rule-studio', w) }
}
export function lookup(rule: number) {
  return Array.from({ length: 8 }, (_, i) => {
    const n = 7 - i
    return { neighborhood: n.toString(2).padStart(3, '0'), result: (rule >> n) & 1 }
  })
}
export function evolve(w: Workspace): number[][] {
  const grid = [Array.from(w.seed, Number)],
    width = w.seed.length
  while (grid.length < w.rows) {
    const prior = grid[grid.length - 1]!,
      at = (i: number) => (w.boundary === 'wrap' ? prior[(i + width) % width]! : (prior[i] ?? 0))
    grid.push(prior.map((_, i) => (w.rule >> (4 * at(i - 1) + 2 * at(i) + at(i + 1))) & 1))
  }
  return grid
}
export function runPath(grid: number[][]) {
  const paths: string[] = []
  for (const [y, row] of grid.entries())
    for (let x = 0; x < row.length;) {
      if (!row[x]) {
        x++
        continue
      }
      const start = x
      while (x < row.length && row[x]) x++
      paths.push('M' + start + ' ' + y + 'h' + (x - start) + 'v1h-' + (x - start) + 'z')
    }
  return paths.join('')
}
export function escape(s: string) {
  return s.replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!,
  )
}
export function svgExport(w: Workspace) {
  return (
    '<svg xmlns="http://www.w3.org/2000/svg" width="' +
    w.seed.length * 10 +
    '" height="' +
    w.rows * 10 +
    '" viewBox="0 0 ' +
    w.seed.length +
    ' ' +
    w.rows +
    '" role="img" aria-labelledby="title desc" shape-rendering="crispEdges"><title id="title">' +
    escape(w.name) +
    '</title><desc id="desc">Rule ' +
    w.rule +
    ', ' +
    w.boundary +
    ' boundary, ' +
    serialize(w).provenance.marker +
    ' · CodeSculptor</desc><rect width="' +
    w.seed.length +
    '" height="' +
    w.rows +
    '" fill="white"/><path d="' +
    runPath(evolve(w)) +
    '" fill="' +
    w.ink +
    '"/></svg>'
  )
}
export function pbmExport(w: Workspace) {
  const pixels = evolve(w).flat(),
    lines = [
      'P1',
      '# ' + serialize(w).provenance.marker + ' / CodeSculptor',
      w.seed.length + ' ' + w.rows,
    ]
  for (let i = 0; i < pixels.length; i += 32) lines.push(pixels.slice(i, i + 32).join(' '))
  return lines.join('\n') + '\n'
}
export function textExport(w: Workspace) {
  return (
    w.name +
    '\n' +
    serialize(w).provenance.marker +
    '\nCellular Rule Studio · CodeSculptor\nRule: ' +
    w.rule +
    '\nBoundary: ' +
    w.boundary +
    '\nWidth: ' +
    w.seed.length +
    '\nRows (including seed): ' +
    w.rows +
    '\nInk: ' +
    w.ink +
    '\n\nNEIGHBORHOOD -> NEXT CELL\n' +
    lookup(w.rule)
      .map((r) => r.neighborhood + ' -> ' + r.result)
      .join('\n') +
    '\n\nROWS\n' +
    evolve(w)
      .map((row, i) => i + 1 + ': ' + row.join(''))
      .join('\n')
  )
}
