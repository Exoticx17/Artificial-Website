const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const axios = require('axios');
require('dotenv').config();
const pool = require('../db'); // Adjust the path as per your project structure

// Function to generate JWT
const generateJWT = (userId) => {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '3h' });
};

// Controller for user registration (signup)
const userSignup = async (req, res) => {
    const { email, password, nickname } = req.body;

    try {
        // Check if user already exists
        const userExists = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

        if (userExists.rows.length > 0) {
            return res.status(400).json({ msg: 'User already exists' });
        }

        // Hash password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Insert new user into database
        const newUser = await pool.query(
            'INSERT INTO users (email, password, nickname) VALUES ($1, $2, $3) RETURNING id, email, nickname, admin, liked, created_at, updated_at',
            [email, hashedPassword, nickname]
        );

        // Extract user data
        const user = newUser.rows[0];

        // Generate a JWT token with a valid user ID
        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '3h' });

        // Set the token in a cookie
        res.cookie('token', token, {
            secure: process.env.NODE_ENV === 'production', // Use only over HTTPS in production
            sameSite: 'Strict', // Prevent CSRF attacks
            maxAge: 24 * 60 * 60 * 1000 // Cookie expiration (1 day)
        });

        // Send response with token and user data
        return res.json({ token, user });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Controller for user login
const userLogin = async (req, res) => {
    const { email, password } = req.body;

    try {
        // Check if user exists
        const user = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

        if (user.rows.length === 0) {
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }

        // Verify password
        const isMatch = await bcrypt.compare(password, user.rows[0].password);

        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }

        // Generate JWT
        const token = generateJWT(user.rows[0].id);  // Only pass the user ID

        // Create Cookie
        res.cookie('token', token, {
            httpOnly: true, // Prevents JavaScript access to cookies
            secure: process.env.NODE_ENV === 'production', // Use only over HTTPS in production
            maxAge: 24 * 60 * 60 * 1000 // Cookie expiration
        });

        // Respond with token and user data
        res.json({ user: user.rows[0] });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Controller to get all users
const getAllUsers = async (req, res) => {
    try {
        const allUsers = await pool.query('SELECT * FROM users');
        res.json(allUsers.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Controller to get a user by id
const getUserById = async (req, res) => {
    const id = req.params.id;

    try {
        const user = await pool.query('SELECT * FROM users WHERE id = $1', [id]);

        if (user.rows.length === 0) {
            return res.status(404).json({ msg: 'User not found' });
        }

        res.json(user.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Controller to search users by nickname
const searchUsers = async (req, res) => {
    const { nickname } = req.params;

    try {
        const users = await pool.query('SELECT * FROM users WHERE nickname ILIKE $1', [`%${nickname}%`]);
        res.json(users.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

const updateLikes = async (req, res) => {
    try {
        const { id } = req.params; // The ID of the news post
        const { type } = req.query; // The operation type: 'increase' or 'decrease'

        // Validate the type query parameter
        if (!['increase', 'decrease'].includes(type)) {
            return res.status(400).json({ message: "Invalid type. Must be 'increase' or 'decrease'." });
        }

        // SQL query to update the likes
        const updateQuery = `
            UPDATE users
            SET liked = liked ${type === 'increase' ? '+' : '-'} 1
            WHERE id = $1
            RETURNING *;
        `;

        // Execute the query
        const result = await pool.query(updateQuery, [id]);

        // Check if the news post exists
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(result.rows[0]); // Return the updated post
    } catch (err) {
        console.error('Error in updateLikes:', err);
        res.status(500).json({ message: 'Server error', error: err });
    }
};

// API to verify a user's password
const verifyPassword = async (req, res) => {
    const { password } = req.query;
    const { id } = req.params;

    try {
        const query = 'SELECT password FROM users WHERE id = $1';
        const result = await pool.query(query, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ msg: 'User not found' });
        }

        const hashedPassword = result.rows[0].password;
        const isMatch = await bcrypt.compare(password, hashedPassword);

        if (isMatch) {
            return res.json(true);
        } else {
            return res.status(401).json(false);
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Controller to update a user by id
const updateUser = async (req, res) => {
    const { id } = req.params;
    const { email, password, nickname, onboarded,  } = req.body;

    try {
        // Hash password if provided
        let hashedPassword;
        if (password) {
            const saltRounds = 10;
            hashedPassword = await bcrypt.hash(password, saltRounds);
        }

        const updateUserQuery = `
            UPDATE users
            SET email = COALESCE($2, email),
                password = COALESCE($3, password),
                nickname = COALESCE($4, nickname),
                onboarded = $5,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
            RETURNING id, email, nickname, admin, created_at, updated_at
        `;

        const updatedUser = await pool.query(updateUserQuery, [id, email, hashedPassword, nickname, onboarded]);

        if (updatedUser.rows.length === 0) {
            return res.status(404).json({ msg: 'User not found' });
        }

        res.json(updatedUser.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};


// Controller to delete a user by id
const deleteUser = async (req, res) => {
    const id = req.params.id;

    try {
        const deleteUserQuery = 'DELETE FROM users WHERE id = $1 RETURNING *';
        const deletedUser = await pool.query(deleteUserQuery, [id]);

        if (deletedUser.rows.length === 0) {
            return res.status(404).json({ msg: 'User not found' });
        }

        res.json({ msg: 'User deleted', user: deletedUser.rows[0] });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

module.exports = {
    userSignup,
    userLogin,
    getAllUsers,
    getUserById,
    searchUsers,
    verifyPassword,
    updateUser,
    updateLikes,
    deleteUser
};