import swisseph as swe, math
import os; swe.set_ephe_path(os.path.join(os.path.dirname(os.path.abspath(__file__)),'ephe'))
F=swe.FLG_SWIEPH|swe.FLG_SPEED
IDS={'S':0,'M':1,'m':2,'V':3,'a':4,'J':5,'s':6,'U':7,'N':8,'P':9,'n':10,'L':12,'c':15}
def load():
    cases=[]
    for line in open('seek.txt'):
        line=line.strip()
        if not line: continue
        p=line.split('#'); h=p[0].split('/')
        c=dict(y=int(h[0]),mo=int(h[1]),d=int(h[2]),hh=int(h[3]),mi=int(h[4]),city=h[5],lat=int(h[6])+int(h[7])/60,lon=int(h[8])+int(h[9])/60)
        pos={}
        for t in p[1].split(','):
            k=t[0]; r='r' in t; v,hs=t[1:].replace('r','').split('h'); pos[k]=(int(v),r,int(hs) if hs else None)
        c['pos']=pos; c['cusps']=[int(x) for x in p[2].split(',')]
        def asp(s): 
            out={}
            for t in s.split(','):
                if not t: continue
                a,ty,b=t[0],t[1],t[2]; o=int(t[3:-1]); out[(a,b,ty)]=(o,t[-1])
            return out
        c['pa']=asp(p[3]); c['oa']=asp(p[4])
        c['dom']=[list(map(int,x.split('.'))) for x in p[5].split(',')]
        c['el']=[list(map(int,x.split('.'))) for x in p[6].split(',')]
        cases.append(c)
    return cases
def calc(c):
    ut=c['hh']+c['mi']/60-7
    jd=swe.julday(c['y'],c['mo'],c['d'],ut)
    res={}
    for k,i in IDS.items():
        x=swe.calc_ut(jd,i,F)[0]; res[k]=(x[0],x[3])
    cu,am=swe.houses(jd,c['lat'],c['lon'],b'P')
    res['A']=(am[0],0); res['C']=(am[1],0); res['X']=(am[3],0)
    S,M,A=res['S'][0],res['M'][0],am[0]
    # day if sun above horizon: sun in houses 7-12
    def house(l):
        for i in range(12):
            a=cu[i]; b=cu[(i+1)%12]
            if (l-a)%360 < (b-a)%360: return i+1
    day= house(S)>=7
    fo=(A+M-S)%360 if day else (A+S-M)%360
    res['F']=(fo,0)
    return res,list(cu),house,jd
def mins(l,mode='floor'):
    m=l*60
    return int(math.floor(m+1e-9)) if mode=='floor' else int(round(m))

def calc2(c, hmode='mean'):
    ut=c['hh']+c['mi']/60-7
    jd=swe.julday(c['y'],c['mo'],c['d'],ut)
    res={}
    for k,i in IDS.items():
        x=swe.calc_ut(jd,i,F)[0]; res[k]=(x[0],x[3])
    eps=swe.calc_ut(jd,swe.ECL_NUT)[0]
    if hmode=='mean':
        armc=(swe.sidtime0(jd,eps[1],0)*15+c['lon'])%360; ob=eps[1]
    else:
        armc=(swe.sidtime(jd)*15+c['lon'])%360; ob=eps[0]
    cu,am=swe.houses_armc(armc,c['lat'],ob,b'P')
    res['A']=(am[0],0); res['C']=(am[1],0); res['X']=(am[3],0)
    S,M,A=res['S'][0],res['M'][0],am[0]
    def house(l):
        for i in range(12):
            a=cu[i]; b=cu[(i+1)%12]
            if (l-a)%360 < (b-a)%360: return i+1
    day= house(S)>=7
    res['F']=(((A+M-S) if day else (A+S-M))%360,0)
    return res,list(cu),house,jd
