import math, os, concurrent.futures as cf, urllib.request
Z=10
def tx(lon): return int((lon+180)/360*2**Z)
def ty(lat): r=math.radians(lat); return int((1-math.log(math.tan(r)+1/math.cos(r))/math.pi)/2*2**Z)
LON0,LON1,LAT0,LAT1=39.7,46.9,40.85,43.75
xs=range(tx(LON0),tx(LON1)+1); ys=range(ty(LAT1),ty(LAT0)+1)
jobs=[(x,y) for x in xs for y in ys]
print(len(jobs),'tiles',xs,ys)
def get(j):
    x,y=j;p=f'raw/{Z}_{x}_{y}.png'
    if os.path.exists(p):return
    for k in range(3):
        try:
            urllib.request.urlretrieve(f'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{Z}/{x}/{y}.png',p);return
        except Exception as e: err=e
    print('fail',j,err)
with cf.ThreadPoolExecutor(16) as ex: list(ex.map(get,jobs))
print('done')
