import glob,os,io,json,numpy as np
from PIL import Image
from concurrent.futures import ProcessPoolExecutor
OUT='v2/journey/tiles'; os.makedirs(OUT,exist_ok=True)
def enc(f):
    kind,z,x,y=f.split('/')[1].replace('satF','sat'),*map(int,f[:-4].split('/')[2:])
    im=Image.open(f)
    b=io.BytesIO()
    if kind=='dem':
        a=np.asarray(im.convert('RGB')).astype(np.int32)
        h=np.round(a[...,0]*256+a[...,1]+a[...,2]/256-32768).clip(-500,6000).astype(np.int32)+32768
        o=np.zeros(a.shape,np.uint8);o[...,0]=h>>8;o[...,1]=h&255
        Image.fromarray(o).save(b,'WEBP',lossless=True,quality=100,method=4)
    else:
        im.convert('RGB').save(b,'WEBP',quality=74,method=5)
    return kind,z,x,y,b.getvalue()
fs=sorted(glob.glob('mt/satF/*/*/*.jpg')+glob.glob('mt/dem/*/*/*.png'))
with ProcessPoolExecutor() as ex: res=list(ex.map(enc,fs,chunksize=32))
# buckets: low zooms together; z12/13 by z7 parent tile
groups={}
for kind,z,x,y,d in res:
    key=f'{kind}-{z:02d}' if z<=9 else f'{kind}-{z:02d}-{x>>(z-7):03d}-{y>>(z-7):03d}'
    groups.setdefault(key,[]).append((z,x,y,d))
idx={'sat':{},'dem':{}};packs=[]
# merge small groups up to ~6MB
cur=[];size=0;pid=0
def flush():
    global cur,size,pid
    if not cur:return
    name=f'p{pid:02d}.webp';off=0
    with open(f'{OUT}/{name}','wb') as fh:
        for kind,z,x,y,d in cur:
            fh.write(d);idx[kind][f'{z}/{x}/{y}']=[pid,off,len(d)];off+=len(d)
    packs.append([name,off]);pid+=1;cur=[];size=0
prev=None
for key in sorted(groups):
    kind=key.split('-')[0]
    items=[(kind,*t) for t in groups[key]]
    gs=sum(len(t[4]) for t in items)
    if key.endswith('-lo'):
        # split low-zoom set into ~6MB packs
        for it in items:
            cur.append(it);size+=len(it[4])
            if size>6e6:flush()
        flush();continue
    fam=key[:6]
    if size+gs>4e6 or fam!=prev:flush()
    prev=fam
    cur+=items;size+=gs
flush()
json.dump({'packs':packs,'idx':idx},open(f'{OUT}/index.json','w'),separators=(',',':'))
print(len(packs),'packs',sum(p[1] for p in packs)/1e6,'MB')
