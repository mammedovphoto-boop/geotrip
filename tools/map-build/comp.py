"""Безоблачная мозаика Грузии из Sentinel-2 L2A лета 2025 (Copernicus, бесплатно и для коммерции).
Лучший пиксель: сцены по приоритету (меньше облаков, август–сентябрь), облака/тени по SCL вырезаются,
цвет каждой сцены подгоняется к спокойной палитре мозаики 2016, чтобы швы между датами не были видны."""
import json, math, os, sys, time, threading
import numpy as np
from concurrent.futures import ThreadPoolExecutor
os.environ.update(CURL_CA_BUNDLE='/root/.ccr/ca-bundle.crt', GDAL_DISABLE_READDIR_ON_OPEN='EMPTY_DIR', GDAL_HTTP_MULTIPLEX='YES',
                  VSI_CACHE='TRUE', VSI_CACHE_SIZE='400000000', GDAL_CACHEMAX='1500', GDAL_HTTP_MAX_RETRY='4', GDAL_HTTP_RETRY_DELAY='2')
import rasterio
from rasterio.vrt import WarpedVRT
from rasterio.windows import from_bounds
from rasterio.enums import Resampling
from rasterio.warp import reproject
from PIL import Image, ImageFilter
from scipy import ndimage
from pyproj import Transformer

D = os.path.dirname(os.path.abspath(__file__)); S = os.path.dirname(D)
OUT = f'{S}/mt/sat25'; os.makedirs(OUT, exist_ok=True)
items = json.load(open(f'{D}/items.json'))
sets = json.load(open(f'{S}/mt/sets.json'))['sat']
R = 6378137.0; ORIG = math.pi * R
def tb(z, x, y):
    n = 2 ** z; s = 2 * ORIG / n
    return (-ORIG + x * s, ORIG - (y + 1) * s, -ORIG + (x + 1) * s, ORIG - y * s)
def log(*a):
    print(time.strftime('%H:%M:%S'), *a, flush=True)

# 1. выбор сцен: по каждому квадрату MGRS до 6 лучших
def key(i):
    m = int(i['dt'][5:7]); return i['cc'] + (4 if m == 6 else 0) + (1 if m == 9 and int(i['dt'][8:10]) > 12 else 0)
by = {}
for i in items: by.setdefault(i['tile'], []).append(i)
scenes = []
for t, l in by.items(): scenes += sorted(l, key=key)[:6]
scenes.sort(key=key)
log('scenes', len(scenes))

