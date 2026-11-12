import numpy as np, json, math, os
from PIL import Image, ImageDraw, ImageFilter
from pyproj import Transformer
from scipy import ndimage
Image.MAX_IMAGE_PIXELS=None
m=json.load(open('meta.json')); XMIN,XMAX,YMIN,YMAX=m['xmin'],m['xmax'],m['ymin'],m['ymax']
PROJ=m['proj']; fwd=Transformer.from_crs("EPSG:4326",PROJ,always_xy=True); inv=Transformer.from_crs(PROJ,"EPSG:4326",always_xy=True)
Z=11; X0,X1,Y0,Y1=1250,1290,747,768
W=(X1-X0+1)*256; H=(Y1-Y0+1)*256
S=np.zeros((H,W,3),np.uint8); have=np.zeros((H,W),bool)
for x in range(X0,X1+1):
    for y in range(Y0,Y1+1):
        f=f's2/{x}_{y}.jpg'
        if os.path.exists(f) and os.path.getsize(f)>1000:
            S[(y-Y0)*256:(y-Y0+1)*256,(x-X0)*256:(x-X0+1)*256]=np.asarray(Image.open(f).convert('RGB')); have[(y-Y0)*256:(y-Y0+1)*256,(x-X0)*256:(x-X0+1)*256]=True
STEP=110
gx=np.arange(XMIN,XMAX,STEP); gy=np.arange(YMAX,YMIN,-STEP); GX,GY=np.meshgrid(gx,gy)
lon,lat=inv.transform(GX,GY)
n=2**Z; px=(lon+180)/360*n*256-X0*256; r=np.radians(lat); py=(1-np.log(np.tan(r)+1/np.cos(r))/math.pi)/2*n*256-Y0*256
def bil(A,px,py):
    x0=np.clip(np.floor(px).astype(int),0,A.shape[1]-2); y0=np.clip(np.floor(py).astype(int),0,A.shape[0]-2); fx=(px-x0)[...,None] if A.ndim==3 else px-x0; fy=(py-y0)[...,None] if A.ndim==3 else py-y0
    return A[y0,x0]*(1-fx)*(1-fy)+A[y0,x0+1]*fx*(1-fy)+A[y0+1,x0]*(1-fx)*fy+A[y0+1,x0+1]*fx*fy
col=np.stack([bil(S[...,k],px,py) for k in range(3)],-1).astype(np.float32); del S; hv=bil(have.astype(np.uint8),px,py)>0.5; del have
h,w=col.shape[:2]
# heights 250m grid -> resample to 140m
H250=np.load('h250.npy'); zy=np.linspace(0,H250.shape[0]-1,h); zx=np.linspace(0,H250.shape[1]-1,w)
Hh=ndimage.map_coordinates(H250,np.meshgrid(zy,zx,indexing='ij'),order=1)
# land cover for water mask
WC=np.zeros((6000,9000),np.uint8)
for la in (39,42):
    for lo in (39,42,45):
        a=np.load(f'wc_{la}_{lo}.npy'); r0=(45-(la+3))*1000; c0=(lo-39)*1000; WC[r0:r0+3000,c0:c0+3000]=a
