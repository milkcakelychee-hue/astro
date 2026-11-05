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
- ✅ ตอบแล้ว: ธีม = มืดทั้งแอป + ChartLight ตามดีไซน์ (ไม่ออกแบบสว่างเพิ่ม) · แท็บล่าง = fixed + safe-area (อนุมัติ)
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
- [x] 1 ตั้งโปรเจกต์ `app/` — A1–A3 เสร็จ: ฟอนต์ self-host (`@fontsource/ibm-plex-sans-thai-looped` ไทย+ละติน 300–700, `src/fonts.ts`) · PWA (vite-plugin-pwa, precache 24 ไฟล์ ~7.5 MB รวม ephe/wasm/คลัง) · `scripts/copy-assets.mjs` คัดลอก `engine/ephe` + `swisseph.wasm/.data` เข้า `public/` อัตโนมัติก่อน dev/build (gitignore) · `src/engine/ephe-browser.ts` โหลด ephe ในเบราว์เซอร์ · ทดสอบ `npm run build` + preview: คำนวณได้ และ**ใช้ออฟไลน์ได้** (หยุดเซิร์ฟเวอร์แล้วรีโหลดยังทำงาน) · `src/app.tsx` ตอนนี้เป็นหน้าตรวจระบบชั่วคราว · **ไอคอนแอปยังรอผู้ใช้** (ใช้ favicon.svg ชั่วคราว; iPhone ต้องมี PNG 180px)
- [~] 2 engine + test — **B1–B5 ผ่าน** (`app/src/engine/`: swe, chart, aspects, dominants, places; `app/tests/engine.test.ts` 9 tests): 41 ชาร์ต + docs/02 ตรง 100% ยกเว้น Fortune orb 3 รายการที่ docs/01 บันทึกไว้แล้ว (205/208) · **เหลือ B6–B7** (เหตุการณ์/bisection, VOC, อุปราคา, SR/LR, Progressions, Solar Arc, PD, Synastry) ทำก่อนหน้าที่ต้องใช้
- [x] 3 คลังข้อความ — `app/src/lib/interp.ts` (โหลด lazy แยก chunk, คีย์ aspect/transit/synastry/direction/sign/house, รหัสมุม engine→คลัง 0→c 6→x 4→q 3→t 8→o) · `tests/interp.test.ts` ผ่าน: 14 หมวดครบ, ทุกดาว/มุมของ 41 ชาร์ตหาข้อความเจอ · คลังไม่มีข้อความของ Fortune/Vertex/DSC/IC
- [~] 4 design tokens/คอมโพเนนต์ — `src/index.css` (tokens + คลาสกลางที่ใช้ร่วมกันหลายหน้า), `src/ui/components.tsx` (Page, BackLink, PageTitle+?, Card, Seg, Chip, Toggle, PrimaryButton, LevelBar, Chevron), `src/ui/TabBar.tsx` (fixed + เว้นล่าง max(26px, safe-area) — ผู้ใช้อนุมัติแล้ว), hash router ใน `app.tsx`, หน้าตรวจ `pages/DesignPreview.tsx` · เทียบตำแหน่งกับ DesignSystem.dc.html ที่ 390px ตรงทุกพิกเซลที่วัด · เปิดไฟล์ดีไซน์ใน dev ได้ที่ `http://localhost:5173/@fs/<path>/design/X.dc.html`
  - **ข้อควรระวัง Preact 11**: style ตัวเลขไม่เติม px ให้แล้ว → เขียน `'44px'` เสมอ (ยกเว้น lineHeight/fontWeight/flex/zIndex)
  - คลาสชื่อเดียวกันแต่ค่าต่างกันในบางหน้า (.card มุม 20 ใน Main/Compare/Today, .chip/.seg หลายแบบ) → override ในสไตล์ของหน้านั้นตอนทำขั้น E
  - พื้นหลังไล่เฉดต่างกันทุกหน้า → ส่งค่า `background` ของหน้านั้นเข้า `<Page>`
