import swisseph as swe, math
import os; swe.set_ephe_path(os.path.join(os.path.dirname(os.path.abspath(__file__)),'ephe'))
from eng2 import calc
D=math.radians; R=math.degrees
def setup(B):
    r,cu,h=calc(B)
    ut=B['hh']+B['mi']/60-7; jd=swe.julday(B['y'],B['mo'],B['d'],ut)
    swe.set_delta_t_userdef(-1e-10); dt=swe.deltat(jd)*86400; swe.set_delta_t_userdef(math.floor(dt)/86400)
    eps=swe.calc_ut(jd,swe.ECL_NUT)[0][0]
    ramc=(swe.sidtime(jd)*15+B['lon'])%360
    pos={}
    for n,i in {'S':0,'M':1,'m':2,'V':3,'a':4,'J':5,'s':6,'U':7,'N':8,'P':9}.items():
        x=swe.calc_ut(jd,i)[0]; pos[n]=(x[0],x[1])
    swe.set_delta_t_userdef(-1e-10)
    return r,eps,ramc,pos
def eq(lon,lat,eps):
    ra,de,_=swe.cotrans((lon,lat,1),-eps); return ra,de
def oa_od(ra,de,phi):
    ad=R(math.asin(max(-1,min(1,math.tan(D(phi))*math.tan(D(de))))))
    return (ra-ad)%360,(ra+ad)%360
def sgn(x): return ((x+180)%360)-180
if __name__=='__main__':
    B=dict(y=1999,mo=8,d=5,hh=20,mi=33,lat=13+7/60,lon=99+57/60)
    r,eps,ramc,pos=setup(B)
    phi=B['lat']
    oaA=(ramc+90)%360  # OA of ASC
    for asp in (0,60,90,120,180,-60,-90,-120):
        L=(pos['P'][0]+asp)%360
        zra,zde=eq(L,0,eps)
        zoa,zod=oa_od(zra,zde,phi)
        print('P',asp,'ZRA',round(zra,6),'ZMC',round(sgn(zra-ramc),6),'ZOA',round(zoa,6),'ZOD',round(zod,6),'ZOA-ASC',round(sgn(zoa-oaA),6),'ZOD-DSC',round(sgn(zod-(oaA+180)%360),6))

NAIBOD=0.98564733
NAMES={'S':'อาทิตย์','M':'จันทร์','m':'พุธ','V':'ศุกร์','a':'อังคาร','J':'พฤหัสบดี','s':'เสาร์','U':'ยูเรนัส','N':'เนปจูน','P':'พลูโต'}
def directions(B,maxage=90):
    r,_,ramc,pos=setup(B)
    jd=swe.julday(B['y'],B['mo'],B['d'],B['hh']+B['mi']/60-7); eps=swe.calc_ut(jd,swe.ECL_NUT)[0][1]
    phi=B['lat']; oaA=(ramc+90)%360; odD=(oaA+180)%360
    out=[]
    for p,(lon,lat) in pos.items():
        for asp in (0,60,90,120,180,-60,-90,-120):
            L=(lon+asp)%360
            zra,zde=eq(L,0,eps); zoa,zod=oa_od(zra,zde,phi)
            for ang,arc in (('MC',sgn(zra-ramc)),('IC',sgn(zra-(ramc+180)%360)),('ASC',sgn(zoa-oaA)),('DSC',sgn(zod-odD))):
                for kind,a in (('D',arc),('C',-arc)):
                    if 0<a<=maxage*NAIBOD:
                        out.append((a/NAIBOD,a/1.0,p,asp,ang,kind))
    return sorted(out)
if __name__=='__main__':
    B=dict(y=1999,mo=8,d=5,hh=20,mi=33,lat=13+7/60,lon=99+57/60)
    for x in directions(B,40):
        if x[0]>20: print(round(x[0],2),round(x[1],2),x[2:])
