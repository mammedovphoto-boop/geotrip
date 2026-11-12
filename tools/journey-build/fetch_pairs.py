import json,subprocess,time,os,itertools,concurrent.futures as cf
T={t[0]:t for t in json.load(open('../towns.json'))}
need=json.load(open('need.json'))
cache=json.load(open('pairs.json')) if os.path.exists('pairs.json') else {}
old=json.load(open('osrm_cache.json'))
for k,v in old.items():
    a,b=k.split('|')
    if a in need and b in need: cache.setdefault(k,v['coords'])
pairs=[(a,b) for a,b in itertools.combinations(need,2) if f'{a}|{b}' not in cache and f'{b}|{a}' not in cache]
print('todo',len(pairs))
def get(p):
    a,b=p; A,B=T[a],T[b]
    u=f"https://router.project-osrm.org/route/v1/driving/{A[3]},{A[2]};{B[3]},{B[2]}?overview=simplified&geometries=geojson"
    for k in range(4):
        r=subprocess.run(['curl','-s','-m','30',u],capture_output=True,text=True)
        try:
            j=json.loads(r.stdout); return (f'{a}|{b}',j['routes'][0]['geometry']['coordinates'])
        except Exception: time.sleep(1.5)
    return (f'{a}|{b}',None)
with cf.ThreadPoolExecutor(3) as ex:
    for i,(k,v) in enumerate(ex.map(get,pairs)):
        if v: cache[k]=v
        if i%50==0: json.dump(cache,open('pairs.json','w'),ensure_ascii=False)
json.dump(cache,open('pairs.json','w'),ensure_ascii=False)
print('have',len(cache))
