CREATE TABLE videoGames (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) UNIQUE, 
    platforms TEXT[], -- Array of platforms (e.g., PC, Xbox, PlayStation)
    genre TEXT[],
    difficulty VARCHAR(50),
    game_series VARCHAR(50),
    publisher VARCHAR(50),
    rating VARCHAR(50),
    release_date DATE(),
    playtime NUMERIC,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Timestamp of record creation
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP 
); 