- [~] 5 หน้าต่าง ๆ — **Main (ภาพรวม) ทำแล้ว รอผู้ใช้ตรวจ**: `src/pages/Main.tsx` + `main.css` + `ui/ChartWheel.tsx` (วงชาร์ต SVG ตามรัศมีดีไซน์) + `data/people.ts` (IndexedDB) + ชื่อจังหวัดไทยใน `places.ts` · ตัวเลขตรงดีไซน์ทุกค่า (ธาตุ 27, ดาวเด่น 89, มุม 18/34) · dev มีปุ่มโหลดชาร์ตตัวอย่าง (เฉพาะ DEV) · **ค้าง**: (ก) เพิ่มหมวดข้อความใน lib/gen2.py สำหรับสรุป Big Three / ย่อหน้าธาตุ / ย่อหน้าดาวเด่น / Key Planet / Aspect Patterns — ผู้ใช้อนุมัติแนวทางแล้ว ต้องให้ดูตัวอย่างข้อความก่อนใช้, (ข) ออกแบบหมวด ดาว/เรือน/มุมดาว/สถิติ/ขั้นสูง ให้ผู้ใช้ดูก่อน, (ค) หน้าว่าง MainEmpty เป็นข้อเสนอรออนุมัติ, (ง) ปุ่ม ? ของแต่ละส่วน (.help) ดีไซน์ไม่มีเนื้อหา, (จ) แตะวงชาร์ต → หน้า Sheet · เกณฑ์ Key Planet/Patterns = ตามคำอธิบายในดีไซน์ (ต้องเพิ่มใน docs/04) (ลำดับ: Main, Aspects, ChartLight, Sheet, Today, People, AddPerson, Compare, Forecast, Settings, Calendar, Timeline, Transit, Lunations, SolarReturn, LunarReturn, Growth, Retrograde, MoonPhases, Eclipses, VenusRose, Cycles, Ephemeris, Electional, Numerology, Symbols)
  - **หน้าที่ผู้ใช้ผ่านแล้ว (5 พ.ย.)**: Main · AddPerson (`#/add`, ตัดช่องโน้ตตามผู้ใช้; ปุ่ม "เพิ่มหมวด" ยังไม่ทำ รอออกแบบตัวเลือกไอคอน) · Aspects (`#/aspects`) · ChartLight = โทนสว่างของ Main (`ui/theme.ts` ตาราง LIGHT_MAP + `main-light.css` สร้างด้วยสคริปต์, ค่าเริ่มต้น 'ตามเครื่อง', เก็บใน localStorage 'theme') · Sheet = `PlanetSheet.tsx` เปิดด้วย `#/main?p=<จุด>` จากการแตะดาวในวงชาร์ต, โน้ตส่วนตัวเก็บ IndexedDB store `notes` (DB v2)
  - ซ่อนไว้รอคลัง gen2: สรุป 1 บรรทัด/คำแนะนำใน Sheet, ข้อความมุมที่มี F/X/D/I · Sheet ยังไม่มี Grand Cross (ยังไม่ได้ทำ patterns) และคำศัพท์แตะดู
  - หน้า `#/design` (DEV เท่านั้น) มีลิงก์ไปทุกหน้าที่ทำแล้ว + ปุ่มสลับธีม — ทำหน้าใหม่แล้วเพิ่มลิงก์ที่นั่นด้วย
  - **Today (`#/today`) ทำแล้ว รอผู้ใช้ตรวจ** (5 พ.ย. เครื่อง Mac): `engine/sky.ts` (ตำแหน่งดาวจร, ข้าง/ค่ำ/ความสว่าง, ย้ายราศีด้วย bisection, VOC, ศักดิ์ 7 ดาว, ทรานซิต orb ≤2°/3° ห้ารายการแรกเรียงดาวช้าก่อน + ระยะผลจากเวลาที่พ้น orb) · `tests/sky.test.ts` เทียบข้อมูลดีไซน์ 31 ต.ค. 69 10:00 ตรงทุกค่า ยกเว้น (1) ราหู ดีไซน์ 26°58′ = True Node แอปใช้ Mean 26°07′ (2) เวลาย้ายราศีในดีไซน์เป็นค่าปัด/ตัวอย่าง (จันทร์ 11:20 → คำนวณได้ 11:18; อาทิตย์ 23 พ.ย. → 22 พ.ย. 14:23) · [dev] `#/today?at=2026-10-31T10:00` จำลองเวลา
    - ตั้งเอง (ต้องให้ผู้ใช้ยืนยัน): คำอธิบายสั้นของ อุจ "ได้รับยกย่อง ทำงานได้ดี" / ประ "ดาวเสีย ทำงานได้ไม่เต็มที่" · ป้ายระยะผล (≤2.5 วัน = "วันนี้–N วัน" สีเขียว, ≤10 วัน ไม่กี่วัน, ≤60 หลายสัปดาห์, ≤365 หลายเดือน, เกินนั้นหลายปี) · ย้ายราศีเกิน 8 ปี = "อยู่ราศี X อีกหลายปี" · ไม่มีชาร์ตของฉัน → ซ่อนส่วนทรานซิต · ภาพดวงจันทร์วาดตามข้างจริง (ดีไซน์เป็นรูปตายตัว)
    - แบนเนอร์ดาวเสีย + คำอธิบายศักดิ์ในแถว ใช้ข้อความจากคลัง planet_sign แล้ว (ไม่มีข้อความตั้งเองเหลือ) · ผู้ใช้ขอ: วันที่จัดกึ่งกลางตัวเลข/เดือน, แถวดาวที่กางเป็นกรอบเดียวต่อเนื่อง
    - ✅ ตรวจกับ astro-seek แล้ว: Node = Mean (หน้า Ephemeris ตั้ง Mean, 1 พ.ย. 26°04′) · วันย้ายราศี 7 รายการตรงวัน ต่าง ≤1 นาที · จันทร์เข้าสิงห์ 11:18 + VOC 4–5 พ.ย. ตรงทุกนาที (เทสต์ใน sky.test.ts) · เปิด astro-seek ได้ผ่าน Claude in Chrome (WebFetch โดน 403) · หน้า VOC อยู่ที่ mooncalendar.astro-seek.com
    - Personal Transit Calendar ของ astro-seek (กรอกชาร์ตตัวอย่างแล้ว) ให้แค่ **เวลามุมตรงพอดี** ไม่มีช่วงเริ่ม–จบ/orb → ป้ายระยะผลเทียบเว็บไม่ได้ เป็นเกณฑ์ของแอป (เวลามุมตรงพอดีเคยตรวจผ่านแล้วใน docs/08) · Transits Tracker ก็ให้แค่เวลาตรงพอดี (ไม่มี orb) — ใช้เป็นเทสต์ ยูเรนัส□ศุกร์ 3 ครั้งตรง ±2 นาที
    - แตะรายการทรานซิตยังไม่ไปไหน (รอหน้า Forecast/Transit)
  - **People (`#/people`) ทำแล้ว รอผู้ใช้ตรวจ**: รายชื่อไม่รวมฉัน (ผู้ใช้ขอ; ฉันโผล่เฉพาะโหมดเลือกเปรียบเทียบ อยู่บนสุด) ราศีอาทิตย์/จันทร์/AC คำนวณจริง · ค้นหาชื่อหรือราศี · โหมดเลือก 2 คน (ค่าเริ่มต้นปิด; ดีไซน์เปิดไว้เพื่อสาธิต) → `#/compare?a=&b=` (ยังไม่ทำ) · แตะคน → `#/people?id=<id>` (ผู้ใช้ขอ: อยู่ในแท็บบุคคล) ใช้ MainView เดิม + BackLink "‹ บุคคล" หัวข้อ = ชื่อ · AddPerson: เวลาเกิดเป็น select เลื่อนเลือก (ผู้ใช้ขอ) ตัดคำอธิบายระบบ 24 ชม. · เพิ่มคนที่ไม่ใช่ฉันแล้วกลับ `#/people` · ป้ายความสัมพันธ์/สีรูปย่อใน `data/people.ts` (ที่ทำงาน = สีแถว 5 ของดีไซน์) · อักษรรูปย่อข้ามสระหน้า
  - **Compare (`#/compare?a=&b=`) ทำแล้ว รอผู้ใช้ตรวจ**: `engine/synastry.ts` (synastry ดาว 10 ดวง orb ≤3°, composite = จุดกึ่งกลางดาว+ปลายเรือน, davison = JD/พิกัดกึ่งกลาง) · `ui/CompareWheel.tsx` วงซ้อน (วงใน r95 วงนอก r127 เส้นมุมที่ r70 แตะเส้น→เลื่อนไปที่รายการ) · `tests/synastry.test.ts`: 8 มุมแรก + จำนวนเส้น 12 ตรงดีไซน์ทุกลิปดา · ภาพรวม 5 หมวด = ข้อความ synastry จากคลังของมุมแน่นสุดในหมวด (รัก=ศุกร์, สื่อสาร=พุธ, อารมณ์=จันทร์, ขัดแย้ง=มุมแข็งกับอังคาร/เสาร์/พลูโต, ระยะยาว=พฤหัส/เสาร์ — เกณฑ์ตั้งเอง) · รายการมุมแบ่งกลุ่ม (ผู้ใช้เลือก): ส่งเสริมกัน △⚹ / ต้องปรับเข้าหากัน □☍ / ผูกพันแน่น ☌ — โชว์ 2 + ดูเพิ่ม · มุมรุ่น (ยูเรนัส/เนปจูน/พลูโต ทั้งสองฝั่ง) พับไว้ท้าย · แตะเส้นในวงล้อ → กางกลุ่มแล้วเลื่อนไป · ✅ Composite/Davison เทียบ astro-seek แล้ว (ชาร์ตหลัก×ชาร์ตคู่): ดาว 10 ดวง ลิปดา+เรือน + AC/MC ตรงทั้งหมด — Composite = จุดกึ่งกลางดาวและปลายเรือน (เว็บเรียก Midpoint, short-arc MC) · Davison = JD กึ่งกลาง + พิกัดกึ่งกลาง **ปัดลงเป็นลิปดาเต็ม** · หน้า composite ของเว็บ: horoscopes.astro-seek.com/composite-chart-horoscope (มี Cloudflare ให้ผู้ใช้กดยืนยันเอง) (วิธีปลายเรือน composite ตั้งเอง)
  - ความลื่นไหล (ผู้ใช้ขอ): ล็อกซูม (viewport + กัน gesture ใน main.tsx), touch-action pan-y, overscroll none, 100svh แทน dvh, TabBar translateZ
  - **หน้าถัดไป: Forecast** แล้ว Settings, …

