-- PixelPort: игры, похожие на Hollow Bell (id 9), по общим тегам
-- Запускать в базе приложения pixelport_app_<код>: таблицы там создал EF Core,
-- поэтому столбцы связующей таблицы называются games_id и tags_id

SELECT other.title,
       COUNT(*) AS common,
       STRING_AGG(tags.name, ', ' ORDER BY tags.name) AS common_tags
FROM game_tags AS mine
JOIN game_tags AS theirs ON theirs.tags_id = mine.tags_id
                        AND theirs.games_id <> mine.games_id
JOIN games AS other ON other.id = theirs.games_id
JOIN tags ON tags.id = mine.tags_id
WHERE mine.games_id = 9
GROUP BY other.id, other.title
ORDER BY common DESC, other.title
LIMIT 4;
