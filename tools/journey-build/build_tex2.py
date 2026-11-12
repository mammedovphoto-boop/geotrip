import numpy as np, json, math, os
from PIL import Image, ImageDraw, ImageFilter
from pyproj import Transformer
from scipy import ndimage
exec(open('build_dem.py').read().split("print('extent")[0].split("meta={'proj'")[0])
m=json.load(open('meta.json')); XMIN,XMAX,YMIN,YMAX=m['xmin'],m['xmax'],m['ymin'],m['ymax']
def merc_px(lon,lat):
    n=2**Z; px=(np.asarray(lon)+180)/360*n*256-X0*256
    r=np.radians(lat); py=(1-np.log(np.tan(r)+1/np.cos(r))/math.pi)/2*n*256-Y0*256
    return px,py
def bil(A,px,py):
    x0=np.clip(np.floor(px).astype(int),0,A.shape[1]-2); y0=np.clip(np.floor(py).astype(int),0,A.shape[0]-2); fx=px-x0; fy=py-y0
    return A[y0,x0]*(1-fx)*(1-fy)+A[y0,x0+1]*fx*(1-fy)+A[y0+1,x0]*(1-fx)*fy+A[y0+1,x0+1]*fx*fy
STEP=140
gx=np.arange(XMIN,XMAX,STEP); gy=np.arange(YMAX,YMIN,-STEP); GX,GY=np.meshgrid(gx,gy)
lon,lat=inv.transform(GX,GY); px,py=merc_px(lon,lat); Hh=bil(M,px,py); h,w=Hh.shape
# land cover mosaic, 1000 px / degree, top = 45N, left = 39E
WC=np.zeros((6000,9000),np.uint8)
for la in (39,42):
    for lo in (39,42,45):
        a=np.load(f'wc_{la}_{lo}.npy'); r0=(45-(la+3))*1000; c0=(lo-39)*1000; WC[r0:r0+3000,c0:c0+3000]=a
cls=WC[np.clip(((45-lat)*1000).astype(int),0,5999),np.clip(((lon-39)*1000).astype(int),0,8999)]
pal={0:(46,92,124),10:(46,80,48),20:(112,122,80),30:(140,150,100),40:(172,166,122),50:(176,166,156),60:(158,146,128),70:(246,248,251),80:(46,92,124),90:(92,122,92),95:(60,96,70),100:(146,146,116)}
rgb=np.zeros((h,w,3),np.float32)
for k,c in pal.items(): rgb[cls==k]=c
# альпийские луга выше 2000 м — теплее; скалы выше 3000 — холоднее
alp=np.clip((Hh-1900)/900,0,1)[...,None]*np.isin(cls,(30,20,100))[...,None]
rgb=rgb*(1-alp*0.35)+np.array([178,166,112])*alp*0.35
rock=np.clip((Hh-2800)/800,0,1)[...,None]*(cls==60)[...,None]
rgb=rgb*(1-rock*0.5)+np.array([150,150,152])*rock*0.5
for i in range(3): rgb[...,i]=ndimage.gaussian_filter(rgb[...,i],0.9)
# мягкая многонаправленная светотень
dy,dx=np.gradient(Hh,STEP); slope=np.arctan(np.hypot(dx,dy)*1.0); aspect=np.arctan2(-dx,dy)
def hs(az,alt): az,alt=math.radians(az),math.radians(alt); return np.clip(np.sin(alt)*np.cos(slope)+np.cos(alt)*np.sin(slope)*np.cos(az-aspect),0,1)
shade=0.5*hs(315,40)+0.3*hs(270,45)+0.2*hs(0,55)
flat=math.sin(math.radians(43.5))
shade=np.clip(0.42+0.72*(shade/flat*0.78),0.25,1.25)
water=(cls==80)|(cls==0)|(Hh<=0.3)&(cls!=50)
col=rgb*shade[...,None]
# море: глубже — темнее
depth=np.clip(-ndimage.gaussian_filter(Hh,6)/1500,0,1)[...,None]
sea=np.array([70,128,160])*(1-depth)+np.array([34,74,104])*depth
col=np.where(water[...,None],sea,col)
# Грузия ярче, соседи — приглушены к дымке
g=json.load(open('georgia_ne10.json')); ring=g['coordinates'][0]; bx,by=fwd.transform([p[0] for p in ring],[p[1] for p in ring])
mk=Image.new('L',(w,h),0); ImageDraw.Draw(mk).polygon([((x-XMIN)/STEP,(YMAX-y)/STEP) for x,y in zip(bx,by)],fill=255); mask=np.asarray(mk.filter(ImageFilter.GaussianBlur(1.5)),np.float32)[...,None]/255
haze=np.array([214,222,228],np.float32); lum=col.mean(axis=2,keepdims=True)
outside=(col*0.45+lum*0.55)*0.62+haze*0.38
col=col*mask+outside*(1-mask)
col=np.where(water[...,None]&(mask<0.5),sea*0.85+haze*0.15,col)
img=Image.fromarray(np.clip(col,0,255).astype(np.uint8))
img.save('out/terrain-day.jpg',quality=88); img.resize((w//2,h//2),Image.LANCZOS).save('out/terrain-day-2k.jpg',quality=85)
print('ok',w,h, {k:int((cls==k).sum()) for k in pal})
