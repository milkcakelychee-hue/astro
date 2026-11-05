# engine/ — โค้ดอ้างอิงการคำนวณ (Python, ตรวจกับ astro-seek แล้ว)

ติดตั้ง: `pip install pyswisseph` · ไฟล์ ephemeris อยู่ใน `ephe/` (seas = Chiron/ดาวเคราะห์น้อย, semo = ดวงจันทร์, sepl = ดาวเคราะห์ ช่วง 1800–2400)

| ไฟล์ | หน้าที่ |
|---|---|
| eng.py | โหลดข้อมูลทดสอบ, รหัสดาว (IDS), ฟังก์ชันปัดเศษ |
| eng2.py | `calc(chart)` → ตำแหน่งดาว, cusps, ASC/MC/Vertex/Fortune, ฟังก์ชันหาเรือน (ΔT floor, mean obliquity ตาม 01-calc-recipe) |
| asp2.py / asfinal.py | มุม orb Applying/Separating |
| domall.py / signtab.py | Dominants, ธาตุ, Signature, ตาราง Sign |
| pd.py | Primary Directions (Zodiacal, ใช้ key Ptolemy: อายุ = arc) — ตัวแปร NAIBOD ในไฟล์เป็นของเดิม ให้ใช้ arc/1.0 |
| seek.txt, seek2.txt (ซ้ำใน tests/) | 41 ชาร์ต + ค่าที่ถูกจาก astro-seek |
| tests/cases.json, pd_events.json, tl_site.txt | กรณีทดสอบเพิ่ม (ทรานซิต/PD) |

แปลงเป็น TypeScript โดยให้ผลตรงกับไฟล์เหล่านี้ทุกตัวเลข
