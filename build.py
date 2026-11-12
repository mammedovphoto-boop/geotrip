"""Сборка сайта GeoTrip:  python build.py  →  готовый сайт в папке dist/"""
import os, re, shutil, datetime, sys, json
from jinja2 import Environment, FileSystemLoader

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "content"))
from common import CONTACTS, NAV, UI
from pages import HOME, ABOUT, FAQ, NEWS, BLOGS, GALLERY
from tours import TOURS, TOURS_PAGE, INCLUDED, PLACES, AIRPORTS, REGIONS, REGION_TXT
sys.path.insert(0, HERE)
from mapgen import map_svg, sat_map, sat_map_custom

LUX = os.environ.get("LUX") == "1"   # LUX=1 python build.py — новая версия оформления, собирается в dist_lux
DIST = os.path.join(HERE, "dist_lux" if LUX else "dist")
env = Environment(loader=FileSystemLoader(os.path.join(HERE, "templates")), autoescape=True)
SVG_DIR = os.path.join(HERE, "assets", "svg")
TERRAIN = "map-terrain.webp" if os.path.exists(os.path.join(HERE, "assets", "img", "map-terrain.webp")) else None

LOGO = open(os.path.join(HERE, "assets", "logo.svg"), encoding="utf-8").read()
ICONS = {
    "wa": '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.7-1.4.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.1 5.1 0 0 0 1.1 2.7 11.7 11.7 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3z"/></svg>',
    "instagram": '<svg viewBox="0 0 24 24"><path d="M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm0 8.2a3.2 3.2 0 1 1 0-6.4 3.2 3.2 0 0 1 0 6.4zM17.3 5.5a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4zM21.9 7c-.1-1.6-.4-3-1.6-4.2S17.7 1.2 16.1 1.1C14.4 1 9.6 1 7.9 1.1 6.3 1.2 4.9 1.5 3.7 2.7S2.1 5.4 2 7c-.1 1.7-.1 6.5 0 8.2.1 1.6.4 3 1.6 4.2s2.6 1.5 4.2 1.6c1.7.1 6.5.1 8.2 0 1.6-.1 3-.4 4.2-1.6s1.5-2.6 1.6-4.2c.2-1.7.2-6.5.1-8.2zm-2.2 10.1a3.3 3.3 0 0 1-1.9 1.9c-1.3.5-4.3.4-5.8.4s-4.5.1-5.8-.4a3.3 3.3 0 0 1-1.9-1.9c-.5-1.3-.4-4.3-.4-5.8s-.1-4.5.4-5.8a3.3 3.3 0 0 1 1.9-1.9c1.3-.5 4.3-.4 5.8-.4s4.5-.1 5.8.4a3.3 3.3 0 0 1 1.9 1.9c.5 1.3.4 4.3.4 5.8s.1 4.5-.4 5.8z"/></svg>',
    "facebook": '<svg viewBox="0 0 24 24"><path d="M14 8V6.2c0-.8.2-1.2 1.4-1.2H17V2h-2.6C11.3 2 10 3.5 10 6v2H8v3h2v11h4V11h2.7l.3-3z"/></svg>',
    "youtube": '<svg viewBox="0 0 24 24"><path d="M23 7.2a3 3 0 0 0-2.1-2.1C19 4.6 12 4.6 12 4.6s-7 0-8.9.5A3 3 0 0 0 1 7.2 31 31 0 0 0 .5 12a31 31 0 0 0 .5 4.8 3 3 0 0 0 2.1 2.1c1.9.5 8.9.5 8.9.5s7 0 8.9-.5a3 3 0 0 0 2.1-2.1 31 31 0 0 0 .5-4.8 31 31 0 0 0-.5-4.8zM9.7 15V9l5.8 3-5.8 3z"/></svg>',
    "tiktok": '<svg viewBox="0 0 24 24"><path d="M19.6 6.7a4.8 4.8 0 0 1-3.8-4.2V2h-3.4v13.4a2.9 2.9 0 1 1-2-2.7V9.2a6.3 6.3 0 1 0 5.4 6.2V8.6a8.1 8.1 0 0 0 4.8 1.5V6.8l-1-.1z"/></svg>',
    "vk": '<svg viewBox="0 0 24 24"><path d="M12.8 18c-6.3 0-9.9-4.3-10-11.5h3.1c.1 5.3 2.4 7.5 4.3 8V6.5h3v4.5c1.8-.2 3.7-2.3 4.4-4.5h2.9a8.7 8.7 0 0 1-4 5.6 9 9 0 0 1 4.7 5.9h-3.2a5.6 5.6 0 0 0-4.8-4V18h-.4z"/></svg>',
}

