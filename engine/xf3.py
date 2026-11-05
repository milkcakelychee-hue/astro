exec(open('xf2.py').read().split('for step in')[0])
import swisseph as swe
for c,q,q1 in P:
    s1={(a,b,t):o for a,b,t,o in seps(q)}; s2={(a,b,t):o for a,b,t,o in seps(q1)}
    res={'X':[], 'F':[]}
    for a,b,t,f in entries(c):
        k=(a,b,t) if (a,b,t) in s1 else (b,a,t)
        m=('A' if s2[k]<s1[k] else 'S')==f
        other=b if a in 'XF' else a
        key='X' if 'X' in (a,b) else 'F'
        if {a,b}=={'X','F'}: key='XF'
        res.setdefault(key,[]).append(('+' if m else '-')+other)
    vx=(q1['X'][0]-q['X'][0]+540)%360-180
    print(c['y'],c['mo'],round(c['lat'],1),'Xspd',round(vx*1440,0),'A',round((q1['A'][0]-q['A'][0])*1440),' X:',' '.join(res['X']),' F:',' '.join(res['F']),' XF:',' '.join(res.get('XF',[])))
