# PROGRESS.md — บันทึกความคืบหน้า / ส่งต่องานระหว่างเครื่อง

> อ่านไฟล์นี้ก่อนทำงานต่อทุกครั้ง แล้วอัปเดตท้ายไฟล์ทุกครั้งที่จบช่วงงาน
> ตอบผู้ใช้เป็นภาษาไทย · กฎหลักอยู่ใน `CLAUDE.md` · แผนที่อนุมัติ: ดูหัวข้อ "แผน" ด้านล่าง

## วิธีย้ายไปทำต่อบนอีกเครื่อง
1. คัดลอกทั้งโฟลเดอร์ `astro-app-handoff` (ZIP / USB / คลาวด์) **ยกเว้น** `app/node_modules/` และ `app/dist/` (สร้างใหม่ได้)
2. ติดตั้ง Node LTS (ปัจจุบันใช้ v26.13) : `winget install OpenJS.NodeJS.LTS`
3. `cd app` แล้วรัน `npm install`
4. เปิด Claude Code ในโฟลเดอร์ `astro-app-handoff` แล้วพิมพ์: "อ่าน PROGRESS.md แล้วทำต่อจากจุดที่ค้าง"
5. ก่อนย้ายกลับ: ให้ Claude อัปเดต PROGRESS.md ก่อนปิดเซสชันเสมอ
(ไม่ต้องติดตั้ง Python/pyswisseph — ตัดสินใจข้ามแล้ว ดูบันทึกการตัดสินใจ)

## แผน (อนุมัติแล้ว)
เทคโนโลยี: Vite + TypeScript + Preact · vite-plugin-pwa · IndexedDB (idb) · swisseph-wasm + ไฟล์ .se1 · Web Worker · Vitest · Playwright
ลำดับ: 0 ติดตั้งเครื่องมือ → 1 โปรเจกต์ PWA → 2 engine TS + test 100% → 3 คลังข้อความ → 4 design tokens/คอมโพเนนต์ → 5 ทำทีละหน้าตาม canvas.json (ให้ผู้ใช้ดูทุกหน้า)
แผนฉบับเต็มสรุปไว้ในไฟล์นี้แล้ว

## การตัดสินใจระหว่างทำงาน
- ติดตั้ง Node LTS ผ่าน winget แล้ว (เครื่อง 1, 5 พ.ย. 2569)
- ลง Python 3.13 แล้วแต่ pyswisseph ติดตั้งไม่ได้ (ไม่มี wheel Windows + ไม่มี C++ Build Tools) → **ผู้ใช้เลือกทางที่ 2: ข้าม** ทดสอบ TypeScript กับค่าจาก astro-seek (`docs/02`, `engine/tests/seek*.txt`) เท่านั้น ถ้าเจอความต่างที่หาสาเหตุไม่ได้ ค่อยลง VS Build Tools
- ตัวโปรเจกต์แอปอยู่ในโฟลเดอร์ `app/` เพื่อให้ย้ายทั้งโฟลเดอร์ได้ง่าย

## คำถามที่ยังรอผู้ใช้ตอบ (ห้ามตัดสินใจเอง)
1. ธีมสว่าง/ตามเครื่อง: มีดีไซน์สว่างแค่ ChartLight → ทำสว่างทั้งแอป / เฉพาะชาร์ต / มืดอย่างเดียวก่อน
2. tab bar บน iPhone ต้อง fixed + safe-area (เปลี่ยน padding เล็กน้อย) — อนุมัติไหม
3. Settings: ลบสวิตช์ sidereal/orb ที่ค้างในสคริปต์ · สวิตช์แสดงดาว (Lilith/Chiron ฯลฯ) ทำเป็นตัวเลือกแสดงผลได้ไหม
4. วันที่ข้อมูลตัวอย่าง: CLAUDE.md = 1–4 พ.ย. 2569 แต่หน้า Today = 31 ต.ค. 2569 10:00 — ใช้ค่าไหนเป็น test
5. หน้าที่ดีไซน์ไม่มี (โหลด/ว่าง/ผิดพลาด/แก้ไขคน): จะเสนอแบบให้ดูก่อน
6. เลขศาสตร์ชื่อไทย: รอตารางค่าตัวอักษร
7. Cycles: ใช้ Mean Node + แก้หมายเหตุตามจริง (ตาม CLAUDE.md อยู่แล้ว)

