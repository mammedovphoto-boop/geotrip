import numpy as np, math, json, os, sys
from PIL import Image, ImageDraw
from pyproj import Transformer
Z=10
tiles=sorted(os.listdir('raw')); xs=sorted({int(t.split('_')[1]) for t in tiles}); ys=sorted({int(t.split('_')[2][:-4]) for t in tiles})
X0,Y0=xs[0],ys[0]; W=(xs[-1]-X0+1)*256; H=(ys[-1]-Y0+1)*256
M=np.zeros((H,W),np.float32)
for t in tiles:
    _,x,y=t[:-4].split('_');x=int(x);y=int(y)
    a=np.asarray(Image.open('raw/'+t).convert('RGB'),np.float32)
    M[(y-Y0)*256:(y-Y0+1)*256,(x-X0)*256:(x-X0+1)*256]=a[...,0]*256+a[...,1]+a[...,2]/256-32768
print('mosaic',W,H,M.min(),M.max())
# Lambert conformal conic for Georgia (scale error < 0.1% inside)
PROJ="+proj=lcc +lat_1=41.5 +lat_2=43.0 +lat_0=42.2 +lon_0=43.4 +x_0=0 +y_0=0 +ellps=WGS84 +units=m"
fwd=Transformer.from_crs("EPSG:4326",PROJ,always_xy=True); inv=Transformer.from_crs(PROJ,"EPSG:4326",always_xy=True)
LON0,LON1,LAT0,LAT1=39.85,46.85,40.95,43.65
cx,cy=fwd.transform([LON0,LON1,LON0,LON1,43.4,43.4],[LAT0,LAT0,LAT1,LAT1,LAT0,LAT1])
XMIN,XMAX=max(cx[0],cx[2]),min(cx[1],cx[3]); YMIN,YMAX=max(cy[0],cy[1]),min(cy[2],cy[3])
XMIN=math.floor(XMIN/1000)*1000; XMAX=math.floor(XMAX/1000)*1000; YMIN=math.ceil(YMIN/1000)*1000; YMAX=math.floor(YMAX/1000)*1000
print('extent km',(XMAX-XMIN)/1000,(YMAX-YMIN)/1000)
def merc_px(lon,lat):
    n=2**Z; px=(np.asarray(lon)+180)/360*n*256-X0*256
    r=np.radians(lat); py=(1-np.log(np.tan(r)+1/np.cos(r))/math.pi)/2*n*256-Y0*256
    return px,py
def bilinear(A,px,py):
    x0=np.clip(np.floor(px).astype(int),0,A.shape[1]-2); y0=np.clip(np.floor(py).astype(int),0,A.shape[0]-2)
    fx=px-x0; fy=py-y0
    return (A[y0,x0]*(1-fx)*(1-fy)+A[y0,x0+1]*fx*(1-fy)+A[y0+1,x0]*(1-fx)*fy+A[y0+1,x0+1]*fx*fy)
def grid(step):
    gx=np.arange(XMIN,XMAX+1,step); gy=np.arange(YMAX,YMIN-1,-step)  # north at row 0
    GX,GY=np.meshgrid(gx,gy); lon,lat=inv.transform(GX,GY)
    px,py=merc_px(lon,lat); return gx,gy,bilinear(M,px,py)
meta={'proj':PROJ,'xmin':XMIN,'xmax':XMAX,'ymin':YMIN,'ymax':YMAX}
# mesh 1 km
gx,gy,Hm=grid(1000); meta['mesh']={'nx':len(gx),'ny':len(gy),'step':1000}
np.clip(Hm,-200,6000).round().astype('<i2').tofile('../j3d/out_h1000.bin') if False else None
os.makedirs('out',exist_ok=True)
np.clip(Hm,-200,6000).round().astype('<i2').tofile('out/h1000.bin')
# 250 m grid for texture and road heights
gx2,gy2,Ht=grid(250); meta['tex']={'nx':len(gx2),'ny':len(gy2),'step':250}
np.save('h250.npy',Ht)
json.dump(meta,open('meta.json','w'))
print('mesh',Hm.shape,'tex',Ht.shape, 'max',Hm.max(),Ht.max())