MAP_VIEW = (41000, 21000, 138500, 79000)  # видимая часть карт маршрутов (x, y, ширина, высота)
_svg_cache = {}
def svg(name, prefix, cls="", reveal=False):
    """Встраивает SVG из assets/svg: классы CorelDRAW (fil0, str1…) получают префикс, чтобы рисунки не мешали друг другу."""
    if name not in _svg_cache:
        _svg_cache[name] = open(os.path.join(SVG_DIR, name + ".svg"), encoding="utf-8").read()
    s = _svg_cache[name]
    s = re.sub(r"\.((?:fil|str)\d+)", lambda m: "." + prefix + "-" + m.group(1), s)
    s = re.sub(r'class="([^"]*)"', lambda m: 'class="' + " ".join(prefix + "-" + c if re.fullmatch(r"(fil|str)\d+", c) else c for c in m.group(1).split()) + '"', s)
    s = re.sub(r'\sid="[^"]*"', "", s)
    s = re.sub(r'<svg([^>]*?)\swidth="[^"]*"', r"<svg\1", s, count=1)
    s = re.sub(r'<svg([^>]*?)\sheight="[^"]*"', r"<svg\1", s, count=1)
    s = re.sub(r'<svg([^>]*?)\sclass="([^"]*)"', r'<svg\1 data-c="\2"', s, count=1)
    if name.startswith("map-"):
        s = re.sub(r'viewBox="[^"]*"', 'viewBox="%d %d %d %d"' % MAP_VIEW, s, count=1)
    attrs = ' class="%s"' % cls if cls else ""
    attrs += " data-reveal" if reveal else ""
    attrs += ' data-art="%s"' % name
    s = s.replace("<svg", '<svg role="img" aria-hidden="true" focusable="false"' + attrs, 1)
    return s

# Фото для слайдера программы: только места, которые есть в маршруте (плюс транспорт формата)
STOP_PHOTOS = {"Казбеги": ["h-kazbegi", "g-chaukhi"], "Сигнахи": ["h-vineyard"], "Телави": ["h-vineyard"], "Кварели": ["h-vineyard"],
    "Местиа": ["h-mestia", "g-svaneti-1", "g-ushba-1"], "Ушгули": ["g-ushguli-2", "g-shkhara"], "Батуми": ["h-sea"],
    "Шатили": ["g-shatili-1", "g-mutso-1", "g-anatori"], "Омало": ["g-omalo", "g-dartlo", "g-pass-1", "g-tusheti-1"],
    "Кутаиси": ["t-katskhi"], "Мартвили": ["h-bridge"]}
def prog_slides(pr, t, lang):
    from content.pages import GALLERY
    cap = {g[0]: g[{"ru": 1, "en": 2, "ar": 3}[lang]] for g in GALLERY}
    out = [pr["img"]]
    for st in pr.get("stops", []):
        for im in STOP_PHOTOS.get(st, [])[:2]:
            if im not in out: out.append(im)
    if t["slug"] == "full-immersion":
        for im in ["g-buggy-1", "n-heli", "n-jeep"]:
            if im not in out and os.path.exists(os.path.join("assets", "img", im + ".webp")): out.append(im)
    for im in ["t-road", "g-lakes-1", "g-ridge"]:
        if len(out) >= 4: break
        if im not in out: out.append(im)
    return [(im, cap.get(im, "")) for im in out[:8]]

def from_price(pr, lang):
    vals = [v for v in pr["group"].values() if v] + [x for row in pr["private"].values() for x in row.values() if x]
    if not vals:
        return ""
    return {"ru": "от %s $ / чел.", "en": "from %s $ / person", "ar": "من %s $ للشخص"}[lang] % (format(min(vals), ",") if lang == "ar" else format(min(vals), ",").replace(",", " "))

def town_name(n, lang):
    from mapgen import TOWN
    return TOWN[n][lang]

