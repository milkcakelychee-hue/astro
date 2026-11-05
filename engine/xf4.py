exec(open('xf2.py').read().split('for step in')[0])
def spd(q,q1):
    return {k:((q1[k][0]-q[k][0]+540)%360-180)*1440 for k in q}
def flag(q,v,a,b,t):
    def sp(dt):
        la=q[a][0]+v[a]*dt; lb=q[b][0]+v[b]*dt
        if {a,b}=={'F','X'}:
            la = 0 if a=='X' else la; lb = 0 if b=='X' else lb
        d=abs(la-lb)%360; d=min(d,360-d); return abs(d-ANG[t])
    return 'A' if sp(1e-6)<sp(0) else 'S'
def model(fn):
    ok=tot=0; bad=[]
    for c,q,q1 in P:
        v=spd(q,q1); fn(v,q)
        for a,b,t,f in entries(c):
            tot+=1; g=flag(q,v,a,b,t)
            if g==f: ok+=1
            else: bad.append((c['y'],c['mo'],a,b,t,f))
    return ok,tot,bad
def m1(v,q): v['X']=abs(v['X'])
def m2(v,q): v['X']=v['A']
def m3(v,q): v['X']=abs(v['X']); v['F']=v['F']
def m4(v,q): v['X']=v['A']; v['F']=v['A']
def m5(v,q): v['X']=1
def m6(v,q): v['X']=1; [v.__setitem__(k,0) for k in 'ACDI']
def m7(v,q): v['X']=1; v['F']=1
for n,m in [('abs',m1),('=ASC',m2),('=ASC both',m4),('X=1',m5),('X=1,ang0',m6),('XF=1',m7)]:
    o,t,b=model(m); print(n,o,t)
o,t,b=model(m5); print(b)
print('----abs')
o,t,b=model(m1)
import collections
print(collections.Counter(''.join(sorted(x[2]+x[3])) for x in b))
print([x for x in b if not set(x[2]+x[3])&set('ACDI') and 'F' not in x[2]+x[3]])
def run2(fn,fx='S'):
    ok=tot=0;bad=[]
    for c,q,q1 in P:
        v=spd(q,q1); fn(v,q)
        for a,b,t,f in entries(c):
            tot+=1
            g = fx if ({a,b}=={'F','X'} and fx) else flag(q,v,a,b,t)
            if g==f: ok+=1
            else: bad.append((c['y'],c['mo'],a,b,t,f,round(v['X']),round(v['F']),round(v['A']),round(v['C'])))
    return ok,tot,bad
def n1(v,q): v['X']=abs(v['X'])
def n2(v,q): v['X']=abs(v['X']); [v.__setitem__(k,0) for k in 'ACDI']
def n3(v,q): v['X']=abs(v['X']); v['F']=abs(v['F'])
def n4(v,q): v['X']=abs(v['X']); [v.__setitem__(k,0) for k in 'ACDI']; v['F']=0
for n,m in [('n1',n1),('n2',n2),('n3',n3),('n4 ',n4)]:
    o,t,b=run2(m); print(n,o,t)
o,t,b=run2(n1); [print(x) for x in b]
print('=====')
import collections
C=collections.Counter()
for c,q,q1 in P:
    for a,b,t,f in entries(c):
        s={a,b}
        if s&set('XF') and s&set('ACDI'):
            pt=(s&set('XF')).pop(); an=(s&set('ACDI')).pop(); C[(pt,an,f)]+=1
print(sorted(C.items()))
print('#####')
def rule(fn):
    ok=tot=0;bad=[]
    for c,q,q1 in P:
        v=spd(q,q1); v['X']=abs(v['X'])
        for a,b,t,f in entries(c):
            s={a,b}
            if not(s&set('XF') and s&set('CI')): continue
            tot+=1; g=fn(c,q,v,a,b,t)
            if g==f: ok+=1
            else: bad.append((c['y'],c['mo'],a,b,t,f))
    return ok,tot,bad
def r1(c,q,v,a,b,t):
    w=dict(v); w['X']=0; w['F']=0; return flag(q,w,a,b,t)
def r2(c,q,v,a,b,t):
    w=dict(v); w['C']=0; w['I']=0; return flag(q,w,a,b,t)
def r3(c,q,v,a,b,t):
    w=dict(v); w['X']=1;w['F']=1; w['C']=0; w['I']=0; return flag(q,w,a,b,t)
def r4(c,q,v,a,b,t):
    w=dict(v); w['X']=0;w['F']=0; w['C']=1; w['I']=1; return flag(q,w,a,b,t)
for n,f in [('XFstatic',r1),('MCstatic',r2),('XF+1,MC0',r3),('XF0,MC+1',r4)]:
    o,t,b=rule(f); print(n,o,t,b[:6])
