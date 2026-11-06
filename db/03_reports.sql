-- PixelPort: пять отчётов для аналитика

-- 1. Три самые дорогие игры по цене со скидкой
SELECT title,
       price,
       discount_percent,
       price * (100 - discount_percent) / 100 AS final_price
FROM games
ORDER BY final_price DESC
LIMIT 3;

-- 2. Средняя скидка по жанрам
SELECT genres.name AS genre,
       COUNT(*) AS games_count,
       ROUND(AVG(games.discount_percent), 1) AS avg_discount
FROM games
JOIN genres ON genres.id = games.genre_id
GROUP BY genres.name
ORDER BY avg_discount DESC, genre;

-- 3. Самые популярные теги
SELECT tags.name AS tag,
       COUNT(*) AS games_count
FROM game_tags
JOIN tags ON tags.id = game_tags.tag_id
GROUP BY tags.name
HAVING COUNT(*) >= 2
ORDER BY games_count DESC, tag;

-- 4. Игры с тегом «атмосфера» и их жанры
SELECT games.title,
       genres.name AS genre,
       games.rating
FROM games
JOIN genres ON genres.id = games.genre_id
JOIN game_tags ON game_tags.game_id = games.id
JOIN tags ON tags.id = game_tags.tag_id
WHERE tags.name = 'атмосфера'
ORDER BY games.rating DESC;

-- 5. Карточка для каталога: все теги игры одной строкой
SELECT games.title,
       STRING_AGG(tags.name, ', ' ORDER BY tags.name) AS tags
FROM games
JOIN game_tags ON game_tags.game_id = games.id
JOIN tags ON tags.id = game_tags.tag_id
GROUP BY games.id, games.title
ORDER BY games.id;
