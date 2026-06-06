'use strict';
const { v4: uuidv4 } = require('uuid');
const db = require('../data/mockDb');

// ── helpers ──────────────────────────────────────────────────────────────────
const fmt = (n) => parseFloat(n).toLocaleString('en-IN', { minimumFractionDigits: 2 });

// ── Balance ───────────────────────────────────────────────────────────────────
const getBalance = (req, res) => {
  const user = db.users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
  return res.json({ success: true, data: { balance: user.balance, accountNumber: user.accountNumber, bank: user.bank, ifscCode: user.ifscCode, currency: 'INR', lastUpdated: new Date().toISOString() } });
};

// ── Transactions ──────────────────────────────────────────────────────────────
const getTransactions = (req, res) => {
  const { limit = 5, type } = req.query;
  let txns = db.transactions[req.user.id] || [];
  if (type && ['credit','debit'].includes(type)) txns = txns.filter(t => t.type === type);
  return res.json({ success: true, data: { transactions: txns.slice(0, parseInt(limit)), total: txns.length } });
};

// ── Transfer ──────────────────────────────────────────────────────────────────
const transferFunds = (req, res) => {
  const { toAccount, amount, note } = req.body;
  if (!toAccount || !amount) return res.status(400).json({ success: false, message: 'Recipient and amount required.' });
  const parsed = parseFloat(amount);
  if (isNaN(parsed) || parsed <= 0) return res.status(400).json({ success: false, message: 'Invalid amount.' });
  const sender = db.users.find(u => u.id === req.user.id);
  if (!sender) return res.status(404).json({ success: false, message: 'User not found.' });
  if (sender.balance < parsed) return res.status(400).json({ success: false, message: 'Insufficient balance.' });
  sender.balance = parseFloat((sender.balance - parsed).toFixed(2));
  const txn = { id: uuidv4(), type: 'debit', amount: parsed, description: note || `Transfer to ${toAccount}`, category: 'Transfer', date: new Date().toISOString().split('T')[0], method: 'IMPS', riskScore: 5 };
  if (!db.transactions[req.user.id]) db.transactions[req.user.id] = [];
  db.transactions[req.user.id].unshift(txn);
  return res.json({ success: true, message: `₹${fmt(parsed)} transferred to ${toAccount} successfully.`, data: { transactionId: txn.id, newBalance: sender.balance, amount: parsed, recipient: toAccount } });
};

// ── PILLAR 5: Fraud Detection ────────────────────────────────────────────────
const getFraudAlerts = (req, res) => {
  const alerts = db.fraudEvents[req.user.id] || [];
  const txns   = db.transactions[req.user.id] || [];
  const highRisk = txns.filter(t => (t.riskScore || 0) >= 60);
  return res.json({ success: true, data: { alerts, highRiskTransactions: highRisk, score: alerts.filter(a => !a.resolved).length === 0 ? 94 : 61 } });
};

const resolveFraud = (req, res) => {
  const { id } = req.params;
  const events = db.fraudEvents[req.user.id] || [];
  const event  = events.find(e => e.id === id);
  if (!event) return res.status(404).json({ success: false, message: 'Alert not found.' });
  event.resolved = true;
  return res.json({ success: true, message: 'Alert resolved.', data: event });
};

// ── PILLAR 3: Predictive Cash Flow ───────────────────────────────────────────
const getCashFlowPrediction = (req, res) => {
  const prediction = db.cashFlowPredictions[req.user.id];
  if (!prediction) return res.status(404).json({ success: false, message: 'No prediction data.' });
  return res.json({ success: true, data: prediction });
};

// ── PILLAR 8: Budgets ────────────────────────────────────────────────────────
const getBudgets = (req, res) => {
  const budgets = db.budgets[req.user.id] || [];
  return res.json({ success: true, data: { budgets } });
};

const upsertBudget = (req, res) => {
  const { category, limit: budgetLimit } = req.body;
  if (!category || !budgetLimit) return res.status(400).json({ success: false, message: 'Category and limit required.' });
  if (!db.budgets[req.user.id]) db.budgets[req.user.id] = [];
  const existing = db.budgets[req.user.id].find(b => b.category === category);
  if (existing) {
    existing.limit = parseFloat(budgetLimit);
  } else {
    db.budgets[req.user.id].push({ id: uuidv4(), category, limit: parseFloat(budgetLimit), spent: 0, period: 'monthly' });
  }
  return res.json({ success: true, message: `Budget for ${category} updated.`, data: db.budgets[req.user.id] });
};

// ── PILLAR 8: Savings Goals ──────────────────────────────────────────────────
const getSavingsGoals = (req, res) => {
  const goals = db.savingsGoals[req.user.id] || [];
  return res.json({ success: true, data: { goals } });
};

const addSavingsGoal = (req, res) => {
  const { name, target, deadline, emoji } = req.body;
  if (!name || !target) return res.status(400).json({ success: false, message: 'Name and target required.' });
  if (!db.savingsGoals[req.user.id]) db.savingsGoals[req.user.id] = [];
  const goal = { id: uuidv4(), name, target: parseFloat(target), saved: 0, deadline: deadline || '', emoji: emoji || '🎯' };
  db.savingsGoals[req.user.id].push(goal);
  return res.json({ success: true, message: 'Goal created!', data: goal });
};

const updateGoalProgress = (req, res) => {
  const { id } = req.params;
  const { amount } = req.body;
  const goals = db.savingsGoals[req.user.id] || [];
  const goal  = goals.find(g => g.id === id);
  if (!goal) return res.status(404).json({ success: false, message: 'Goal not found.' });
  goal.saved  = Math.min(goal.target, parseFloat((goal.saved + parseFloat(amount)).toFixed(2)));
  return res.json({ success: true, data: goal });
};

// ── PILLAR 6: Autonomous Insights ───────────────────────────────────────────
const getInsights = (req, res) => {
  const insights = db.autonomousInsights[req.user.id] || [];
  return res.json({ success: true, data: { insights } });
};

module.exports = {
  getBalance, getTransactions, transferFunds,
  getFraudAlerts, resolveFraud,
  getCashFlowPrediction,
  getBudgets, upsertBudget,
  getSavingsGoals, addSavingsGoal, updateGoalProgress,
  getInsights,
};
