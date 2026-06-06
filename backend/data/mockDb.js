'use strict';
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const users = [
  {
    id: 'user_001', name: 'Ramesh Sharma', email: 'ramesh@silverlink.com',
    password: bcrypt.hashSync('password123', 10), phone: '9876543210',
    accountNumber: '****4821', ifscCode: 'SBI0001234', bank: 'State Bank of India',
    balance: 124890.50, preferredLanguage: 'hi', createdAt: new Date('2023-01-15'),
  },
  {
    id: 'user_002', name: 'Sunita Devi', email: 'sunita@silverlink.com',
    password: bcrypt.hashSync('password123', 10), phone: '9812345678',
    accountNumber: '****7234', ifscCode: 'HDFC0005678', bank: 'HDFC Bank',
    balance: 87450.00, preferredLanguage: 'en', createdAt: new Date('2023-03-10'),
  },
  {
    id: 'user_003', name: 'Arjun Pillai', email: 'arjun@silverlink.com',
    password: bcrypt.hashSync('password123', 10), phone: '9845001234',
    accountNumber: '****3311', ifscCode: 'AXIS0009012', bank: 'Axis Bank',
    balance: 52300.00, preferredLanguage: 'ta', createdAt: new Date('2023-06-01'),
  },
];

const transactions = {
  user_001: [
    { id: uuidv4(), type:'debit',  amount:1280,  description:'Big Bazaar — Grocery',    category:'Shopping',     date:'2026-04-03', method:'UPI',         riskScore:5  },
    { id: uuidv4(), type:'credit', amount:18500, description:'Pension Credit — EPFO',   category:'Income',       date:'2026-04-01', method:'NEFT',        riskScore:2  },
    { id: uuidv4(), type:'debit',  amount:640,   description:'Apollo Pharmacy',          category:'Health',       date:'2026-03-31', method:'Debit Card',  riskScore:4  },
    { id: uuidv4(), type:'debit',  amount:2500,  description:'Mahesh Stores',            category:'Shopping',     date:'2026-03-28', method:'UPI',         riskScore:6  },
    { id: uuidv4(), type:'credit', amount:5000,  description:'Son Transfer — Anil',     category:'Transfer',     date:'2026-03-25', method:'IMPS',        riskScore:3  },
    { id: uuidv4(), type:'debit',  amount:1200,  description:'Electricity Bill — UPPCL', category:'Bills',       date:'2026-03-20', method:'Net Banking', riskScore:2  },
    { id: uuidv4(), type:'debit',  amount:800,   description:'Jio Recharge',             category:'Mobile',      date:'2026-03-18', method:'UPI',         riskScore:3  },
    { id: uuidv4(), type:'debit',  amount:15000, description:'Unknown Merchant XYZ999', category:'Shopping',     date:'2026-03-16', method:'Card',        riskScore:87 },
    { id: uuidv4(), type:'credit', amount:18500, description:'Pension Credit — EPFO',   category:'Income',       date:'2026-03-01', method:'NEFT',        riskScore:1  },
    { id: uuidv4(), type:'debit',  amount:350,   description:'Bus Pass Renewal',         category:'Transport',   date:'2026-02-28', method:'UPI',         riskScore:2  },
    { id: uuidv4(), type:'debit',  amount:4200,  description:'Water & Electricity Bill', category:'Bills',       date:'2026-02-20', method:'Net Banking', riskScore:2  },
    { id: uuidv4(), type:'debit',  amount:900,   description:'Grocery — Reliance Fresh', category:'Food',        date:'2026-02-15', method:'UPI',         riskScore:3  },
  ],
  user_002: [
    { id: uuidv4(), type:'credit', amount:55000, description:'Salary Credit',          category:'Income',        date:'2026-04-01', method:'NEFT',        riskScore:1  },
    { id: uuidv4(), type:'debit',  amount:15000, description:'House Rent',              category:'Housing',      date:'2026-04-01', method:'NEFT',        riskScore:2  },
    { id: uuidv4(), type:'debit',  amount:450,   description:'Swiggy Food Order',       category:'Food',         date:'2026-03-30', method:'UPI',         riskScore:4  },
    { id: uuidv4(), type:'debit',  amount:990,   description:'Netflix Subscription',    category:'Entertainment',date:'2026-03-28', method:'Card',        riskScore:3  },
    { id: uuidv4(), type:'debit',  amount:3200,  description:'Amazon Purchase',         category:'Shopping',     date:'2026-03-22', method:'Card',        riskScore:5  },
  ],
  user_003: [
    { id: uuidv4(), type:'credit', amount:42000, description:'Salary Credit',           category:'Income',       date:'2026-04-01', method:'NEFT',        riskScore:1  },
    { id: uuidv4(), type:'debit',  amount:8000,  description:'House Rent',              category:'Housing',      date:'2026-04-01', method:'NEFT',        riskScore:2  },
    { id: uuidv4(), type:'debit',  amount:1200,  description:'Grocery Store',           category:'Shopping',     date:'2026-03-29', method:'UPI',         riskScore:3  },
  ],
};