def calc_payload(pr, lang, custom=False):
    from mapgen import TOWN, LBL
    names = sorted({n for _, ns in PLACES for n in ns} | set(pr["stops"]) | set(AIRPORTS))
    kind = "custom" if custom else ("adventure" if any(pr is q for q in TOURS[1]["programs"]) else "classic")
    return {"custom": custom, "kind": kind, "program": {"slug": pr["slug"], "name": pr[lang]["name"], "days": pr["days"],
            "group": {str(k): v for k, v in pr["group"].items()},
            "private": {str(k): {str(n): x for n, x in v.items()} for k, v in pr["private"].items()},
            "dates": sorted(pr["dates"]), "stops": pr["stops"]},
            "towns": {n: {"name": TOWN[n][lang], "x": TOWN[n]["x"], "y": TOWN[n]["y"], "l": LBL.get(n, (10, 4, "start"))} for n in names},
            "airports": AIRPORTS}

def stop_list(pr, lang):
    from mapgen import TOWN
    seen, out = set(), []
    for s in pr["stops"]:
        if s not in seen:
            seen.add(s); out.append(s)
    if pr["stops"] and pr["stops"][-1] != out[-1]:
        out.append(pr["stops"][-1])
    return [TOWN[s][lang] for s in out]

LANGS = ("ru", "en", "ar")
# Единая лексика «экспедиций»: старые слова в текстах заменяются при сборке
TERMS = {
    "ru": [("менеджера", "ведущего экспедиции"), ("менеджером", "ведущим экспедиции"), ("Менеджер", "Ведущий экспедиции"), ("менеджер", "ведущий экспедиции"),
           ("«С Востока на Запад»", "«Классик»"), ("«Полное погружение»", "«Приключение»"), ("6–16 человек", "до 12 человек")],
    "en": [("travel manager", "expedition host"), ("Full Immersion", "Adventure"), ("East to West", "Classic"), ("6–16 like-minded travellers", "up to 12 like-minded travellers"), ("6–16", "up to 12")],
    "ar": [("مسؤول الرحلات", "مضيف الرحلة"), ("«الانغماس الكامل»", "«المغامرة»"), ("«من الشرق إلى الغرب»", "«الكلاسيكية»"), ("من 6 إلى 16", "حتى 12")],
}
def terms(html, lang):
    for a, b in TERMS[lang]:
        html = html.replace(a, b)
    return html
LIDX = {"ru": 0, "en": 1, "ar": 2}

def dword(n, lang):
    """Слово «дней» с правильной формой для числа n."""
    if lang == "ru":
        a, b = n % 10, n % 100
        return "день" if a == 1 and b != 11 else "дня" if 2 <= a <= 4 and not 12 <= b <= 14 else "дней"
    if lang == "ar":
        if n == 1: return "يوم"
        if n == 2: return "يومان"
        if 3 <= n % 100 <= 10: return "أيام"
        if 11 <= n % 100 <= 99: return "يومًا"
        return "يوم"
    return "day" if n == 1 else "days"

def render(tpl, path, lang, ctx):
    depth = path.count("/") + (0 if lang == "ru" else 1)
    root = "../" * depth
    slug = path[:-5]
    def link(s, l=lang):
        pre = "../" * depth + ("" if l == "ru" else l + "/")
        return pre + ("index.html" if s == "index" else s + ".html")
    def nav_name(s):
        for x in NAV:
            if x["slug"] == s:
                return x[lang]
    tour_opts = [f'{t[lang]["name"]}: {p[lang]["name"]} ({p["days"]} {dword(p["days"], lang)})' for t in TOURS for p in t["programs"]]
    data = dict(lang=lang, root=root, link=link, nav=NAV, ui=UI[lang], c=CONTACTS, icons=ICONS, logo=LOGO, svg=svg,
                year=datetime.date.today().year, nav_name=nav_name, tour_opts=tour_opts, tours=TOURS, terrain=TERRAIN,
                ru_href=link(slug, "ru"), en_href=link(slug, "en"), ar_href=link(slug, "ar"), langs=LANGS,
                dir="rtl" if lang == "ar" else "ltr", dword=lambda n: dword(n, lang), li=LIDX[lang], canon="" if slug == "index" else slug,
                from_price=lambda pr: from_price(pr, lang), comma="، " if lang == "ar" else ", ", map_svg=lambda t, only=None, custom=False: sat_map_custom(lang, root) if custom else sat_map(t, lang, only, root),
                places=PLACES, airports=AIRPORTS, regions=REGIONS[lang], region_txt=REGION_TXT[lang], town_name=lambda n: town_name(n, lang), custom=False)
    if slug == "index":
        back = None
    elif "/" in slug and not slug.startswith("account/"):
        back = slug.rsplit("/", 1)[0]
    elif slug in ("east-to-west", "full-immersion", "constructor"):
        back = "travel-in-georgia"
    else:
        back = "index"
    data["back"] = back
    data["lux"] = LUX
    _arts = {"start": "menu_index", "about": "menu_aboutus", "routes": "menu_tours", "dirs": "menu_tours", "transport": "menu_configure",
             "faq": "menu_news", "stars": "menu_blogs", "photo": "menu_photo-video", "contacts": "menu_contacts"}
    data["menu"] = [(link("index") if sid == "start" else ("#" + sid if slug == "index" else link("index") + "#" + sid), label, _arts.get(sid, "menu_index"), sid)
                    for sid, label in HOME[lang]["trail"]]
    data.update(ctx)
    out = os.path.join(DIST, "" if lang == "ru" else lang, path)
    os.makedirs(os.path.dirname(out), exist_ok=True)
    with open(out, "w", encoding="utf-8") as f:
        html = terms(env.get_template(tpl).render(**data), lang)
        f.write(re.sub(r"\n\s*\n", "\n", html))

