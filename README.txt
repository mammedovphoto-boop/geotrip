САЙТ GEOTRIP — КАК УСТРОЕН, КАК РЕДАКТИРОВАТЬ И ОПУБЛИКОВАТЬ
=============================================================

dist/        — готовый сайт (его загружают на хостинг); в репозиторий не кладётся, собирается командой python build.py
anketa/      — анкета путешественника: /anketa/ (русская) и /anketa/en.html (английская), заявка уходит в WhatsApp
journey/     — 3D-карта маршрутов, journey/tiles — спутниковые снимки 2025 и рельеф
functions/   — личный кабинет (регистрация, вход, «Мои поездки»); работает на Cloudflare Pages
schema.sql   — таблицы базы личного кабинета

ГДЕ ЧТО МЕНЯТЬ (после правки запустите сборку: python build.py)
  content/common.py  — телефон, WhatsApp, почта, адрес, соцсети, меню, все надписи интерфейса
  content/pages.py   — главная, «О нас», вопросы, новости, звёздные блоги, подписи к фото
  content/tours.py   — туры и маршруты, ЦЕНЫ, ДАТЫ ГРУПП, ПРОГРАММА ПО ДНЯМ
  assets/img/        — фотографии (.webp)
  assets/svg/        — авторская графика GeoTrip (иллюстрации, карты маршрутов, иконки меню)
  assets/video/      — видео на главной и в «О нас»
  assets/docs/       — договор оферты и договор на туруслуги (PDF)
  assets/style.css   — цвета и шрифты (блок :root в начале)

ЦЕНЫ, ДАТЫ И ПРОГРАММА (content/tours.py), пример для маршрута «Легенда»:
  program("legend", 5, "Легенда", "Legend", "g-ushguli-2", layer="day-5",
          group={3: 690, 4: 820},                    # групповой тур: цена за 1 человека по звёздам отеля, $
          private={3: {2: 1150, 4: 890, 6: 790}},    # индивидуальный: {звёзды: {человек: цена за 1 человека}}
          dates=["2027-05-01", "2027-06-12"],        # даты групповых заездов
          plan_ru=[{"title": "Прилёт в Тбилиси", "text": ["Встреча в аэропорту, прогулка по старому городу."], "tags": ["Тбилиси"]},
                   {"title": "Кахетия", "text": ["..."], "tags": ["Вино"]}])
  Пока цен нет, калькулятор пишет «Цену рассчитает менеджер», а заявка уходит в WhatsApp.

СБОРКА: Python 3 и пакет jinja2 (pip install jinja2), затем:  python build.py

ПУБЛИКАЦИЯ НА CLOUDFLARE PAGES (бесплатно)
  1. Зарегистрируйтесь на dash.cloudflare.com.
  2. Удобнее всего через GitHub: загрузите эту папку в репозиторий, затем
     Workers & Pages → Create → Pages → Connect to Git → выберите репозиторий.
     Framework preset: None   Build command: python build.py   Output directory: dist
     (jinja2 поставится сам из requirements.txt)
     (Папка functions/ подхватится автоматически — это и есть личный кабинет.)
  3. Личный кабинет: Workers & Pages → D1 → Create database «geotrip» → Console → вставьте schema.sql → Execute.
     Затем в проекте Pages: Settings → Bindings → Add → D1 database, имя переменной DB, база geotrip.
     Settings → Variables → добавьте ADMIN_KEY (любой длинный пароль менеджера).
  4. Custom domains → добавить geotrip.world и следовать подсказкам по DNS.
     Почта info@geotrip.world остаётся на Timeweb — MX-записи не трогать.

ЗАЯВКИ ИЗ КАБИНЕТА: страница geotrip.world/manager.html — введите ADMIN_KEY, меняйте статус заявок
(«новая», «подтверждена», «отменена»); клиент видит статус в «Мои поездки».