## ข้อมูลสำคัญที่สำรวจไว้แล้ว (ไม่ต้องสำรวจซ้ำ)
- ฟอนต์ดีไซน์: IBM Plex Sans Thai Looped 300–700 (Google Fonts → ต้อง self-host)
- ไม่มีรูป/CDN/canvas · วงล้อชาร์ตเป็น inline SVG ตัวแปร CSS `--ring --core --line --fg --muted --accent --fire --earth --air --water`
- tab bar 5 แท็บ ปุ่มกลางลอย (88px) เดิมเป็น absolute → ต้องเป็น fixed
- ไม่มีตัวแปรธีมแอป ค่าสีอยู่ inline (พื้นหลัง `#06070D`, ตัวอักษร `#F2F4FA`, accent `#B9A6FF` ฯลฯ — ดู DesignSystem.dc.html)
- ค่าที่ตั้ง engine ต้องการ: ΔT userdef (floor), houses_armc, FLG_TRUEPOS (Chiron) → ต้องตรวจว่า swisseph-wasm รองรับ
- README อ้างถึง START-PROMPT.md ซึ่งไม่มีในโฟลเดอร์ (ไม่จำเป็น) · ไฟล์ .docx = เนื้อหาเดียวกับ CLAUDE.md

## สถานะงาน
- [x] 0 ติดตั้ง Node + (Python 3.13)
- [~] 1 ตั้งโปรเจกต์ `app/` — สร้างแล้ว (Vite 8 + Preact + TS, ติดตั้ง swisseph-wasm, idb, vite-plugin-pwa, vitest) · **ยังไม่ได้ตั้งค่า**: PWA manifest/service worker, script `test` ของ vitest, self-host ฟอนต์, ลบหน้าตัวอย่างของ template
- [ ] 2 engine + test
- [ ] 3 คลังข้อความ
- [ ] 4 design tokens/คอมโพเนนต์
- [ ] 5 หน้าต่าง ๆ (ยังไม่เริ่ม; ลำดับ: Main, Aspects, ChartLight, Sheet, Today, People, AddPerson, Compare, Forecast, Settings, Calendar, Timeline, Transit, Lunations, SolarReturn, LunarReturn, Growth, Retrograde, MoonPhases, Eclipses, VenusRose, Cycles, Ephemeris, Electional, Numerology, Symbols)

## ล็อกการทำงาน (เพิ่มท้ายไฟล์ ใหม่สุดอยู่ล่าง)
- 5 พ.ย. 2569 (เครื่อง 1): สร้าง `app/`, ตรวจ swisseph-wasm 0.1.0 ด้วย `app/scripts/smoke-swisseph.mjs` (`node scripts/smoke-swisseph.mjs`) → **ผ่าน**: มี `set_delta_t_userdef`, `houses_armc`, `sidtime`, `SEFLG_TRUEPOS`; โหลด `engine/ephe/*.se1` เข้า FS เสมือนด้วย `SweModule.FS.writeFile('/eph/..')` + `set_ephe_path('/eph')`; ตำแหน่ง Sun/Moon/Saturn/Chiron ของชาร์ตอ้างอิงตรง docs/02 (ระดับลิปดา). หมายเหตุ: สคริปต์จบด้วย exit code 255 แม้ผลครบ (ข้อควรระวังของ wasm ไม่กระทบ) · แพ็กเกจนี้ **ไม่ต้องสร้าง swisseph เอง**
- 5 พ.ย. 2569 (เครื่อง 1): อ่าน CLAUDE.md + docs ทั้งหมด + สำรวจดีไซน์ 27 หน้า, อนุมัติแผน, ติดตั้ง Node, สร้างไฟล์นี้

- 5 พ.ย. 2569 (เครื่อง 1): ทำ repo สาธารณะ https://github.com/milkcakelychee-hue/astro — เปลี่ยนชื่อ 'บลู' เป็น 'ตัวอย่าง' ในดีไซน์/เอกสาร (วันเกิดตัวอย่างยังอยู่ เพราะเป็นข้อมูลทดสอบ) · `docs/06` ไม่ขึ้น repo (อยู่ใน .gitignore, เป็นตัวอย่างอ้างอิงเท่านั้น ไม่จำเป็นต่องาน) · สร้าง git ใหม่ ไม่มีประวัติเก่า · ผู้เขียน commit ใช้อีเมล noreply ของ GitHub
- ทำงานอีกเครื่อง: `git clone https://github.com/milkcakelychee-hue/astro.git` แล้ว `cd astro/app && npm install` · ก่อนเลิกงาน commit+push ทุกครั้ง · เริ่มงานให้ `git pull` ก่อน · ห้ามใส่ข้อมูลส่วนตัวจริง/ไฟล์สำรอง JSON/โทเคนลง repo นี้ (เป็น Public)