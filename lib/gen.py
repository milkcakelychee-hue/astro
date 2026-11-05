import json
from data import *
from pairs import PAIR
GOOD={'x':'ใช้ร่วมกันแล้วได้ผลดี ยิ่งลงมือยิ่งเห็นผล','t':'ทำได้เป็นธรรมชาติ เป็นจุดแข็งที่พึ่งได้','c':'พลังเข้มข้นและชัดเจน','q':'ถ้าจัดการได้จะกลายเป็นความสามารถที่หาตัวจับยาก','o':'เมื่อหาจุดกลางได้ จะมองเห็นทั้งสองด้านอย่างลึกซึ้ง'}
BAD={'x':'ถ้าไม่ลงมือ โอกาสจะผ่านไปเฉย ๆ','t':'สบายเกินจนไม่พัฒนา','c':'อาจแยกสองเรื่องนี้ออกจากกันไม่ได้ ทำให้มองไม่เห็นตัวเอง','q':'หงุดหงิด ขัดแย้งในใจ หรือทำอะไรสุดโต่งเป็นช่วง ๆ','o':'แกว่งไปมาระหว่างสองขั้ว หรือโทษคนอื่นแทนการมองตัวเอง'}
OUTER=set('UNP')
def dignity(p,s):
    if RULER.get(s)==p: return 'เกษตร (Domicile) อยู่บ้านตัวเอง ทำงานได้เต็มที่'
    if EXALT.get(p)==s: return 'อุจ (Exaltation) ได้รับการยกย่อง พลังดีเป็นพิเศษ'
    if s in DETR.get(p,[]): return 'ประ (Detriment) อยู่ตรงข้ามบ้าน ต้องปรับตัวมาก'
    if FALL.get(p)==s: return 'นิจ (Fall) พลังอ่อน ต้องใช้ความพยายามมากขึ้น'
    return ''
lib={'planet_sign':{},'planet_house':{},'aspect':{}}
for p,(th,en,topic,core) in PLANETS.items():
    for si,(sn,se,el,mo,style,str_,weak) in enumerate(SIGNS):
        t=f'{th}ราศี{sn} ({en} in {se}): {core} แสดงออกแบบ{style}'
        t+=f' จุดเด่น: {str_} · ระวัง: {weak}'
        d=dignity(p,si)
        if d: t+=f' · {d}'
        if p=='c': t+=f' · บาดแผลและพลังเยียวยาอยู่ที่เรื่อง{SIGN_THEME[si]}'
        if p=='L': t+=f' · ส่วนที่ถูกกดไว้เกี่ยวกับเรื่อง{SIGN_THEME[si]}'
        if p=='n': t+=f' · บทเรียนชีวิตคือพัฒนาเรื่อง{SIGN_THEME[si]} (และปล่อยนิสัยเดิมของราศีตรงข้าม)'
        if p in OUTER: t+=' · ดาวรุ่น: ราศีนี้อธิบายคนทั้งรุ่น ลักษณะเฉพาะตัวให้ดูที่เรือน'
        lib['planet_sign'][f'{p}{si}']=t
    if p in 'AC': continue
    for h in range(1,13):
        area,desc=HOUSES[h]
        lib['planet_house'][f'{p}{h}']=f'{th}เรือน {h} ({en} in House {h}): พลังเรื่อง{topic} ไปลงที่เรื่อง{area} — {desc}'
keys=list(PLANETS)
for i,a in enumerate(keys):
    for b in keys[i+1:]:
        if a in 'AC' and b in 'AC': continue
        for k,(an,ae,dyn,lvl) in ASPECTS.items():
            ta,tb=PLANETS[a],PLANETS[b]
            core=PAIR.get(a+b) or PAIR.get(b+a)
            lib['aspect'][f'{a}{k}{b}']=(f'{ta[0]}{an}{tb[0]} ({ta[1]} {ae} {tb[1]}): ' + (f'แก่นเรื่อง: {core} — ' if core else f'เกี่ยวกับเรื่อง{ta[2]} กับเรื่อง{tb[2]} — ') + f'{dyn} '
              f'ด้านดี: {GOOD[k]} · ระวัง: {BAD[k]}')
json.dump(lib,open('interp_lib_th.json','w'),ensure_ascii=False,indent=0)
print({k:len(v) for k,v in lib.items()})
print(lib['planet_sign']['S4']); print(lib['planet_house']['S6']); print(lib['aspect']['Sqa'])
