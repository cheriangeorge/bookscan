const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const supabase = require('./supabaseClient');

const router = express.Router();

// Register a new user
router.post('/register', async (req, res) => {
    const { username, email, password } = req.body;
    const password_hash = await bcrypt.hash(password, 10);

    const { data, error } = await supabase
        .from('users')
        .insert([{ username, email, password_hash }])
        .select();

    if (error) {
        return res.status(500).json({ error: error.message });
    }

    const token = jwt.sign({ user_id: data[0].user_id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.status(201).json({ token });
});

// Add a book to a user's inventory
router.post('/books', async (req, res) => {
    const { isbn, title, author, user_id } = req.body;

    const { data, error } = await supabase
        .from('books')
        .insert([{ isbn, title, author }])
        .select();

    if (error) {
        return res.status(500).json({ error: error.message });
    }

    const { data: userBookData, error: userBookError } = await supabase
        .from('user_book_relationship')
        .insert([{ user_id, book_id: data[0].book_id, status: 'Owned' }])
        .select();

    if (userBookError) {
        return res.status(500).json({ error: userBookError.message });
    }

    res.status(201).json(userBookData);
});

// Fetch books for a user
router.get('/books/:user_id', async (req, res) => {
    const { user_id } = req.params;

    const { data, error } = await supabase
        .from('user_book_relationship')
        .select('book_id, books(isbn, title, author)')
        .eq('user_id', user_id);

    if (error) {
        return res.status(500).json({ error: error.message });
    }

    res.status(200).json(data);
});

module.exports = router;
