const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const supabase = require('./supabaseClient');

const router = express.Router();

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

module.exports = router;
