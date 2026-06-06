'use strict';
const express = require('express');
const router  = express.Router();
const auth    = require('../middleware/authMiddleware');
const C       = require('../controllers/bankingController');

// Core
router.get('/balance',             auth, C.getBalance);
router.get('/transactions',        auth, C.getTransactions);
router.post('/transfer',           auth, C.transferFunds);

// Pillar 5: Fraud Detection
router.get('/fraud/alerts',        auth, C.getFraudAlerts);
router.patch('/fraud/:id/resolve', auth, C.resolveFraud);

// Pillar 3: Predictive Cash Flow
router.get('/predict/cashflow',    auth, C.getCashFlowPrediction);

// Pillar 8: Budgets
router.get('/budgets',             auth, C.getBudgets);
router.post('/budgets',            auth, C.upsertBudget);

// Pillar 8: Savings Goals
router.get('/goals',               auth, C.getSavingsGoals);
router.post('/goals',              auth, C.addSavingsGoal);
router.patch('/goals/:id',         auth, C.updateGoalProgress);

// Pillar 6: Autonomous Insights
router.get('/insights',            auth, C.getInsights);

module.exports = router;
