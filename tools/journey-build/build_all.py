import json, urllib.request, time, math, sys, numpy as np, re
from pyproj import Transformer
sys.path.insert(0,'.'); from towns import TOWNS
sys.path.insert(0,'../../content'); import tours as TT
T={t[0]:t for t in TOWNS}
T['Тбилиси']=('Тбилиси','Tbilisi',41.6934,44.8015,1); T['Батуми']=('Батуми','Batumi',41.6517,41.6367,1)
VIA={('Ахалцихе','Кутаиси'):(41.9940,43.5990)}
m=json.load(open('meta.json')); H=np.load('h250.npy'); fwd=Transformer.from_crs("EPSG:4326",m['proj'],always_xy=True)
def hgt(x,y):
    c=(np.asarray(x)-m['xmin'])/250; r=(m['ymax']-np.asarray(y))/250
    c0=np.clip(np.floor(c).astype(int),0,H.shape[1]-2); r0=np.clip(np.floor(r).astype(int),0,H.shape[0]-2); fx=c-c0; fy=r-r0
    return H[r0,c0]*(1-fx)*(1-fy)+H[r0,c0+1]*fx*(1-fy)+H[r0+1,c0]*(1-fx)*fy+H[r0+1,c0+1]*fx*fy
def simplify(P,tol):
    keep=np.zeros(len(P),bool); keep[0]=keep[-1]=True; st=[(0,len(P)-1)]
    while st:
        a,b=st.pop()
        if b<=a+1: continue
        A,B=P[a],P[b]; d=B-A; L=np.hypot(*d) or 1e-9; seg=P[a+1:b]
        dist=np.abs(d[0]*(seg[:,1]-A[1])-d[1]*(seg[:,0]-A[0]))/L; i=np.argmax(dist)
        if dist[i]>tol: k=a+1+i; keep[k]=True; st+=[(a,k),(k,b)]
    return keep
KNOWN=[('Перевал Абано',42.2807,45.5024),('Крестовый перевал',42.5017,44.4542)]
cache={}
try: cache=json.load(open('osrm_cache.json'))
except: pass
def leg(a,b):
    k=a+'|'+b
    if k not in cache:
        A,B=T[a],T[b]; pts=[(A[3],A[2])]+([(VIA[(a,b)][1],VIA[(a,b)][0])] if (a,b) in VIA else [])+[(B[3],B[2])]
        u='https://router.project-osrm.org/route/v1/driving/'+';'.join(f'{x},{y}' for x,y in pts)+'?overview=full&geometries=geojson'
        r=json.load(urllib.request.urlopen(u,timeout=60))['routes'][0]; time.sleep(0.6)
        cache[k]={'km':r['distance']/1000,'coords':r['geometry']['coordinates']}; json.dump(cache,open('osrm_cache.json','w'))
    return cache[k]
index=[]
for t in TT.TOURS:
    for p in t['programs']:
        stops=TT.STOPS[p['slug']]; pts=[]; cum=0; stopkm=[0]; legs=[]; passes=[]
        for a,b in zip(stops,stops[1:]):
            L=leg(a,b); c=np.array(L['coords']); x,y=fwd.transform(c[:,0],c[:,1]); x=np.array(x); y=np.array(y)
            P=np.c_[x,y]; keep=simplify(P,25.0); Ps=P[keep]; z=hgt(Ps[:,0],Ps[:,1])
            seg=np.hypot(*np.diff(Ps,axis=0).T); km=np.r_[0,np.cumsum(seg)]/1000
            for j in range(0 if not pts else 1,len(Ps)): pts.append([round((Ps[j,0]-m['xmin'])/1000,3),round((Ps[j,1]-m['ymin'])/1000,3),round(float(z[j])),round(cum+km[j],2)])
            zf=hgt(x,y); i=int(np.argmax(zf)); fk=np.r_[0,np.cumsum(np.hypot(np.diff(x),np.diff(y)))]/1000
            straight=math.dist(P[0],P[-1])/1000
            flag='  <-- проверить' if straight>5 and km[-1]/straight>2.6 else ''
            dend=min(fk[i],fk[-1]-fk[i])
            if zf[i]>=1900 and dend>4:
                lat,lon=c[i][1],c[i][0]; name='Высшая точка дороги'
                for n,la,lo in KNOWN:
                    if math.dist((lat,lon*0.74),(la,lo*0.74))<0.06: name=n
                if not any(q['name']==name and name!='Высшая точка дороги' for q in passes) and not any(abs(q['h']-zf[i])<30 and math.dist(q['xy'],[(x[i]-m['xmin'])/1000,(y[i]-m['ymin'])/1000])<3 for q in passes):
                    passes.append({'name':name,'h':round(float(zf[i])),'km':round(cum+fk[i]*km[-1]/fk[-1],1),'xy':[round((x[i]-m['xmin'])/1000,2),round((y[i]-m['ymin'])/1000,2)],'leg':a+'→'+b})
            legs.append({'from':a,'to':b,'km':round(km[-1],1)})
            print(f"  {p['slug']:18} {a:>15} → {b:<15} {km[-1]:6.1f} км  макс {zf[i]:5.0f}{flag}")
            cum+=km[-1]; stopkm.append(round(cum,2))
        st=[]
        for s,k in zip(stops,stopkm):
            tt=T[s]; X,Y=fwd.transform(tt[3],tt[2]); st.append({'ru':s,'km':k,'x':round((X-m['xmin'])/1000,3),'y':round((Y-m['ymin'])/1000,3),'h':round(float(hgt(X,Y)))})
        json.dump({'slug':p['slug'],'pts':pts,'stops':st,'legs':legs,'passes':passes,'total':round(cum,1)},open(f'../../journey/data/route-{p["slug"]}.json','w'),separators=(',',':'),ensure_ascii=False)
        index.append({'slug':p['slug'],'ru':p['ru']['name'],'days':p['days'],'cat':t['ru']['name'],'cat_slug':t['slug'],'km':round(cum),'places':len(dict.fromkeys(stops)),'top':max([q['h'] for q in passes]+[max(x['h'] for x in st)]),'img':p['img']})
        print(p['slug'],'ИТОГО',round(cum,1),'км; перевалы:',[(q['name'],q['h']) for q in passes])
json.dump(index,open('../../journey/data/tours.json','w'),ensure_ascii=False,indent=0)
