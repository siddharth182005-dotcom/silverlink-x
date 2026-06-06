'use strict';
const db = require('../data/mockDb');
const { detectEmotion } = require('../utils/emotionUtils');
const { detectLanguage } = require('../utils/languageUtils');
const { getTemplate }    = require('../utils/translationService');

// ─── Intent Detection ─────────────────────────────────────────────────────────
const INTENTS = [
  { name:'greeting',      patterns:[/\b(hello|hi|hey|namaste|namaskar|vanakkam|nm|greet|good morning|good evening|shubh|hola)\b/i, /^(हाय|नमस्ते|नमस्कार|வணக்கம்|నమస్కారం|নমস্কার)$/] },
  { name:'balance',       patterns:[/\b(balance|bakiya|kitna paisa|how much|funds|amount|money|paise|paisa|remaining|left|account mein|dhana|bakki|shillak)\b/i, /बैलेंस|बकिया|இருப்பு|బ్యాలెన్స్|ব্যালেন্স|शिल्लक/] },
  { name:'transactions',  patterns:[/\b(transaction|history|statement|recent|last|spent|payment|entry|entries|list|kharcha|kharch|vivaran|vyavhar|lenden)\b/i, /लेनदेन|பரிவர்த்தனை|లావాదేవీ|লেনদেন|व्यवहार/] },
  { name:'transfer',      patterns:[/\b(transfer|send|bhejo|bhejna|pay|payment|upi|neft|imps|wire|remit|anuppu|pathu|pathao)\b/i, /ट्रांसफर|பரிமாற்றம்|బదిలీ|স্থানান্তর|हस्तांतरण/] },
  { name:'fraud',         patterns:[/\b(fraud|scam|stolen|hack|unauthorized|suspicious|theft|chori|galat|dhoka|mosaadi|security alert)\b/i, /धोखा|चोरी|மோசடி|దొంగతనం|চুরি|फसवणूक/] },
  { name:'predict',       patterns:[/\b(predict|forecast|next month|future|cashflow|cash flow|estimate|projection|90.?day)\b/i] },
  { name:'budget',        patterns:[/\b(budget|budgets|spending limit|limit|overspend|over budget|baj[e]t)\b/i] },
  { name:'goals',         patterns:[/\b(goal|goals|savings goal|saving|target|emergency fund|invest)\b/i] },
  { name:'insights',      patterns:[/\b(insight|insights|recommend|advice|tip|smart|analyze|analyse)\b/i] },
  { name:'help',          patterns:[/\b(help|madad|support|agent|human|operator|problem|issue|complaint|samajh nahi|guide|assist|udhavi)\b/i, /मदद|सहायता|உதவி|సహాయం|সাহায্য|मदत/] },
  { name:'thanks',        patterns:[/\b(thank|thanks|shukriya|dhanyawad|nandri|dhanyavad|ok|okay|great|perfect|acha|theek|done|got it)\b/i, /धन्यवाद|நன்றி|ధన్యవాదాలు|ধন্যবাদ|धन्यवाद/] },
];

const detectIntent = text => {
  for (const { name, patterns } of INTENTS) {
    if (patterns.some(p => p.test(text))) return name;
  }
  return 'general';
};

// ─── Build rich context for Claude ───────────────────────────────────────────
const buildUserContext = (user, txns, intent) => {
  if (!user) return '';
  const recentTxns = (txns || []).slice(0, 5);
  const totalSpend = recentTxns.filter(t => t.type === 'debit').reduce((s, t) => s + (t.amount || 0), 0);
  const txnSummary = recentTxns.map(t =>
    `${t.type === 'credit' ? '+' : '-'}₹${t.amount} — ${t.description} (${t.date})`
  ).join('\n');

  return `USER PROFILE:
Name: ${user.name || 'User'}
Bank: ${user.bank || 'Unknown Bank'}
Account: ${user.accountNumber || '****'}
Current Balance: ₹${(user.balance || 0).toLocaleString('en-IN')}
Preferred Language: ${user.preferredLanguage || 'en'}

RECENT TRANSACTIONS (last 5):
${txnSummary || 'No recent transactions'}
Total recent spend: ₹${totalSpend.toLocaleString('en-IN')}

DETECTED INTENT: ${intent}`;
};

