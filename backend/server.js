'use strict';
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

// ── CORS ────────────────────────────────────────────────────────────────────
// FIX 1: Allow both CRA dev server origins (3000 and 3001 fallback)
app.use(cors({
  origin: [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3001',
  'https://silverlink-x-1.onrender.com'
],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Request logger ───────────────────────────────────────────────────────────
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ── FIX 2: Routes ARE correctly mounted — confirmed present ─────────────────
// /api/auth/login  → authRoutes → authController.login   ✓
// /api/auth/signup → authRoutes → authController.signup  ✓
app.use('/api/auth',    require('./routes/authRoutes'));
app.use('/api/banking', require('./routes/bankingRoutes'));
app.use('/api/chat',    require('./routes/chatRoutes'));

// ── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) =>
  res.json({
    status: 'ok',
    service: 'SilverLink API v2',
    timestamp: new Date().toISOString(),
    endpoints: {
      login:        'POST /api/auth/login',
      signup:       'POST /api/auth/signup',
      profile:      'GET  /api/auth/profile',
      balance:      'GET  /api/banking/balance',
      transactions: 'GET  /api/banking/transactions',
      transfer:     'POST /api/banking/transfer',
      chat:         'POST /api/chat',
    },
  })
);

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((_req, res) =>
  res.status(404).json({ success: false, message: 'Route not found.' })
);

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, message: 'Internal server error.' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  🚀  SilverLink API v2  →  http://localhost:${PORT}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\n  Demo accounts (password: password123)');
  console.log('  ┌─────────────────────────────────┬──────────┐');
  console.log('  │ ramesh@silverlink.com           │ Hindi    │');
  console.log('  │ sunita@silverlink.com           │ English  │');
  console.log('  │ arjun@silverlink.com            │ Tamil    │');
  console.log('  └─────────────────────────────────┴──────────┘\n');
});

module.exports = app;