def build():
    if os.path.exists(DIST):
        shutil.rmtree(DIST)
    os.makedirs(DIST)
    shutil.copytree(os.path.join(HERE, "assets"), os.path.join(DIST, "assets"),
                    ignore=shutil.ignore_patterns("map-*.svg", "main_art*.svg", "aboutus_*.svg"))
    if os.path.isdir(os.path.join(HERE, "journey")):
        shutil.copytree(os.path.join(HERE, "journey"), os.path.join(DIST, "journey"))
    for extra in os.listdir(os.path.join(HERE, "static")):
        shutil.copy(os.path.join(HERE, "static", extra), DIST)
    if os.path.exists(os.path.join(HERE, "functions")):
        pass  # папка functions/ публикуется на Cloudflare вместе с dist (см. README)
    for lang in LANGS:
        L = lambda *v: v[LIDX[lang]]
        render("index.html", "index.html", lang, dict(title=HOME[lang]["title"], desc=HOME[lang]["desc"], active="index",
               h=HOME[lang], news=NEWS, blogs=BLOGS, gallery=GALLERY))
        render("about.html", "about.html", lang, dict(title=ABOUT[lang]["title"], desc=ABOUT[lang]["desc"], active="about", a=ABOUT[lang], h=HOME[lang]))
        render("faq.html", "faq.html", lang, dict(title=FAQ[lang]["title"], desc=FAQ[lang]["desc"], active="faq", f=FAQ[lang]))
        render("contact.html", "contact.html", lang, dict(title=L("Контакты GeoTrip", "Contact GeoTrip", "تواصل مع GeoTrip"), desc=UI[lang]["form_lead"], active="contact"))
        tl = TOURS_PAGE[lang]
        render("tours.html", "travel-in-georgia.html", lang, dict(title=tl["title"], desc=tl["desc"], active="travel-in-georgia", tl=tl))
        for t in TOURS:
            d = t[lang]
            render("category.html", t["slug"] + ".html", lang, dict(title=d["name"] + " — GeoTrip", desc=d["short"], active="travel-in-georgia",
                   t=t, d=d, incl=INCLUDED))
            for pr in t["programs"]:
                calc = calc_payload(pr, lang)
                render("program.html", t["slug"] + "/" + pr["slug"] + ".html", lang, dict(
                    title=pr[lang]["name"] + ("، " if lang == "ar" else ", ") + str(pr["days"]) + " " + dword(pr["days"], lang) + " — " + d["name"] + " — GeoTrip",
                    desc=d["short"], active="travel-in-georgia", t=t, pr=pr, incl=INCLUDED,
                    stops=stop_list(pr, lang), ckind=calc["kind"], slides=prog_slides(pr, t, lang),
                    calc_json=json.dumps(calc, ensure_ascii=False).replace("</", "<\\/")))
        custom_pr = {"slug": "custom", "days": 7, "img": "h-kazbegi", "group": {}, "private": {}, "dates": [],
                     "stops": ["Тбилиси", "Мцхета", "Казбеги", "Сигнахи", "Тбилиси"],
                     "ru": {"name": "Свой маршрут"}, "en": {"name": "Your own route"}, "ar": {"name": "مسارك الخاص"}}
        custom_t = {"stars": [4, 5], "programs": []}
        render("constructor.html", "constructor.html", lang, dict(title=UI[lang]["cons_title"] + " — GeoTrip", desc=UI[lang]["cons_sub"],
               active="travel-in-georgia", pr=custom_pr, t=custom_t, custom=True, ckind="custom",
               calc_json=json.dumps(calc_payload(custom_pr, lang, True), ensure_ascii=False).replace("</", "<\\/")))
        render("list.html", "news.html", lang, dict(title=L("Акции и новости GeoTrip", "GeoTrip news & offers", "أخبار GeoTrip وعروضها"),
               desc=L("Вертолёты, багги и джипы — что можно добавить к туру по Грузии.", "Helicopter flights, buggy rides and jeep safaris you can add to a Georgia tour.", "رحلات بالمروحية، وجولات بعربات البقي، ورحلات سفاري بسيارات الجيب: تجارب يمكنك إضافتها إلى رحلتك في جورجيا."),
               active="news", kind="news", items=NEWS, h1=L("Акции и новости", "News & offers", "الأخبار والعروض"),
               sub=L("Впечатления, которые можно добавить к любому маршруту.", "Experiences you can add to any route.", "تجارب يمكنك إضافتها إلى أي مسار.")))
        render("list.html", "starblogs.html", lang, dict(title=L("Звёздные блоги — GeoTrip", "Celebrity stories — GeoTrip", "قصص المشاهير — GeoTrip"),
               desc=L("Ирина Хакамада, Катарина Пудар, Евгений Пронин, Стас Бондаренко и Orator Club о Грузии с GeoTrip.", "Irina Khakamada, Katarina Pudar, Evgeny Pronin, Stas Bondarenko and Orator Club on travelling in Georgia with GeoTrip.", "إيرينا خاكامادا وكاتارينا بودار ويفغيني برونين وستاس بوندارينكو ونادي أوراتور يروون رحلاتهم إلى جورجيا مع GeoTrip."),
               active="starblogs", kind="blogs", items=BLOGS, h1=L("Звёздные блоги", "Celebrity stories", "قصص المشاهير"),
               sub=L("Наведите на звезду, чтобы увидеть, кто с нами путешествовал.", "Hover over a star to see who has travelled with us.", "مرِّر المؤشر فوق النجمة لترى من سافر معنا.")))
        render("list.html", "photogallery.html", lang, dict(title=L("Фото и видео — GeoTrip", "Gallery — GeoTrip", "معرض الصور — GeoTrip"),
               desc=L("Сванетия, Тушети, Хевсурети, Казбеги и Кахетия на фотографиях из наших туров.", "Svaneti, Tusheti, Khevsureti, Kazbegi and Kakheti in photos from our tours.", "سفانيتي وتوشيتي وخيفسوريتي وكازبيغي وكاخيتي في صور من رحلاتنا."),
               active="photogallery", kind="gallery", items=GALLERY, h1=L("Фото и видео", "Gallery", "معرض الصور"),
               sub=L("Всё это снято на маршрутах GeoTrip. Нажмите на фото, чтобы открыть крупно.", "Every photo was taken on a GeoTrip route. Tap any image to see it full size.", "التُقطت جميع هذه الصور خلال رحلات GeoTrip. انقر على أي صورة لعرضها بالحجم الكامل.")))
        for n in NEWS:
            d = n[lang]
            render("post.html", "news/" + n["slug"] + ".html", lang, dict(title=d["title"] + " — GeoTrip", desc=d["short"], active="news", kind="news", item=n, d=d))
        for b in BLOGS:
            d = dict(b[lang]); d["tours"] = None
            render("post.html", "starblogs/" + b["slug"] + ".html", lang, dict(title=d["name"] + ": " + d["title"] + " — GeoTrip",
                   desc=d["body"][0][:150], active="starblogs", kind="blog", item=b, d=d))
        for page in ("login", "register", "profile"):
            render("account.html", "account/" + page + ".html", lang, dict(title=UI[lang]["cabinet"] + " — GeoTrip", desc=UI[lang]["acc_why"], active="account", page=page))
    urls = []
    for dp, _, fs in os.walk(DIST):
        for f in fs:
            if f.endswith(".html") and "/account" not in dp.replace(os.sep, "/"):
                rel = os.path.relpath(os.path.join(dp, f), DIST).replace(os.sep, "/")[:-5]
                urls.append("https://geotrip.world/" + ("" if rel == "index" else rel[:-5] if rel.endswith("/index") else rel))
    with open(os.path.join(DIST, "sitemap.xml"), "w", encoding="utf-8") as f:
        f.write('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n')
        f.writelines(f"  <url><loc>{u}</loc></url>\n" for u in sorted(urls))
        f.write("</urlset>\n")
    print("Готово:", DIST)

if __name__ == "__main__":
    build()