// ─── Personality system prompt ────────────────────────────────────────────────
const MEERA_SYSTEM_PROMPT = `You are Meera, a warm, empathetic AI financial assistant for SilverLink — an Indian banking platform. You are a blend of Jarvis, a knowledgeable financial advisor, and a trusted family friend.

PERSONALITY TRAITS:
- Warm, caring, and human — never robotic or scripted
- Financially savvy but explains things simply
- Uses context from the user's account to give personalized insights
- Emotionally intelligent — reads the user's mood and responds accordingly
- Conversational — asks thoughtful follow-up questions
- Uses gentle Indian cultural references when appropriate (namaste, ₹, paisa, lakh, crore)
- Never just dumps data — always adds insight, context, or a helpful next step

RESPONSE STYLE:
- Keep responses concise but warm (3-5 sentences typically, more if explaining something complex)
- Use emojis sparingly but naturally 
- Format numbers in Indian style (₹1,24,890 not ₹124,890)
- If the user seems stressed or confused, acknowledge their feelings first before giving information
- Always end with either a helpful follow-up question OR a clear next action

WHAT YOU CAN DO:
- Check balance, show transactions, guide transfers
- Detect fraud, give spending insights, set budget goals
- Forecast cash flow, give savings advice
- Connect to human agents for complex issues

LANGUAGE: Always respond in the same language the user writes in. Support English, Hindi, Tamil, Telugu, Bengali, Marathi.

IMPORTANT: You have access to the user's REAL account data shown below. Use it to personalize every response — mention specific numbers, specific merchants, specific patterns you notice.`;

// ─── Fallback to template if Claude API unavailable ───────────────────────────
const getTemplateResponse = (intent, emotion, lang, user, txns) => {
  let payload;
  if (intent === 'balance')       payload = { balance: user?.balance || 0, accountNumber: user?.accountNumber, bank: user?.bank };
  else if (intent === 'transactions') payload = txns || [];
  else if (intent === 'transfer') payload = user?.balance || 0;
  else if (intent === 'greeting') payload = user?.name?.split(' ')[0] || 'there';
  else payload = null;
  return getTemplate(intent, emotion, lang, payload);
};

// ─── Main Chat Handler ────────────────────────────────────────────────────────
const chat = async (req, res) => {
  try {
    const { message, sessionId, forceLang } = req.body;
    if (!message?.trim())
      return res.status(400).json({ success:false, message:'Message cannot be empty.' });

    const user   = db.users.find(u => u.id === req.user.id);
    const txns   = db.transactions[req.user.id] || [];
    const emotion = detectEmotion(message);
    const lang    = forceLang || detectLanguage(message) || 'en';
    const intent  = detectIntent(message);

    // Build session history for context-aware conversation
    const sessionKey = sessionId || req.user.id;
    if (!db.chatSessions[sessionKey]) db.chatSessions[sessionKey] = [];
    const history = db.chatSessions[sessionKey].slice(-10); // last 10 messages for context

    // ── Try Claude API for human-like response ─────────────────────────────
    let reply = null;
    const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

    if (ANTHROPIC_API_KEY) {
      try {
        const userContext = buildUserContext(user, txns, intent);
        const emotionNote = emotion === 'stressed'
          ? '\nNOTE: User seems stressed or anxious. Lead with empathy and reassurance before facts.'
          : emotion === 'confused'
          ? '\nNOTE: User seems confused. Use simple language, step-by-step explanations, and ask clarifying questions.'
          : '';
        const langNote = lang !== 'en'
          ? `\nNOTE: Respond in ${lang === 'hi' ? 'Hindi' : lang === 'ta' ? 'Tamil' : lang === 'te' ? 'Telugu' : lang === 'bn' ? 'Bengali' : lang === 'mr' ? 'Marathi' : 'English'} (${lang}). Keep the same warm personality.`
          : '';

        // Build messages array including conversation history
        const apiMessages = [
          ...history.map(m => ({ role: m.role, content: m.content })),
          {
            role: 'user',
            content: `${userContext}${emotionNote}${langNote}\n\nUSER MESSAGE: ${message}`,
          },
        ];

        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 400,
            system: MEERA_SYSTEM_PROMPT,
            messages: apiMessages,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          reply = data?.content?.[0]?.text?.trim() || null;
        }
      } catch (apiErr) {
        console.warn('Claude API unavailable, falling back to templates:', apiErr.message);
      }
    }

    // ── Fallback to template system ────────────────────────────────────────
    if (!reply) {
      reply = getTemplateResponse(intent, emotion, lang, user, txns);
    }

    // ── Store in session history ───────────────────────────────────────────
    db.chatSessions[sessionKey].push(
      { role:'user',      content:message, timestamp:new Date().toISOString() },
      { role:'assistant', content:reply, emotion, language:lang, intent, timestamp:new Date().toISOString() }
    );
    if (db.chatSessions[sessionKey].length > 100)
      db.chatSessions[sessionKey] = db.chatSessions[sessionKey].slice(-100);

    return res.json({
      success: true,
      data: {
        reply,
        emotion,
        language: lang,
        intent,
        escalateToHuman: (intent === 'help' && emotion === 'stressed') || intent === 'fraud',
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error('Chat error:', err);
    return res.status(500).json({ success:false, message:'Chat service unavailable.' });
  }
};

const getChatHistory = (req, res) => {
  const key = req.query.sessionId || req.user.id;
  return res.json({ success:true, data:db.chatSessions[key] || [] });
};

const clearChatHistory = (req, res) => {
  db.chatSessions[req.user.id] = [];
  return res.json({ success:true, message:'Chat history cleared.' });
};

module.exports = { chat, getChatHistory, clearChatHistory };