// Budget goals per user (Pillar 8: Smart Budgeting)
const budgets = {
  user_001: [
    { id:uuidv4(), category:'Shopping',     limit:4000,  spent:3780,  period:'monthly' },
    { id:uuidv4(), category:'Bills',        limit:3000,  spent:1200,  period:'monthly' },
    { id:uuidv4(), category:'Health',       limit:2000,  spent:640,   period:'monthly' },
    { id:uuidv4(), category:'Mobile',       limit:1000,  spent:800,   period:'monthly' },
    { id:uuidv4(), category:'Food',         limit:2500,  spent:900,   period:'monthly' },
    { id:uuidv4(), category:'Transport',    limit:500,   spent:350,   period:'monthly' },
  ],
  user_002: [
    { id:uuidv4(), category:'Food',         limit:3000,  spent:450,   period:'monthly' },
    { id:uuidv4(), category:'Shopping',     limit:5000,  spent:3200,  period:'monthly' },
    { id:uuidv4(), category:'Entertainment',limit:1500,  spent:990,   period:'monthly' },
    { id:uuidv4(), category:'Housing',      limit:16000, spent:15000, period:'monthly' },
  ],
  user_003: [
    { id:uuidv4(), category:'Shopping',     limit:3000,  spent:1200,  period:'monthly' },
    { id:uuidv4(), category:'Housing',      limit:9000,  spent:8000,  period:'monthly' },
  ],
};

// Savings goals (Pillar 8: Smart Budgeting)
const savingsGoals = {
  user_001: [
    { id:uuidv4(), name:'Emergency Fund',  target:50000,  saved:32000, deadline:'2026-12-31', emoji:'🏦' },
    { id:uuidv4(), name:'Grandchild Gift', target:10000,  saved:6500,  deadline:'2026-10-01', emoji:'🎁' },
    { id:uuidv4(), name:'Pilgrimage Trip', target:25000,  saved:8000,  deadline:'2027-01-15', emoji:'🙏' },
  ],
  user_002: [
    { id:uuidv4(), name:'Emergency Fund',  target:100000, saved:45000, deadline:'2027-03-31', emoji:'🏦' },
    { id:uuidv4(), name:'New Laptop',      target:60000,  saved:28000, deadline:'2026-08-01', emoji:'💻' },
  ],
  user_003: [
    { id:uuidv4(), name:'Emergency Fund',  target:60000,  saved:15000, deadline:'2027-06-30', emoji:'🏦' },
  ],
};

