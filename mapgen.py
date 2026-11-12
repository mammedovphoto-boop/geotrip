"""Карта Грузии с маршрутами: контуры стран (Natural Earth), города и линия маршрута."""
import json, os
HERE = os.path.dirname(os.path.abspath(__file__))
G = json.load(open(os.path.join(HERE, "content", "geobase.json"), encoding="utf-8"))
TOWN = {t["ru"]: t for t in G["towns"]}
AIRPORTS = {"Тбилиси", "Кутаиси", "Батуми"}
# смещение подписи: (dx, dy, выравнивание)
LBL = {"Тбилиси": (11, 17, "start"), "Мцхета": (-10, -1, "end"), "Ананури": (-10, 4, "end"), "Гудаури": (-10, 5, "end"),
       "Казбеги": (-10, -6, "end"), "Сигнахи": (10, 15, "start"), "Телави": (-10, -7, "end"), "Кварели": (10, -6, "start"),
       "Давид-Гареджи": (-10, 16, "end"), "Гори": (0, -12, "middle"), "Уплисцихе": (8, 17, "start"), "Боржоми": (-6, -11, "end"),
       "Ахалцихе": (-10, 4, "end"), "Вардзия": (10, 15, "start"), "Местиа": (-10, -6, "end"), "Ушгули": (10, -5, "start"),
       "Зугдиди": (-11, 5, "end"), "Мартвили": (0, -12, "middle"), "Пещера Прометея": (10, -6, "start"), "Кутаиси": (11, 15, "start"),
       "Батуми": (-11, 16, "end"), "Омало": (10, -5, "start"), "Шатили": (10, -6, "start"), "Бакуриани": (10, 5, "start"),
       "Амбролаури": (10, -5, "start")}

def smooth(pts, t=0.5):
    """Плавная кривая через точки (Catmull-Rom → кубические Безье)."""
    if len(pts) < 2:
        return ""
    d = "M%.1f %.1f" % pts[0]
    for i in range(len(pts) - 1):
        p0 = pts[i - 1] if i else pts[i]
        p1, p2 = pts[i], pts[i + 1]
        p3 = pts[i + 2] if i + 2 < len(pts) else p2
        c1 = (p1[0] + (p2[0] - p0[0]) * t / 3, p1[1] + (p2[1] - p0[1]) * t / 3)
        c2 = (p2[0] - (p3[0] - p1[0]) * t / 3, p2[1] - (p3[1] - p1[1]) * t / 3)
        d += " C%.1f %.1f %.1f %.1f %.1f %.1f" % (c1 + c2 + p2)
    return d

PLANE = '<path d="M0 -5.5l1.2 3.6 4.3 2v1.2l-4.3-1.1-.4 3.1 1.4 1v.9L0 3.9l-2.2 .8v-.9l1.4-1-.4-3.1-4.3 1.1V.1l4.3-2z" fill="#000"/>'

def route_group(pr, lang, cls=""):
    pts = [(TOWN[s]["x"], TOWN[s]["y"]) for s in pr["stops"]]
    seen, marks = set(), []
    for s in pr["stops"]:
        if s in seen:
            continue
        seen.add(s)
        t = TOWN[s]; dx, dy, a = LBL.get(s, (10, 4, "start"))
        name = t[lang]
        if s in AIRPORTS:
            dot = '<g transform="translate(%.1f %.1f)"><circle r="8.5" fill="#fff"/>%s</g>' % (t["x"], t["y"], PLANE)
        else:
            dot = '<circle cx="%.1f" cy="%.1f" r="4.6" fill="#000" stroke="#fff" stroke-width="2"/>' % (t["x"], t["y"])
        marks.append(dot + '<text x="%.1f" y="%.1f" text-anchor="%s">%s</text>' % (t["x"] + dx, t["y"] + dy, a, name))
    return ('<g class="rt%s" data-layer="%s"><path class="rt__line" d="%s"/><g class="rt__stops">%s</g></g>'
            % (" " + cls if cls else "", pr["slug"], smooth(pts), "".join(marks)))

