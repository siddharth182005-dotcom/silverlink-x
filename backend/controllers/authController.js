'use strict';
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { users } = require('../data/mockDb');

// ── FIX 3: JWT_SECRET fallback so server never crashes if .env is absent ─────
const JWT_SECRET  = process.env.JWT_SECRET  || 'silverlink_dev_secret_fallback_2024';
const JWT_EXPIRES = process.env.JWT_EXPIRES_IN || '7d';

const signToken = (user) =>
  jwt.sign(
    { id: user.id, email: user.email, name: user.name },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES }
  );

// ── Helper: safe user shape (never expose hashed password) ───────────────────
const safeUser = (u) => ({
  id:                u.id,
  name:              u.name,
  email:             u.email,
  phone:             u.phone,
  accountNumber:     u.accountNumber,
  ifscCode:          u.ifscCode,
  bank:              u.bank,
  preferredLanguage: u.preferredLanguage,
});

// ── POST /api/auth/signup ─────────────────────────────────────────────────────
const signup = async (req, res) => {
  try {
    const { name, email, password, phone, preferredLanguage } = req.body;

    // Validation
    if (!name || !email || !password)
      return res.status(400).json({ success: false, message: 'Name, email and password are required.' });
    if (password.length < 6)
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
    if (users.find(u => u.email === email.toLowerCase().trim()))
      return res.status(409).json({ success: false, message: 'Email already registered. Please sign in.' });

    const hashed = await bcrypt.hash(password, 12);
    const user = {
      id:                uuidv4(),
      name:              name.trim(),
      email:             email.toLowerCase().trim(),
      password:          hashed,
      phone:             phone?.trim() || '',
      accountNumber:     `****${Math.floor(1000 + Math.random() * 9000)}`,
      ifscCode:          'SBL0000001',
      bank:              'SilverLink Bank',
      balance:           10000.00,
      preferredLanguage: preferredLanguage || 'en',
      createdAt:         new Date(),
    };
    users.push(user);

    // Seed empty transaction list for new user
    const { transactions } = require('../data/mockDb');
    transactions[user.id] = [];

    const token = signToken(user);
    return res.status(201).json({
      success: true,
      message: `Welcome to SilverLink, ${user.name}!`,
      token,
      user: safeUser(user),
    });
  } catch (err) {
    console.error('Signup error:', err);
    return res.status(500).json({ success: false, message: 'Server error during signup.' });
  }
};

// ── POST /api/auth/login ──────────────────────────────────────────────────────
// FIX 4: This route DID exist but the frontend was receiving network errors
// because of CORS preflight failures. Route logic itself is correct.
// Added clearer error messages and a hardened credential check.
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ success: false, message: 'Email and password are required.' });

    const user = users.find(u => u.email === email.toLowerCase().trim());
    if (!user)
      return res.status(401).json({ success: false, message: 'No account found with this email.' });

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch)
      return res.status(401).json({ success: false, message: 'Incorrect password. Please try again.' });

    const token = signToken(user);
    return res.json({
      success: true,
      message: `Welcome back, ${user.name}!`,
      token,
      user: safeUser(user),
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ success: false, message: 'Server error during login.' });
  }
};

// ── GET /api/auth/profile ─────────────────────────────────────────────────────
const getProfile = (req, res) => {
  const user = users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
  return res.json({ success: true, user: safeUser(user) });
};

module.exports = { signup, login, getProfile };