cls=WC[np.clip(((45-lat)*1000).astype(int),0,5999),np.clip(((lon-39)*1000).astype(int),0,8999)]
water=(cls==80)|(~hv)|((cls==0)&(Hh<=0.5))
# colour grade: gentle contrast, a bit warmer/greener, lift shadows
c=col/255.0
c=np.clip((c-0.5)*1.18+0.5+0.02,0,1)
lum=c.mean(axis=2,keepdims=True); c=np.clip(lum+(c-lum)*1.22,0,1)
c=np.power(c,0.92)
# hillshade multiply to make relief readable
dy,dx=np.gradient(ndimage.gaussian_filter(Hh,1.0),STEP); slope=np.arctan(np.hypot(dx,dy)*1.6); aspect=np.arctan2(-dx,dy)
def hs(az,alt): az,alt=math.radians(az),math.radians(alt); return np.clip(np.sin(alt)*np.cos(slope)+np.cos(alt)*np.sin(slope)*np.cos(az-aspect),0,1)
shade=0.6*hs(315,38)+0.25*hs(255,45)+0.15*hs(20,60); flat=math.sin(math.radians(38))*0.6+math.sin(math.radians(45))*0.25+math.sin(math.radians(60))*0.15
shade=np.clip(shade/flat,0.35,1.35)
c=c*(0.55+0.45*shade[...,None])
# sea
depth=np.clip(-ndimage.gaussian_filter(Hh,6)/1500,0,1)[...,None]
sea=(np.array([52,104,140])*(1-depth)+np.array([24,58,88])*depth)/255
seaMask=(~hv)|((cls==80)&(Hh<=2))
seaZone=(~hv)|((cls==80)&(Hh<=1.5))|((cls==0)&(Hh<=1.5))
ref=c[hv&seaZone]; mcol=np.median(ref,axis=0) if len(ref) else sea.mean(axis=(0,1))
sm=ndimage.gaussian_filter(seaZone.astype(np.float32),3)[...,None]
uni=np.ones_like(c)*mcol*(1-depth*0.35)
c=c*(1-sm*0.85)+uni*sm*0.85
c=np.where(~hv[...,None],uni,c)
out=np.clip(c*255,0,255)
img=Image.fromarray(out.astype(np.uint8)).filter(ImageFilter.UnsharpMask(1.2,60,2)); d=ImageDraw.Draw(img,'RGBA')
X=lambda lo,la: ((np.array(fwd.transform(lo,la))-[XMIN,YMAX])*[1/STEP,-1/STEP])
# roads: OSRM legs (real roads used by tours) + Natural Earth major roads
osrm=json.load(open('osrm_cache.json'))
roads=json.load(open('ne_10m_roads.geojson'))
def lines_in(geom):
    cs=geom['coordinates'] if geom['type']=='MultiLineString' else [geom['coordinates']]
    for l in cs:
        if any(39.8<p[0]<46.9 and 40.9<p[1]<43.7 for p in l): yield l
for f in ([] if True else roads['features']):
    if 'erry' in str(f['properties'].get('type',''))+str(f['properties'].get('featurecla','')): continue
    for l in lines_in(f['geometry']):
        pts=[tuple(X(p[0],p[1])) for p in l]; d.line(pts,fill=(255,238,210,28),width=1)
for k,v in osrm.items():
    pts=[tuple(X(p[0],p[1])) for p in v['coords'][::2]]
    d.line(pts,fill=(246,236,214,30),width=1)
# outside Georgia: softer
g=json.load(open('georgia_ne10.json')); ring=g['coordinates'][0]; bx,by=fwd.transform([p[0] for p in ring],[p[1] for p in ring])
mk=Image.new('L',(w,h),0); ImageDraw.Draw(mk).polygon([((x-XMIN)/STEP,(YMAX-y)/STEP) for x,y in zip(bx,by)],fill=255)
mask=np.asarray(mk.filter(ImageFilter.GaussianBlur(2)),np.float32)[...,None]/255
a=np.asarray(img,np.float32); l=a.mean(axis=2,keepdims=True); haze=np.array([214,222,228],np.float32)
outside=(a*0.6+l*0.4)*0.72+haze*0.28
a=a*mask+outside*(1-mask)
img=Image.fromarray(np.clip(a,0,255).astype(np.uint8))
img.save('out/terrain-sat-4k.jpg',quality=84,optimize=True,progressive=True)
img.resize((2048,int(2048*h/w)),Image.LANCZOS).save('out/terrain-sat-2k.jpg',quality=84,optimize=True,progressive=True)
img.crop((int(w*0.55),int(h*0.15),int(w*0.75),int(h*0.45))).save('out/crop.jpg',quality=85)
print(w,h)
