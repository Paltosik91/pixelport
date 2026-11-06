-- PixelPort: каталог игр. Скрипт можно запускать повторно:
-- он удаляет старые таблицы и создаёт их заново.
DROP TABLE IF EXISTS game_tags, games, tags, genres;

CREATE TABLE genres (
    id   integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name text NOT NULL UNIQUE
);

CREATE TABLE tags (
    id   integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name text NOT NULL UNIQUE
);

CREATE TABLE games (
    id               integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    slug             text    NOT NULL UNIQUE,
    title            text    NOT NULL,
    genre_id         integer NOT NULL REFERENCES genres (id),
    developer        text    NOT NULL,
    release_year     integer NOT NULL CHECK (release_year BETWEEN 1970 AND 2100),
    price            integer NOT NULL CHECK (price >= 0),
    discount_percent integer NOT NULL DEFAULT 0 CHECK (discount_percent BETWEEN 0 AND 90),
    rating           integer NOT NULL CHECK (rating BETWEEN 0 AND 100),
    description      text    NOT NULL
);

-- Связь «многие ко многим»: у игры много тегов, у тега много игр
CREATE TABLE game_tags (
    game_id integer NOT NULL REFERENCES games (id) ON DELETE CASCADE,
    tag_id  integer NOT NULL REFERENCES tags (id),
    PRIMARY KEY (game_id, tag_id)
);
