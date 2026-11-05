import swisseph as swe, math
from eng import load, IDS, mins
import os; swe.set_ephe_path(os.path.join(os.path.dirname(os.path.abspath(__file__)),'ephe'))
F=swe.FLG_SWIEPH|swe.FLG_SPEED
def calc(c):
    ut=c['hh']+c['mi']/60-7; jd=swe.julday(c['y'],c['mo'],c['d'],ut)
    swe.set_delta_t_userdef(-1e-10); dt=swe.deltat(jd)*86400
    swe.set_delta_t_userdef(math.floor(dt)/86400)
    r={}
    for k,i in IDS.items():
        x=swe.calc_ut(jd,i,F|(swe.FLG_TRUEPOS if k=='c' else 0))[0]; r[k]=(x[0],x[3])
    cu,am=swe.houses(jd,c['lat'],c['lon'],b'P')
    r['A']=(am[0],0); r['C']=(am[1],0); r['D']=((am[0]+180)%360,0); r['I']=((am[1]+180)%360,0)
    eps=swe.calc_ut(jd,swe.ECL_NUT)[0]
    _,am2=swe.houses_armc((swe.sidtime(jd)*15+c['lon'])%360,c['lat'],eps[1],b'P')
    r['X']=(am2[3],0)
    def house(l):
        for i in range(12):
            a=cu[i]; b=cu[(i+1)%12]
            if (l-a)%360<(b-a)%360: return i+1
    S,M,A2=r['S'][0],r['M'][0],am2[0]
    day=house(S)>=7
    r['F']=((((A2+M-S) if day else (A2+S-M))%360),0)
    swe.set_delta_t_userdef(-1e-10)
    return r,list(cu),house
