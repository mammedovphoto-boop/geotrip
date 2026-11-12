import rasterio, numpy as np, time
from rasterio.enums import Resampling
from concurrent.futures import ThreadPoolExecutor
import os
os.environ['GDAL_DISABLE_READDIR_ON_OPEN']='EMPTY_DIR'; os.environ['CPL_VSIL_CURL_ALLOWED_EXTENSIONS']='.tif'
def get(t):
    lat,lon=t; name=f'ESA_WorldCover_10m_2021_v200_N{lat:02d}E{lon:03d}_Map.tif'
    url='/vsicurl/https://esa-worldcover.s3.eu-central-1.amazonaws.com/v200/2021/map/'+name
    t0=time.time()
    with rasterio.open(url) as ds:
        print(name, ds.width, ds.height, ds.overviews(1), flush=True)
        f=12  # 10 m * 12 ≈ 120 м (как рельеф)
        out=ds.read(1,out_shape=(ds.height//f,ds.width//f),resampling=Resampling.mode)
        np.save(f'wc_{lat}_{lon}.npy',out); print(name,'done',out.shape,round(time.time()-t0),'s',flush=True)
tiles=[(la,lo) for la in (39,42) for lo in (39,42,45)]
with ThreadPoolExecutor(6) as ex: list(ex.map(get,tiles))
