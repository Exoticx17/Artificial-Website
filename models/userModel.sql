CREATE TABLE users (
    id SERIAL PRIMARY KEY,              -- Unique identifier for each user
    email VARCHAR(255) UNIQUE,          -- User's email address (optional, but highly recommended)
    password VARCHAR(255),              -- User's hashed password (only used for non-OAuth users)
    nickname VARCHAR(255),              -- User's nickname or display name
    google_id VARCHAR(255) UNIQUE,      -- Unique Google ID for OAuth users
    facebook_id VARCHAR(255) UNIQUE,    -- Unique Facebook ID for OAuth users
    apple_id VARCHAR(255) UNIQUE,       -- Unique Apple ID for OAuth users
    liked INTEGER DEFAULT 0,            -- Number of times liked for a post (default is 0)
    admin BOOLEAN DEFAULT FALSE,        -- Flag indicating if the user is an admin
    onboarded BOOLEAN DEFAULT FALSE,
    profile_picture VARCHAR(255) DEFAULT NULL, -- URL or path to the user's profile picture
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Timestamp of user creation
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP-- Timestamp of the last update
);