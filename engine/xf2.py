from domall import *
import datetime
CS=[x for x in cases() if 'xf' in x[0]]+[(c,None,None) for c in load()]
def shift(c,mins):
    t=datetime.datetime(c['y'],c['mo'],c['d'],c['hh'],0)+datetime.timedelta(minutes=c['mi']+mins)
    c2=dict(c); c2.update(y=t.year,mo=t.month,d=t.day,hh=t.hour,mi=t.minute+t.second/60); return c2
def entries(c):
    if 'xf' in c: return [(e[0],e[2],e[1],e[-1]) for e in c['xf'].split(',')]
    return [(a,b,t,f) for (a,b,t),(o,f) in list(c['pa'].items())+list(c['oa'].items()) if {a,b}&set('XF')]
P=[]
for c,_,_ in CS:
    _,q,_,_=full(c); P.append((c,q,full(shift(c,1/60*0+1))[1]))
def run(step,pts):
    ok=tot=0
    for c,q,q1 in P:
        qs=full(shift(c,step))[1]
        qq=dict(q1)
        for k in pts: qq[k]=qs[k]
        s1={(a,b,t):o for a,b,t,o in seps(q)}; s2={(a,b,t):o for a,b,t,o in seps(qq)}
        for a,b,t,f in entries(c):
            k=(a,b,t) if (a,b,t) in s1 else (b,a,t)
            tot+=1; ok+=('A' if s2[k]<s1[k] else 'S')==f
    return ok,tot
for step in [1,1440,-1440,60,-1,720]:
    for pts in ['XF','X','XFACDI']:
        print(step,pts,run(step,pts))
