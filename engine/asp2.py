from eng2 import *
from eng import load
import swisseph as swe, math
ANG={'0':0,'6':60,'4':90,'3':120,'8':180}
B=list('SMmVaJsUNPnLcFXACDI')
def full(c):
    r,cu,h=calc(c)
    ut=c['hh']+c['mi']/60-7; jd=swe.julday(c['y'],c['mo'],c['d'],ut)
    swe.set_delta_t_userdef(-1e-10); dt=swe.deltat(jd)*86400; swe.set_delta_t_userdef(math.floor(dt)/86400)
    eps=swe.calc_ut(jd,swe.ECL_NUT)[0]
    _,am=swe.houses_armc((swe.sidtime(jd)*15+c['lon'])%360,c['lat'],eps[1],b'P')
    ch=swe.calc_ut(jd,15,F)[0]
    swe.set_delta_t_userdef(-1e-10)
    q=dict(r); q['c']=(ch[0],ch[3]); q['C']=(am[1],0); q['I']=((am[1]+180)%360,0)
    return r,q,cu,h
def seps(q):
    out=[]
    for i,a in enumerate(B):
        for b in B[i+1:]:
            la=q[a][0]; lb=q[b][0]
            if {a,b}=={'F','X'}: lb=0.0 if b=='X' else lb; la=0.0 if a=='X' else la
            d=abs(la-lb)%360; d=min(d,360-d)
            for t,an in ANG.items(): out.append((a,b,t,abs(d-an)))
    return out
