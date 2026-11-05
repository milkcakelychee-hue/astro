from domall import *
CS=cases(); T={}
for c,dom,el in CS:
    r,q,cu,h=full(c)
    for i,p in enumerate(PL): T[(p,sg(r[p][0]))]=dom[i][0]
Z='Ari Tau Gem Can Leo Vir Lib Sco Sag Cap Aqu Pis'.split()
print('    '+' '.join(Z))
for p in PL: print(p,'  '+'   '.join(str(T.get((p,s),'.')) for s in range(12)))
print(len(T))
