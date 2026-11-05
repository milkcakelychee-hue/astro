// ตรวจเบื้องต้นว่า swisseph-wasm ใช้ฟังก์ชันที่สูตรต้องการได้ และโหลด .se1 จาก engine/ephe ได้
// รัน: node scripts/smoke-swisseph.mjs   (ค่าคาดหวัง: docs/02-reference-chart.md)
import SwissEph from 'swisseph-wasm';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const epheDir = join(here, '../../engine/ephe');

const swe = new SwissEph();
await swe.initSwissEph();
const M = swe.SweModule;
console.log('FS available:', !!M.FS);

try { M.FS.mkdir('/eph'); } catch {}
for (const f of readdirSync(epheDir)) {
  M.FS.writeFile('/eph/' + f, new Uint8Array(readFileSync(join(epheDir, f))));
}
swe.set_ephe_path('/eph');

const jd = swe.julday(1999, 8, 5, 13 + 33 / 60); // UT = 20:33 - 7h
const fl = swe.SEFLG_SWIEPH | swe.SEFLG_SPEED;
const fmt = (x) => {
  const s = Math.floor(x / 30), d = x - s * 30;
  return `sign${s} ${Math.floor(d)}°${Math.floor((d % 1) * 60)}′`;
};
const names = { Sun: 0, Moon: 1, Saturn: 6, Chiron: 15 };
for (const [n, id] of Object.entries(names)) {
  const r = swe.calc_ut(jd, id, fl);
  console.log(n, fmt(r[0]), r);
}
const tp = swe.calc_ut(jd, 15, fl | swe.SEFLG_TRUEPOS);
console.log('Chiron TRUEPOS', fmt(tp[0]));
console.log('has set_delta_t_userdef', typeof swe.set_delta_t_userdef,
  '| houses_armc', typeof swe.houses_armc, '| sidtime', typeof swe.sidtime);
