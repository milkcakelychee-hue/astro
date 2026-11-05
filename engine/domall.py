import json
from asp2 import *
from eng import load
PL='SMmVaJsUNP'
RUL=['a','V','m','M','S','m','V','P','J','s','U','N']
HR={1:'a',2:'V',3:'m',4:'M',5:'S',6:'m',7:'V',8:'P',9:'J',10:'s',11:'U',12:'N'}
W={'3':3,'6':3,'0':2,'4':1,'8':1}
def cases():
    out=[]
    for c in load(): out.append((c,c['dom'],c['el']))
    for l in open('seek2.txt'):
        a,r=l.strip().split('|',1); y,mo,d,hh,mi,city,la,lam,lo,lom=json.loads(a); p=r.split('#')
        c=dict(y=y,mo=mo,d=d,hh=hh,mi=mi,city=city,lat=la+lam/60,lon=lo+lom/60)
        c['xf']=p[4]; c['sig']=p[2]; c['n']=int(p[3])
        out.append((c,[list(map(int,x.split('.'))) for x in p[0].split(',')],[list(map(int,x.split('.'))) for x in p[1].split(',')]))
    return out
def sg(x): return int(x//30)%12
def aspscore(q,orb):
    s={p:0 for p in PL}
    for a,b,t,o in seps(q):
        if a in PL and b in PL:
            l={a,b}&set('SM')
            lim=(orb['6L'] if l else orb['6']) if t=='6' else orb[t]
            if o<=lim: s[a]+=W[t]; s[b]+=W[t]
    return s
def comp(c,orb):
    r,q,cu,h=full(c)
    A=r['A'][0]; C=r['C'][0]
    rows={}
    asp=aspscore(q,orb)
    for p in PL:
        hs=h(r[p][0]); house=(1 if hs in(1,10) else 0)+(1 if HR[hs]==p else 0)
        ang=0
        for k,v in (('C',5),('A',5),('I',3),('D',3)):
            d=abs(r[p][0]-r[k][0])%360; d=min(d,360-d)
            if d<=6: ang+=v
        ru=(3 if RUL[sg(A)]==p else 0)+(1 if RUL[sg(C)]==p else 0)+sum(1 for x in PL if RUL[sg(r[x][0])]==p)
        rows[p]=[house,ang,ru,asp[p]]
    return r,rows
