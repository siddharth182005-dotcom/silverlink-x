'use strict';

const HINDI_SCRIPT = /[\u0900-\u097F]/;
const TAMIL_SCRIPT = /[\u0B80-\u0BFF]/;
const TELUGU_SCRIPT = /[\u0C00-\u0C7F]/;
const BENGALI_SCRIPT = /[\u0980-\u09FF]/;
const MARATHI_DEVANAGARI = /[\u0900-\u097F]/; // shares Devanagari with Hindi

const HINDI_LATIN_WORDS = [
  'kya','mera','meri','kitna','kitni','paisa','paise','bhejo','bhejna',
  'dikha','batao','karo','hai','hain','nahi','nahin','aur','yahan','wahan',
  'abhi','kab','kaise','kyun','lekin','samajh','mushkil','accha','theek',
  'shukriya','namaste','haan','nahi','transfer','balance','account',
];

const TAMIL_LATIN_WORDS = ['vanakkam','panam','balance','transfer','enna','epdi','eppadi'];
const TELUGU_LATIN_WORDS = ['namaskaram','paniki','balance','transfer','emi','ela'];
const BENGALI_LATIN_WORDS = ['namaskar','taka','balance','transfer','ki','kemon'];
const MARATHI_LATIN_WORDS = ['namaskar','paise','balance','transfer','kay','kasa'];

const detectLanguage = (text) => {
  if (!text) return 'en';
  const lower = text.toLowerCase();

  if (TAMIL_SCRIPT.test(text)) return 'ta';
  if (TELUGU_SCRIPT.test(text)) return 'te';
  if (BENGALI_SCRIPT.test(text)) return 'bn';

  if (HINDI_SCRIPT.test(text)) {
    // Distinguish Marathi from Hindi by word frequency (simplified)
    const marathiWords = ['आहे', 'नाही', 'मला', 'तुम्ही', 'काय', 'कसे'];
    const hindiWords = ['है', 'नहीं', 'मुझे', 'आप', 'क्या', 'कैसे'];
    const mScore = marathiWords.filter(w => text.includes(w)).length;
    const hScore = hindiWords.filter(w => text.includes(w)).length;
    return mScore > hScore ? 'mr' : 'hi';
  }

  const words = lower.split(/\s+/);
  const hiScore = words.filter(w => HINDI_LATIN_WORDS.includes(w)).length;
  const taScore = words.filter(w => TAMIL_LATIN_WORDS.includes(w)).length;
  const teScore = words.filter(w => TELUGU_LATIN_WORDS.includes(w)).length;
  const bnScore = words.filter(w => BENGALI_LATIN_WORDS.includes(w)).length;
  const mrScore = words.filter(w => MARATHI_LATIN_WORDS.includes(w)).length;

  const max = Math.max(hiScore, taScore, teScore, bnScore, mrScore);
  if (max >= 2) {
    if (hiScore === max) return 'hi';
    if (taScore === max) return 'ta';
    if (teScore === max) return 'te';
    if (bnScore === max) return 'bn';
    if (mrScore === max) return 'mr';
  }
  return 'en';
};

const LANGUAGE_NAMES = {
  en: 'English', hi: 'Hindi', ta: 'Tamil', te: 'Telugu', bn: 'Bengali', mr: 'Marathi',
};

const getLanguageName = (code) => LANGUAGE_NAMES[code] || 'English';

module.exports = { detectLanguage, getLanguageName };