## ล็อกการทำงาน (เพิ่มท้ายไฟล์ ใหม่สุดอยู่ล่าง)
- 5 พ.ย. 2569 (เครื่อง 1): สร้าง `app/`, ตรวจ swisseph-wasm 0.1.0 ด้วย `app/scripts/smoke-swisseph.mjs` (`node scripts/smoke-swisseph.mjs`) → **ผ่าน**: มี `set_delta_t_userdef`, `houses_armc`, `sidtime`, `SEFLG_TRUEPOS`; โหลด `engine/ephe/*.se1` เข้า FS เสมือนด้วย `SweModule.FS.writeFile('/eph/..')` + `set_ephe_path('/eph')`; ตำแหน่ง Sun/Moon/Saturn/Chiron ของชาร์ตอ้างอิงตรง docs/02 (ระดับลิปดา). หมายเหตุ: สคริปต์จบด้วย exit code 255 แม้ผลครบ (ข้อควรระวังของ wasm ไม่กระทบ) · แพ็กเกจนี้ **ไม่ต้องสร้าง swisseph เอง**
- 5 พ.ย. 2569 (เครื่อง 1): อ่าน CLAUDE.md + docs ทั้งหมด + สำรวจดีไซน์ 27 หน้า, อนุมัติแผน, ติดตั้ง Node, สร้างไฟล์นี้

