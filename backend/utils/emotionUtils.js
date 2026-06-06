'use strict';

const STRESSED_PATTERNS = [
  /\b(angry|anger|furious|rage|mad|upset|horrible|terrible|worst|useless|disgusting)\b/i,
  /\b(fraud|scam|hack|stolen|theft|cheated|robbed|unauthorized|suspicious)\b/i,
  /\b(lost|missing|gone|disappeared|wrong|error|mistake|problem|issue|complaint)\b/i,
  /\b(urgent|emergency|immediately|right now|asap|critical|serious)\b/i,
  /\b(scared|afraid|worried|panic|fear|terrified|anxious)\b/i,
  // Hindi stressed
  /\b(gussa|galat|dhoka|chori|ghabra|pareshan|tension|problem|dikkat)\b/i,
  /\b(emergency|turant|abhi|jaldi|zaruri)\b/i,
  // Tamil stressed
  /\b(கோபம்|பயம்|பிரச்சனை|திருட்டு|மோசடி)\b/,
  // Telugu stressed
  /\b(కోపం|భయం|సమస్య|దొంగతనం)\b/,
  // Bengali stressed
  /\b(রাগ|ভয়|সমস্যা|চুরি)\b/,
  // Marathi stressed
  /\b(राग|भीती|समस्या|चोरी)\b/,
];

const CONFUSED_PATTERNS = [
  /\b(don'?t understand|not sure|confused|unclear|complicated|difficult|what is|how do|how to|explain)\b/i,
  /\b(what does|meaning|what'?s the|can you explain|tell me about|i don'?t know)\b/i,
  /\b(help me understand|show me|guide me|step by step|slowly|again|repeat)\b/i,
  // Hindi confused
  /\b(samajh nahi|samajh nahin|kaise|kya hai|nahi pata|batao|samjhao|dheere)\b/i,
  /\b(mushkil|pata nahi|baar baar|dobara|phir se)\b/i,
  // Tamil confused
  /\b(புரியவில்லை|எப்படி|என்ன|விளக்கு)\b/,
  // Telugu confused
  /\b(అర్థం కాలేదు|ఎలా|ఏమిటి|వివరించు)\b/,
];

const detectEmotion = (text) => {
  if (!text || typeof text !== 'string') return 'calm';
  const normalized = text.trim();

  for (const pattern of STRESSED_PATTERNS) {
    if (pattern.test(normalized)) return 'stressed';
  }
  for (const pattern of CONFUSED_PATTERNS) {
    if (pattern.test(normalized)) return 'confused';
  }
  return 'calm';
};

const getEmotionTone = (emotion) => {
  const tones = {
    calm: { prefix: '', suffix: '' },
    confused: { prefix: '😊 ', suffix: ' I\'ll explain step by step.' },
    stressed: { prefix: '💛 ', suffix: ' Please don\'t worry, I\'m here to help.' },
  };
  return tones[emotion] || tones.calm;
};

module.exports = { detectEmotion, getEmotionTone };
