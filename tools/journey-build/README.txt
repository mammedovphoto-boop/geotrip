3D-МАРШРУТЫ (страница journey/). Нужно только если добавляете новый тур или меняете остановки.

Готовые данные уже лежат в journey/data — для обычной правки сайта эти скрипты не нужны.

Как пересобрать (Python 3.10+, интернет):
  pip install numpy pillow pyproj scipy rasterio
  cd tools/journey-build
  python fetch_dem.py      # скачать рельеф (AWS Terrain Tiles) в raw/
  python build_dem.py      # рельеф -> сетка высот, создаёт h250.npy и out/h1000.bin
  python wc.py             # скачать покрытие земли ESA WorldCover
  python build_tex2.py     # светлая текстура карты -> out/terrain-day*.jpg
  python build_all.py      # дороги всех туров по остановкам из content/tours.py (STOPS)

Потом скопировать в journey/data: terrain-day.jpg -> terrain-4k.jpg, terrain-day-2k.jpg -> terrain-2k.jpg,
файлы route-*.json и tours.json появляются там сами (пути в build_all.py: site/data — поправьте на ../../journey/data).
Новый город на маршруте сначала добавьте в towns.py (название, координаты).
Тексты карточек остановок — в journey/index.html, объекты PLACE и PASS.