# 2. калибровка цвета каждой сцены к мозаике 2016 (по квантилям, только чистые пиксели)
REF = f'{S}/mt/sat'
merc = Transformer.from_crs('EPSG:4326', 'EPSG:3857', always_xy=True)
def ref_sample(xm, ym, z=11):
    n = 2 ** z; px = (xm + ORIG) / (2 * ORIG) * n * 256; py = (ORIG - ym) / (2 * ORIG) * n * 256
    tx, ty = (px // 256).astype(int), (py // 256).astype(int); out = np.full((len(xm), 3), -1, np.int16)
    for (a, b) in set(zip(tx.tolist(), ty.tolist())):
        f = f'{REF}/{z}/{a}/{b}.jpg'
        if not os.path.exists(f): continue
        im = np.asarray(Image.open(f).convert('RGB')); m = (tx == a) & (ty == b)
        out[m] = im[(py[m] % 256).astype(int), (px[m] % 256).astype(int)]
    return out
GOOD = np.array([0, 0, 1, 0, 1, 1, 1, 1, 0, 0, 0, 1], bool)  # 2 тёмные, 4 растит., 5 почва, 6 вода, 7 прочее, 11 снег
CAL = {}
calf = f'{D}/cal.json'
if os.path.exists(calf): CAL = json.load(open(calf))
def calibrate(sc):
    if sc['id'] in CAL: return
    try:
        with rasterio.open(sc['visual'], overview_level=2) as v, rasterio.open(sc['scl'], overview_level=1) as s:
            a = v.read(); q = s.read(1, out_shape=(v.height, v.width), resampling=Resampling.nearest)
            ok = GOOD[np.clip(q, 0, 11)] & (a.min(0) > 0)
            ok = ndimage.binary_erosion(ok, iterations=2)
            rr, cc = np.nonzero(ok)
            if len(rr) < 2000: CAL[sc['id']] = None; return
            k = np.random.default_rng(1).choice(len(rr), min(30000, len(rr)), replace=False); rr, cc = rr[k], cc[k]
            xs, ys = rasterio.transform.xy(v.transform, rr, cc)
            tr = Transformer.from_crs(v.crs, 'EPSG:3857', always_xy=True); xm, ym = tr.transform(np.array(xs), np.array(ys))
            ref = ref_sample(np.array(xm), np.array(ym)); m = ref[:, 0] >= 0
            if m.sum() < 1500: CAL[sc['id']] = None; return
            new = a[:, rr, cc].T[m].astype(np.float64); ref = ref[m].astype(np.float64)
            ps = [3, 10, 25, 50, 75, 90, 97]
            CAL[sc['id']] = [[np.percentile(new[:, c], ps).tolist(), np.percentile(ref[:, c], ps).tolist()] for c in range(3)]
    except Exception as e:
        log('cal fail', sc['id'], e); CAL[sc['id']] = None
def apply_cal(sc, rgb):
    c = CAL.get(sc['id'])
    if not c: return rgb
    out = np.empty(rgb.shape, np.float32)
    for k in range(3):
        xp, fp = c[k]; xp = np.maximum.accumulate(np.array(xp) + np.arange(7) * 1e-3)
        # кусочно-линейно по квантилям, за краями — продолжение наклона
        v = rgb[k].astype(np.float32); o = np.interp(v, xp, fp)
        lo = v < xp[0]; hi = v > xp[-1]
        o[lo] = fp[0] + (v[lo] - xp[0]) * (fp[1] - fp[0]) / max(xp[1] - xp[0], 1)
        o[hi] = fp[-1] + (v[hi] - xp[-1]) * (fp[-1] - fp[-2]) / max(xp[-1] - xp[-2], 1)
        out[k] = o
    return out

if 'cal' in sys.argv:
    with ThreadPoolExecutor(6) as ex:
        for n, _ in enumerate(ex.map(calibrate, scenes)):
            if n % 20 == 0: log('cal', n)
    json.dump(CAL, open(calf, 'w')); log('cal done', sum(1 for v in CAL.values() if v))
    sys.exit()

# 3. мозаика по зуму
OVL = {13: (None, 0), 12: (0, 0), 11: (1, 1), 10: (2, 2)}  # уровень обзора для TCI и SCL
def lonlat_bbox(z, x, y):
    b = tb(z, x, y); inv = Transformer.from_crs('EPSG:3857', 'EPSG:4326', always_xy=True)
    lo0, la0 = inv.transform(b[0], b[1]); lo1, la1 = inv.transform(b[2], b[3]); return lo0, la0, lo1, la1
def run(z):
    tiles = [tuple(t) for t in sets[str(z)]]
    acc = {t: np.zeros((256, 256, 3), np.float32) for t in tiles}; fill = {t: np.zeros((256, 256), bool) for t in tiles}
    llb = {t: lonlat_bbox(z, *t) for t in tiles}
    ovv, ovs = OVL[z]; lock = threading.Lock(); done_sc = 0
    for sc in scenes:
        if CAL.get(sc['id']) is None and sc['id'] in CAL: continue
        b = sc['bbox']
        mine = [t for t in tiles if not fill[t].all() and llb[t][0] < b[2] and llb[t][2] > b[0] and llb[t][1] < b[3] and llb[t][3] > b[1]]
        if not mine: continue
        try:
            kw = {} if ovv is None else {'overview_level': ovv}
            if True:
                tl = threading.local(); opened = []; olock = threading.Lock()
                def ds():
                    if not hasattr(tl, 'v'):
                        tl.v = rasterio.open(sc['visual'], **kw); tl.s = rasterio.open(sc['scl'], **({} if ovs is None else {'overview_level': ovs}))
                        with olock: opened.extend([tl.v, tl.s])
                    return tl.v, tl.s
                class _L:
                    def __enter__(self): return self
                    def __exit__(self, *a): return False
                rlock = _L()
                def one(t):
                    v, s = ds()
                    bb = tb(z, *t); T = rasterio.transform.from_bounds(*bb, 256, 256)
                    q = np.zeros((256, 256), np.uint8)
                    with rlock: reproject(rasterio.band(s, 1), q, dst_transform=T, dst_crs='EPSG:3857', resampling=Resampling.nearest, src_nodata=0, dst_nodata=0)
                    ok = GOOD[np.clip(q, 0, 11)]
                    need = ok & ~fill[t]
                    if need.sum() < 30: return
                    a = np.zeros((3, 256, 256), np.uint8)
                    with rlock: reproject(rasterio.band(v, (1, 2, 3)), a, dst_transform=T, dst_crs='EPSG:3857', resampling=Resampling.bilinear, src_nodata=0, dst_nodata=0)
                    ok &= a.min(0) > 0
                    bad = ~ok; bad = ndimage.binary_dilation(bad, iterations=2 if z >= 12 else 1) & (q != 0) | (q == 0) | (a.min(0) == 0)
                    use = ~bad & ~fill[t]
                    if not use.any(): return
                    c = apply_cal(sc, a)
                    with lock:
                        acc[t][use] = np.moveaxis(c, 0, -1)[use]; fill[t] |= use
                with ThreadPoolExecutor(8) as ex: list(ex.map(one, mine))
                for d in opened: d.close()
        except Exception as e:
            log('scene fail', sc['id'], str(e)[:120])
        done_sc += 1
        nf = sum(int(f.all()) for f in fill.values()); pct = sum(f.mean() for f in fill.values()) / len(fill) * 100
        log(f'z{z} scene {done_sc} {sc["id"]} cc={sc["cc"]:.1f} tiles_full={nf}/{len(tiles)} filled={pct:.2f}%')
        if pct > 99.97: break
    for (x, y) in tiles:
        a = acc[(x, y)]; f = fill[(x, y)]
        ref = f'{REF}/{z}/{x}/{y}.jpg'
        if (~f).any() and os.path.exists(ref):  # дыры (облака во всех сценах) — из мозаики 2016
            r = np.asarray(Image.open(ref).convert('RGB')).astype(np.float32)
            soft = ndimage.gaussian_filter(f.astype(np.float32), 2)
            a = a * soft[..., None] + r * (1 - soft[..., None]); a[~f] = r[~f]
        im = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))
        if z == 13: im = im.filter(ImageFilter.UnsharpMask(1.0, 45, 2))
        os.makedirs(f'{OUT}/{z}/{x}', exist_ok=True); im.save(f'{OUT}/{z}/{x}/{y}.jpg', quality=92)
    log('z', z, 'saved')

if __name__ == '__main__':
    for z in map(int, sys.argv[1:]): run(z)
