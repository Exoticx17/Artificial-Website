const { ObjectId } = require('mongodb');
const pool = require('../db');
const axios = require('axios');

const videoGamePost = async (req, res) => {
    const { title, platforms, genre, difficulty, game_series, publisher, rating, release_date, playtime } = req.body;

    try {
        const result = await pool.query(
            "INSERT INTO videoGames (title, platforms, genre, difficulty, game_series, publisher, rating, release_date, playtime) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *",
            [title, platforms, genre, difficulty, game_series, publisher, rating, release_date, playtime]
        );

        res.json(result.rows[0]);
    } catch (err) {
        console.error("Error in videoGamePost:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
};


const videoGameGetAll = async (req,res) => {
    try {
        const result = await pool.query("SELECT * FROM videoGames");
        res.json(result.rows);
    } catch (err) {
        console.error('Error in videoGame:', err);
        res.status(500).json({ message: 'Server error', error: err });
    }
}

const videoGameGetOne = async (req,res) => {
    const { id } = req.query;
    try {
        const result = await pool.query("SELECT * FROM videoGames WHERE id = $1", [id]);
        if (result.rows.length === 0) {
            return res.json({ message: "Video Game not found" });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error in videoGame:', err);
        res.status(500).json({ message: 'Server error', error: err });
    }
}

const videoGameSearch = async (req, res) => {
    const { searchTerm } = req.query;

    if (!searchTerm) {
        return res.status(400).json({ error: "Search term is required" });
    }

    try {
        const result = await pool.query(
            "SELECT * FROM videoGames WHERE title ILIKE $1",
            [`%${searchTerm}%`] // Adds wildcards for partial matching
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "No Video Games found" });
        }

        res.json(result.rows);
    } catch (err) {
        console.error("Error in videoGameSearch:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

const videoGameEdit = async (req, res) => {
    const { id } = req.params;
    const { title, platforms, genre, difficulty, game_series, publisher, rating, release_date, playtime } = req.body;
    
    try {
        const result = await pool.query(
            "UPDATE videoGames SET title = $1, platforms = $2, genre = $3, difficulty = $4, game_series = $5, publisher = $6, rating = $7, release_date = $8, playtime = $9 WHERE id = $10 RETURNING *",
            [title, platforms, genre, difficulty, game_series, publisher, rating, release_date, playtime, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Video Game not found" });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error("Error in videoGameEdit:", err);
        res.status(500).json({ message: "Server error", error: err });
    }
};


const videoGameDelete = async (req,res) => {
    const { id } = req.params;
    try {
        const result = await pool.query("DELETE FROM videoGames WHERE id = $1 RETURNING *", [id]);
        if (result.rows.length === 0) return res.status(404).json({ error: "Website not found" });
        res.json({ message: "Video game deleted" });
    } catch (err) {
        console.error('Error in videoGame:', err);
        res.status(500).json({ message: 'Server error', error: err });
    }
}

const videoGameRecommend = async (req, res) => {
    const { platforms, genres, publishers, rating, playtime } = req.body;

    // Log the values to the console for debugging
    console.log("Platforms:", platforms);
    console.log("Genres:", genres);
    console.log("Publishers:", publishers);
    console.log("Rating:", rating);
    console.log("Playtime:", playtime);

    try {
        // Make a request to the Python backend (app.py)
        const pythonResponse = await axios.post('http://localhost:5000/recommend', {
            platforms,
            genres,
            publishers,
            rating,
            playtime
        });

        if (pythonResponse.data.length === 0) {
            return res.status(404).json({ message: "No similar games found" });
        }

        // Return the similar games received from Python backend
        res.json(pythonResponse.data);
    } catch (err) {
        console.error("Error in videoGameRecommend:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
};


module.exports = {
    videoGamePost,
    videoGameGetAll,
    videoGameGetOne,
    videoGameSearch,
    videoGameEdit,
    videoGameDelete,
    videoGameRecommend
}