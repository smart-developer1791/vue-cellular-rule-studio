import { stamp } from '../services/files.ts'
export const author = 'CodeSculptor'
export function single(value: unknown, label: string, max: number, empty = false): string {
  if (
    typeof value !== 'string' ||
    value.length > max ||
    (!empty && !value.trim()) ||
    /[\u0000-\u001F\u007F]/.test(value)
  )
    throw new Error(`${label} must be ${empty ? 'at most' : '1–'}${max} single-line characters.`)
  return value
}
export function integer(value: unknown, label: string, min: number, max: number) {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < min || value > max)
    throw new Error(`${label} must be an integer from ${min} to ${max}.`)
  return value
}
export function provenance(prefix: string, project: string, value: unknown) {
  return { project, author, marker: stamp(prefix, value) }
}