def map_svg(tour, lang, only=None, custom=False):
    labels = "".join('<text class="geo__lbl%s" x="%s" y="%s">%s</text>' % (" geo__sea" if l["en"] == "Black Sea" else "", l["x"], l["y"], l[lang]) for l in G["labels"] if l["en"] != "Russia")
    progs = [] if custom else [p for p in tour["programs"] if only is None or p["slug"] == only]
    routes = "".join(route_group(p, lang, "is-on" if only else "") for p in progs)
    geo_name = {"ru": "Грузия", "en": "Georgia", "ar": "جورجيا"}[lang]
    return ('<svg class="geo" viewBox="0 0 %d %d" role="img" aria-label="%s">' % (G["W"], G["H"], geo_name) +
            '<rect width="%d" height="%d" class="geo__sea-bg"/>' % (G["W"], G["H"]) +
            '<path class="geo__land" d="%s"/>' % G["land"] +
            "".join('<path class="geo__nb" d="%s"/>' % d for d in G["neighbors"].values()) +
            '<path class="geo__ge" d="%s"/>' % G["georgia"] + labels + routes +
            ('<g class="rt is-on rt--custom"><path class="rt__line"/><g class="rt__stops"></g></g>' if custom else "") + "</svg>")

# ---------- Спутниковая карта: маршруты по реальным дорогам (данные 3D-туров) ----------
import json as _json, os as _os
_RDIR = _os.path.join(_os.path.dirname(_os.path.abspath(__file__)), "journey", "data")
_X0, _X1, _YT, _YB, _EY = 15.0, 555.0, 0.0, 290.0, 298.0
_K = 1000.0 / (_X1 - _X0)
_SW, _SH = 1000, round((_YB - _YT) * _K)
_rcache = {}
def _route(slug):
    if slug not in _rcache:
        _rcache[slug] = _json.load(open(_os.path.join(_RDIR, "route-%s.json" % slug), encoding="utf-8"))
    return _rcache[slug]
def _xy(x, y):
    return ((x - _X0) * _K, (_EY - y - _YT) * _K)
def sat_route(pr, lang, cls=""):
    R = _route(pr["slug"])
    pts = [_xy(p[0], p[1]) for p in R["pts"]]
    keep = [pts[0]]
    for p in pts[1:]:
        if abs(p[0] - keep[-1][0]) + abs(p[1] - keep[-1][1]) > 1.2:
            keep.append(p)
    keep.append(pts[-1])
    d = "M" + " L".join("%.1f %.1f" % p for p in keep)
    # подписи без наложений: для каждого города выбираем свободное место вокруг точки
    FS = 17.0
    stops, seen = [], set()
    for s in R["stops"]:
        if s["ru"] in seen:
            continue
        seen.add(s["ru"]); x, y = _xy(s["x"], s["y"])
        name = TOWN[s["ru"]][lang] if s["ru"] in TOWN else s["ru"]
        stops.append((s["ru"], x, y, name))
    dots = [(x - 9, y - 9, x + 9, y + 9) for _, x, y, _ in stops]
    line = [(px - 3, py - 3, px + 3, py + 3) for px, py in keep[::2]]
    # близкие города (меньше ~15 км на карте) подписываем одним блоком, по строке на город
    imp = lambda ru: (ru in AIRPORTS, TOWN.get(ru, {}).get("imp", 0))
    groups = []
    for st in sorted(stops, key=lambda t: imp(t[0]), reverse=True):
        for g in groups:
            if any((st[1] - o[1]) ** 2 + (st[2] - o[2]) ** 2 < 34 ** 2 for o in g):
                g.append(st); break
        else:
            groups.append([st])
    placed, marks = [], []
    C = [(11, 6, "start"), (-11, 6, "end"), (0, -13, "middle"), (0, 25, "middle"), (11, -9, "start"), (-11, -9, "end"), (11, 21, "start"), (-11, 21, "end"),
         (16, 6, "start"), (-16, 6, "end"), (0, -22, "middle"), (0, 34, "middle"),
         (34, -26, "start"), (-34, -26, "end"), (34, 38, "start"), (-34, 38, "end"), (46, 6, "start"), (-46, 6, "end")]
    hit = lambda r, q: r[0] < q[2] and r[2] > q[0] and r[1] < q[3] and r[3] > q[1]
    for ru, x, y, name in stops:
        if ru in AIRPORTS:
            marks.append('<g transform="translate(%.1f %.1f)"><circle r="8.5" fill="#fff"/>%s</g>' % (x, y, PLANE))
        else:
            marks.append('<circle cx="%.1f" cy="%.1f" r="4.6" fill="#000" stroke="#fff" stroke-width="2"/>' % (x, y))
    for g in groups:
        cx = sum(t[1] for t in g) / len(g); cy = sum(t[2] for t in g) / len(g)
        names = [t[3] for t in sorted(g, key=lambda t: imp(t[0]), reverse=True)]
        n = len(names); w = max(len(t) for t in names) * FS * 0.63; hgt = n * FS * 1.12
        spread = max([abs(t[1] - cx) for t in g] + [abs(t[2] - cy) for t in g] + [0])
        best, bs = None, 1e9
        for k, (dx, dy, a) in enumerate(C):
            sp = min(spread, 12); dx2 = dx + (sp if dx > 0 else -sp if dx < 0 else 0)
            x0 = cx + dx2 if a == "start" else cx + dx2 - w if a == "end" else cx + dx2 - w / 2
            top = cy + dy - FS * 0.82 - (hgt - FS * 1.12 if dy < 0 else 0)
            r = (x0 - 2, top, x0 + w + 2, top + hgt + 2)
            sc = k * 1.5 + 100 * sum(hit(r, q) for q in placed) + 90 * sum(hit(r, q) for q in dots) + 1.5 * sum(hit(r, q) for q in line)
            sc += 60 * (r[0] < 4 or r[2] > _SW - 4 or r[1] < 4 or r[3] > _SH - 4)
            if sc < bs:
                best, bs = (dx2, dy, a, r), sc
        dx, dy, a, r = best; placed.append(r)
        tx = cx + dx; ty0 = r[1] + FS * 0.82 + 1
        spans = "".join('<tspan x="%.1f" y="%.1f">%s</tspan>' % (tx, ty0 + i * FS * 1.12, nm) for i, nm in enumerate(names))
        lead = ""
        if abs(dx) > 20 or dy < -20 or dy > 30 or n > 1:
            ex = r[0] + 1 if a == "start" else r[2] - 1 if a == "end" else (r[0] + r[2]) / 2
            ey = min(max(cy, r[1] + 4), r[3] - 4) if a != "middle" else (r[3] if dy < 0 else r[1])
            lead = '<line x1="%.1f" y1="%.1f" x2="%.1f" y2="%.1f" stroke="#fff" stroke-width="1.2" opacity=".75"/>' % (cx, cy, ex, ey)
        marks.insert(0, lead)
        marks.append('<text text-anchor="%s">%s</text>' % (a, spans))
    return ('<g class="rt%s" data-layer="%s"><path class="rt__case" d="%s"/><path class="rt__line" d="%s"/><g class="rt__stops">%s</g></g>'
            % (" " + cls if cls else "", pr["slug"], d, d, "".join(marks)))