// Predictive cash-flow (Pillar 3: Predictive Finance Intelligence)
const cashFlowPredictions = {
  user_001: {
    nextMonthIncome:   18500,
    nextMonthExpenses: 7800,
    nextMonthSavings:  10700,
    riskLevel:        'low',
    lowBalanceAlert:   false,
    forecast: [
      { month:'May 2026',   income:18500, expenses:7800,  savings:10700 },
      { month:'Jun 2026',   income:18500, expenses:8100,  savings:10400 },
      { month:'Jul 2026',   income:18500, expenses:7600,  savings:10900 },
    ],
    insight: 'Your pension arrives reliably every 1st. Expenses peak in months with electricity bill cycles.',
  },
  user_002: {
    nextMonthIncome:   55000,
    nextMonthExpenses: 32000,
    nextMonthSavings:  23000,
    riskLevel:        'medium',
    lowBalanceAlert:   false,
    forecast: [
      { month:'May 2026',   income:55000, expenses:32000, savings:23000 },
      { month:'Jun 2026',   income:55000, expenses:29500, savings:25500 },
      { month:'Jul 2026',   income:55000, expenses:31000, savings:24000 },
    ],
    insight: 'Consistent salary. Entertainment spending trending +12% month-over-month.',
  },
  user_003: {
    nextMonthIncome:   42000,
    nextMonthExpenses: 22000,
    nextMonthSavings:  20000,
    riskLevel:        'low',
    lowBalanceAlert:   false,
    forecast: [
      { month:'May 2026',   income:42000, expenses:22000, savings:20000 },
      { month:'Jun 2026',   income:42000, expenses:21000, savings:21000 },
      { month:'Jul 2026',   income:42000, expenses:23000, savings:19000 },
    ],
    insight: 'Steady income. Housing and grocery are your two largest expense buckets.',
  },
};

// Fraud events (Pillar 5: Real-Time AI Fraud Detection)
const fraudEvents = {
  user_001: [
    {
      id: uuidv4(), type:'HIGH_RISK_TRANSACTION', severity:'high',
      description:'₹15,000 debit to unknown merchant "XYZ999" flagged',
      timestamp:'2026-03-16T14:32:00Z', resolved:false,
      riskScore:87, model:'IsolationForest+XGBoost',
      recommendation:'Block card and verify with bank immediately.',
    },
  ],
  user_002: [],
  user_003: [],
};

// Autonomous insights (Pillar 6: Autonomous Financial Insights)
const autonomousInsights = {
  user_001: [
    { id:uuidv4(), type:'saving',   title:'Switch electricity bill to auto-pay',   body:'Save ₹120/month by enabling auto-pay. Your bill arrives every 20th consistently.',   action:'Set up', priority:'high'   },
    { id:uuidv4(), type:'alert',    title:'Shopping budget 94% used',               body:'You have only ₹220 left in your shopping budget for this month.',                     action:'Review', priority:'urgent'  },
    { id:uuidv4(), type:'goal',     title:'Emergency fund on track',                body:'At current pace you will reach your ₹50,000 goal 3 months ahead of schedule.',        action:'View',   priority:'positive'},
    { id:uuidv4(), type:'fraud',    title:'Unusual transaction detected',           body:'₹15,000 to unknown merchant on 16 Mar. Risk score: 87/100.',                          action:'Resolve',priority:'urgent'  },
  ],
  user_002: [
    { id:uuidv4(), type:'saving',   title:'Reduce food delivery spend',             body:'Swiggy/Zomato orders cost ₹3,200 last month — 40% above city average for your bracket.', action:'Review', priority:'medium' },
    { id:uuidv4(), type:'goal',     title:'New Laptop goal at 47%',                 body:'You need ₹2,700/month to reach your laptop fund goal on time.',                       action:'View',   priority:'medium'  },
  ],
  user_003: [
    { id:uuidv4(), type:'saving',   title:'Housing cost is 19% of income',          body:'Ideal ratio is under 30%. You have healthy headroom.',                                action:null,    priority:'positive' },
  ],
};

const chatSessions = {};

module.exports = { users, transactions, budgets, savingsGoals, cashFlowPredictions, fraudEvents, autonomousInsights, chatSessions };
