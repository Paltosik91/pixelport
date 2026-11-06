-- PixelPort: данные каталога. Запускать после 01_schema.sql

INSERT INTO genres (name) VALUES
    ('Приключения'),
    ('Гонки'),
    ('Стратегии'),
    ('Головоломки'),
    ('Хоррор'),
    ('Симуляторы'),
    ('Платформеры'),
    ('Спорт');

INSERT INTO games (slug, title, genre_id, developer, release_year, price, discount_percent, rating, description) VALUES
    ('orbital-echo', 'Orbital Echo', (SELECT id FROM genres WHERE name = 'Приключения'), 'North Orbit Studio', 2024, 1299, 0, 92,
     'Исследуйте далёкую луну и восстановите историю забытой космической станции.'),
    ('mossbound', 'Mossbound', (SELECT id FROM genres WHERE name = 'Приключения'), 'Fernlight Games', 2023, 899, 30, 88,
     'Найдите путь через светящийся лес и древние ворота заросшего города.'),
    ('neon-circuit', 'Neon Circuit', (SELECT id FROM genres WHERE name = 'Гонки'), 'Prism Drive', 2025, 1499, 60, 95,
     'Побеждайте на ночных трассах футуристического города.'),
    ('iron-harbor', 'Iron Harbor', (SELECT id FROM genres WHERE name = 'Стратегии'), 'Copper Dock Studio', 2022, 1199, 0, 81,
     'Развивайте портовый город и соединяйте промышленные районы.'),
    ('dune-runner', 'Dune Runner', (SELECT id FROM genres WHERE name = 'Гонки'), 'Sandline Games', 2024, 999, 25, 77,
     'Исследуйте маршруты среди дюн на машине для бездорожья.'),
    ('lantern-valley', 'Lantern Valley', (SELECT id FROM genres WHERE name = 'Головоломки'), 'Warm Bridge', 2023, 599, 0, 97,
     'Разгадывайте загадки уютной долины и зажигайте вечерние фонари.'),
    ('polar-signal', 'Polar Signal', (SELECT id FROM genres WHERE name = 'Головоломки'), 'Aurora Relay', 2025, 799, 15, 90,
     'Восстановите связь полярной станции и расшифруйте неизвестный сигнал.'),
    ('crimson-keep', 'Crimson Keep', (SELECT id FROM genres WHERE name = 'Стратегии'), 'Red Stone Works', 2024, 1399, 40, 84,
     'Организуйте защиту крепости и распределяйте ресурсы гарнизона.'),
    ('hollow-bell', 'Hollow Bell', (SELECT id FROM genres WHERE name = 'Хоррор'), 'Mistbell Interactive', 2025, 1099, 0, 86,
     'Разгадайте тайну колокола, который звонит в тумане сам по себе.'),
    ('cloud-bakery', 'Cloud Bakery', (SELECT id FROM genres WHERE name = 'Симуляторы'), 'Sugar Cloud', 2024, 699, 50, 94,
     'Пеките хлеб на летающем острове и развозите заказы на дирижабле.'),
    ('ember-leap', 'Ember Leap', (SELECT id FROM genres WHERE name = 'Платформеры'), 'Hot Rock Games', 2023, 499, 0, 79,
     'Прыгайте по обломкам древнего вулкана и не касайтесь лавы.'),
    ('skyline-strikers', 'Skyline Strikers', (SELECT id FROM genres WHERE name = 'Спорт'), 'Rooftop League', 2025, 1299, 20, 73,
     'Командный спорт на ховербордах на крышах ночного мегаполиса.');

INSERT INTO tags (name) VALUES
    ('космос'),
    ('исследование'),
    ('сюжет'),
    ('лес'),
    ('атмосфера'),
    ('киберпанк'),
    ('скорость'),
    ('мультиплеер'),
    ('экономика'),
    ('строительство'),
    ('пустыня'),
    ('открытый мир'),
    ('уют'),
    ('для двоих'),
    ('север'),
    ('детектив'),
    ('средневековье'),
    ('осада'),
    ('туман'),
    ('хардкор'),
    ('ретро'),
    ('соревнования');

-- Пары «игра — тег» записаны по понятным именам, а номера подставляет JOIN
INSERT INTO game_tags (game_id, tag_id)
SELECT games.id, tags.id
FROM (VALUES
    ('orbital-echo', 'космос'), ('orbital-echo', 'исследование'), ('orbital-echo', 'сюжет'),
    ('mossbound', 'лес'), ('mossbound', 'исследование'), ('mossbound', 'атмосфера'),
    ('neon-circuit', 'киберпанк'), ('neon-circuit', 'скорость'), ('neon-circuit', 'мультиплеер'),
    ('iron-harbor', 'экономика'), ('iron-harbor', 'строительство'),
    ('dune-runner', 'пустыня'), ('dune-runner', 'открытый мир'), ('dune-runner', 'скорость'),
    ('lantern-valley', 'уют'), ('lantern-valley', 'атмосфера'), ('lantern-valley', 'для двоих'),
    ('polar-signal', 'север'), ('polar-signal', 'детектив'), ('polar-signal', 'атмосфера'),
    ('crimson-keep', 'средневековье'), ('crimson-keep', 'осада'), ('crimson-keep', 'сюжет'),
    ('hollow-bell', 'туман'), ('hollow-bell', 'детектив'), ('hollow-bell', 'атмосфера'),
    ('cloud-bakery', 'уют'), ('cloud-bakery', 'строительство'), ('cloud-bakery', 'для двоих'),
    ('ember-leap', 'хардкор'), ('ember-leap', 'скорость'), ('ember-leap', 'ретро'),
    ('skyline-strikers', 'мультиплеер'), ('skyline-strikers', 'киберпанк'), ('skyline-strikers', 'соревнования')
) AS pair (slug, tag)
JOIN games ON games.slug = pair.slug
JOIN tags ON tags.name = pair.tag;
