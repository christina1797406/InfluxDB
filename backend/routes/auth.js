const express = require('express');
const router = express.Router()
const pool = require('../utils/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken')
const { v4: uuidv4 } = require('uuid');


// SIGNUP
router.post('/signup', async (req, res) => {
    const {email, password} = req.body;

    try {
        // Check if user exists
        const existingUser = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (existingUser.rows.length > 0) {
            return res.status(400).json({msg: 'User already exists'})
        }

        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Insert new user into db
        const userId = uuidv4();
        const newUser = await pool.query(
            'INSERT INTO users (id, email, password) VALUES ($1, $2, $3) RETURNING *', [userId, email, hashedPassword]
        );

        res.status(201).json({msg: 'New user created', user: newUser.rows[0]});
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
})


// LOGIN
router.post('/login', async (req, res) => {
    const {email, password} = req.body;

    try {
        // Find the user
        const user = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (user.rows.length === 0) {
            return res.status(400).json({msg: 'Invalid credentials'});
        }

        // Check password
        const validPassword = await bcrypt.compare(password, user.rows[0].password);
        if (!validPassword) {
            return res.status(400).json({msg: 'Invalid credentials'});
        }

        // Generate JWT token
        const token = jwt.sign({id: user.rows[0].id}, process.env.JWT_SECRET, {expiresIn: '1h'});

        res.json({msg: 'Login successful', token});
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;