exec(open('xf2.py').read().split('for step in')[0])
def spd(q,q1): return {k:((q1[k][0]-q[k][0]+540)%360-180)*1440 for k in q}
def flag(q,v,a,b,t):
    def sp(dt):
        la=q[a][0]+v[a]*dt; lb=q[b][0]+v[b]*dt
        if {a,b}=={'F','X'}: la=0 if a=='X' else la; lb=0 if b=='X' else lb
        d=abs(la-lb)%360; d=min(d,360-d); return abs(d-ANG[t])
    return 'A' if sp(1e-6)<sp(0) else 'S'
def AS(q,v,a,b,t):
    s={a,b}; w=dict(v); w['X']=abs(w['X'])
    if s=={'F','X'}: return 'S'
    if s&set('XF') and s&set('AD'): return 'S'
    if s&set('XF') and s&set('CI'): w['X']=w['F']=0
    return flag(q,w,a,b,t)
ok=tot=0;bad=[]
for c,q,q1 in P:
    v=spd(q,q1)
    E=entries(c) if 'xf' in c else [(a,b,t,f) for (a,b,t),(o,f) in list(c['pa'].items())+list(c['oa'].items())]
    for a,b,t,f in E:
        tot+=1; g=AS(q,v,a,b,t); ok+=g==f
        if g!=f: bad.append((c['y'],a,b,t,f))
print(ok,tot,bad)