- 5 พ.ย. 2569 (เครื่อง 1): ทำ repo สาธารณะ https://github.com/milkcakelychee-hue/astro — เปลี่ยนชื่อ 'บลู' เป็น 'ตัวอย่าง' ในดีไซน์/เอกสาร (วันเกิดตัวอย่างยังอยู่ เพราะเป็นข้อมูลทดสอบ) · `docs/06` ไม่ขึ้น repo (อยู่ใน .gitignore, เป็นตัวอย่างอ้างอิงเท่านั้น ไม่จำเป็นต่องาน) · สร้าง git ใหม่ ไม่มีประวัติเก่า · ผู้เขียน commit ใช้อีเมล noreply ของ GitHub
- ทำงานอีกเครื่อง: `git clone https://github.com/milkcakelychee-hue/astro.git` แล้ว `cd astro/app && npm install` · ก่อนเลิกงาน commit+push ทุกครั้ง · เริ่มงานให้ `git pull` ก่อน · ห้ามใส่ข้อมูลส่วนตัวจริง/ไฟล์สำรอง JSON/โทเคนลง repo นี้ (เป็น Public)
- 5 พ.ย. 2569 (เครื่อง 1): engine TS ตำแหน่ง/เรือน/Vertex/Fortune/มุม A-S/ดาวเด่น/ธาตุ/Signature/77 จังหวัด → `npm test` ผ่าน 9/9, `tsc -b` ผ่าน · ถัดไป: C (โหลดคลังข้อความ) → A2–A3 → D → E- 5 พ.ย. 2569 (เครื่อง 1): ลบ README.md หน้าแรกออกจาก GitHub **รวมประวัติ** (force push) — เก็บไว้ในเครื่องเท่านั้น (.gitignore) · เครื่องอื่นที่ clone ไว้ก่อนหน้านี้ต้อง clone ใหม่ (หรือ `git fetch && git reset --hard origin/main`)
- 5 พ.ย. 2569: ผู้ใช้ขอปรับหน้า Main — ย้ายวันเกิด·เวลา·จังหวัดลงมาเป็นหัวข้อรองใต้ "ชาร์ตของฉัน" (15px/500 #DCE0EA) ชื่อคนอยู่บนเป็นป้ายเล็ก
- 5 พ.ย. 2569: **กฎจากผู้ใช้ (ทุกหน้า)**: ปุ่ม ? ข้างหัวข้อหน้าต้องชิดขวาสุด (ขอบขวาเดียวกับปุ่ม ? ของส่วนย่อย) — คอมโพเนนต์ PageTitle ทำให้แล้ว (alignSelf stretch) หน้าไหนเขียนหัวข้อเองต้องให้กล่องหัวข้อกว้างเต็ม
- 5 พ.ย. 2569: **เผยแพร่ GitHub Pages แล้ว** https://milkcakelychee-hue.github.io/astro/ — `.github/workflows/pages.yml` (npm test → build BASE=/astro/ → deploy) ทุก push เข้า main · Settings→Pages→Source = GitHub Actions (ผู้ใช้เปิดแล้ว) · ตรวจบนเว็บจริง: คำนวณถูก, ephe/wasm/ฟอนต์โหลดได้, ไม่มีปุ่ม dev · ใน Git Bash ต้อง `MSYS_NO_PATHCONV=1 BASE=/astro/ npm run build` ถ้าจะลอง build แบบ Pages ในเครื่อง
- 5 พ.ย. 2569: **กฎจากผู้ใช้: ห้ามเผยแพร่เว็บจนกว่าผู้ใช้สั่ง** — workflow เผยแพร่เฉพาะ commit ที่มี [deploy] ในข้อความ หรือกด Run workflow · push ปกติ (ส่งงานข้ามเครื่อง) ไม่ขึ้นเว็บ · ห้ามใส่ [deploy] เองถ้าผู้ใช้ไม่ได้สั่ง
- 5 พ.ย. 2569: ทำ AddPerson, Aspects, ChartLight, Sheet (ผู้ใช้ผ่านทั้งหมด) · ปุ่ม ? ข้างหัวข้อจัดกึ่งกลางกับ h1 · ผู้ใช้สั่งขึ้นเว็บ ([deploy]) และเลิกงาน
- 5 พ.ย. 2569 (เครื่อง Mac): node_modules จาก Windows ใช้บน Mac ไม่ได้ → ลบแล้ว `npm install` ใหม่ · ทำหน้า Today (ยังไม่ deploy)
