from domall import *
ANGL=set('ACDI')
def allow(a,b,t):
    L=bool({a,b}&set('SM'))
    if t=='6': return 5.5 if L else 4
    return 10 if L else 7
cnt_ok=0; tot=ok=0; bad=[]
for c,dom,el in cases():
    if 'xf' not in c: continue
    _,q,_,_=full(c); c2=dict(c); c2['mi']=c['mi']+1/60; _,q2,_,_=full(c2)
    s1={(a,b,t):o for a,b,t,o in seps(q)}; s2={(a,b,t):o for a,b,t,o in seps(q2)}
    inc=[k for k,o in s1.items() if not(k[0] in ANGL and k[1] in ANGL) and o<=allow(*k)]
    cnt_ok+= len(inc)==c['n']
    if len(inc)!=c['n']: print('count',c['y'],c['mo'],len(inc),c['n'])
    for e in c['xf'].split(','):
        a,t,b,o,f=e[0],e[1],e[2],int(e[3:-1]),e[-1]
        k=(a,b,t) if (a,b,t) in s1 else (b,a,t)
        if int(s1[k]*60)!=o: print('orb',c['y'],e,s1[k]*60)
        g='A' if s2[k]<s1[k] else 'S'; tot+=1
        if g==f: ok+=1
        else: bad.append((c['y'],c['mo'],c['city'][:6],round(c['lat'],1),e))
print('counts',cnt_ok,'AS',ok,tot); [print(b) for b in bad]