def sat_map(tour, lang, only=None, root=""):
    progs = [p for p in tour["programs"] if only is None or p["slug"] == only]
    routes = "".join(sat_route(p, lang, "is-on" if only else "") for p in progs)
    name = {"ru": "Грузия", "en": "Georgia", "ar": "جورجيا"}[lang]
    sea = {"ru": "Чёрное море", "en": "Black Sea", "ar": "البحر الأسود"}[lang]
    sx, sy = _xy(78, 150)
    return ('<svg class="geo geo--sat" viewBox="0 0 %d %d" role="img" aria-label="%s">' % (_SW, _SH, name) +
            '<image href="%sassets/img/map-sat.jpg" x="0" y="0" width="%d" height="%d" preserveAspectRatio="none"/>' % (root, _SW, _SH) +
            '<text class="geo__lbl geo__sea" x="%.0f" y="%.0f">%s</text>' % (sx, sy, sea) + routes + "</svg>")
def sat_map_custom(lang, root=""):
    name = {"ru": "Грузия", "en": "Georgia", "ar": "جورجيا"}[lang]
    sea = {"ru": "Чёрное море", "en": "Black Sea", "ar": "البحر الأسود"}[lang]
    sx, sy = _xy(78, 150)
    return ('<svg class="geo geo--sat" viewBox="0 0 %d %d" role="img" aria-label="%s" data-roads="%sassets/data/roads.json">' % (_SW, _SH, name, root) +
            '<image href="%sassets/img/map-sat.jpg" x="0" y="0" width="%d" height="%d" preserveAspectRatio="none"/>' % (root, _SW, _SH) +
            '<text class="geo__lbl geo__sea" x="%.0f" y="%.0f">%s</text>' % (sx, sy, sea) +
            '<g class="rt is-on rt--custom"><path class="rt__case"/><path class="rt__line"/><g class="rt__stops"></g></g></svg>')
