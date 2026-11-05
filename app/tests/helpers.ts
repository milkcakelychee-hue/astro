import { readFileSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createSwe, type Swe } from '../src/engine/swe.ts'
import type { BirthInput, Pt } from '../src/engine/chart.ts'

const here = dirname(fileURLToPath(import.meta.url))
export const ENGINE_DIR = join(here, '../../engine')

let sweP: Promise<Swe> | null = null
export function getSwe(): Promise<Swe> {
  sweP ??= (async () => {
    const dir = join(ENGINE_DIR, 'ephe')
    const files: Record<string, Uint8Array> = {}
    for (const f of readdirSync(dir)) files[f] = new Uint8Array(readFileSync(join(dir, f)))
    return createSwe(files)
  })()
  return sweP
}

export interface PosExp {
  min: number
  retro: boolean
  house: number | null
}
export interface Seek1 {
  input: BirthInput
  city: string
  pos: Record<string, PosExp>
  cusps: number[]
  pa: Record<string, [number, string]>
  oa: Record<string, [number, string]>
  dom: number[][]
  el: number[][]
}
export interface Seek2 {
  input: BirthInput
  city: string
  dom: number[][]
  el: number[][]
  sig: string
  n: number
  xf: { a: Pt; b: Pt; t: string; orb: number; flag: string }[]
}

/** คีย์มุมแบบไม่สนลำดับคู่ */
export const akey = (a: string, b: string, t: string) => [a, b].sort().join('') + t

function parseAsp(s: string): Record<string, [number, string]> {
  const out: Record<string, [number, string]> = {}
  for (const t of s.split(',')) {
    if (!t) continue
    out[akey(t[0]!, t[2]!, t[1]!)] = [parseInt(t.slice(3, -1), 10), t.slice(-1)]
  }
  return out
}
const nums = (s: string) => s.split(',').map((x) => x.split('.').map(Number))

export function loadSeek1(): Seek1[] {
  const lines = readFileSync(join(ENGINE_DIR, 'seek.txt'), 'utf8').split(/\r?\n/).filter((l) => l.trim())
  return lines.map((line) => {
    const p = line.trim().split('#')
    const h = p[0]!.split('/')
    const pos: Record<string, PosExp> = {}
    for (const t of p[1]!.split(',')) {
      const k = t[0]!
      const retro = t.includes('r')
      const [v, hs] = t.slice(1).replace('r', '').split('h')
      pos[k] = { min: parseInt(v!, 10), retro, house: hs ? parseInt(hs, 10) : null }
    }
    return {
      input: { y: +h[0]!, mo: +h[1]!, d: +h[2]!, hh: +h[3]!, mi: +h[4]!, lat: +h[6]! + +h[7]! / 60, lon: +h[8]! + +h[9]! / 60 },
      city: h[5]!,
      pos,
      cusps: p[2]!.split(',').map(Number),
      pa: parseAsp(p[3]!),
      oa: parseAsp(p[4]!),
      dom: nums(p[5]!),
      el: nums(p[6]!),
    }
  })
}

export function loadSeek2(): Seek2[] {
  const lines = readFileSync(join(ENGINE_DIR, 'seek2.txt'), 'utf8').split(/\r?\n/).filter((l) => l.trim())
  return lines.map((line) => {
    const i = line.indexOf('|')
    const h = JSON.parse(line.slice(0, i)) as [number, number, number, number, number, string, number, number, number, number]
    const p = line.slice(i + 1).trim().split('#')
    return {
      input: { y: h[0], mo: h[1], d: h[2], hh: h[3], mi: h[4], lat: h[6] + h[7] / 60, lon: h[8] + h[9] / 60 },
      city: h[5],
      dom: nums(p[0]!),
      el: nums(p[1]!),
      sig: p[2]!,
      n: parseInt(p[3]!, 10),
      xf: p[4]!.split(',').map((e) => ({
        a: e[0] as Pt,
        t: e[1]!,
        b: e[2] as Pt,
        orb: parseInt(e.slice(3, -1), 10),
        flag: e.slice(-1),
      })),
    }
  })
}
