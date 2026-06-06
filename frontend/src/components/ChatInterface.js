import React, { useState, useRef, useEffect, useCallback, memo } from 'react';
import ChatBubble, { ThinkingBubble } from './ChatBubble';
import AIAvatar from './AIAvatar';
import EmotionBadge from './EmotionBadge';
import LanguageSelector, { getSpeechLang } from './LanguageSelector';
import api from '../utils/api';

const QUICK = [
  { label:'BALANCE',   query:'What is my balance?',          icon:'◈' },
  { label:'TXNS',      query:'Show my recent transactions',  icon:'▷' },
  { label:'TRANSFER',  query:'I want to transfer money',     icon:'→' },
  { label:'FRAUD',     query:'Check my account for fraud',   icon:'⬡' },
  { label:'FORECAST',  query:'Show my 90-day cash forecast', icon:'▲' },
  { label:'GOALS',     query:'Show my savings goals',        icon:'◎' },
];

const WELCOME = {
  id:'welcome', role:'assistant',
  content:"SYSTEM ONLINE ▸\n\nNamaste! I'm Meera — your SilverLink X AI.\n\nI speak English, Hindi, Tamil, Telugu, Bengali & Marathi.\n\n🎙 Say \"Hey SilverLink\" to wake me anytime.\n\nOr tap the mic / type below. How can I help you today?",
  emotion:'calm', language:'en',
};

// ── Voice commands map ────────────────────────────────────────────────────────
const VOICE_COMMANDS = [
  { pattern:/check.*(balance|paisa|bakiya|funds)/i,    query:'What is my balance?' },
  { pattern:/show.*(transaction|history|statement)/i,  query:'Show my recent transactions' },
  { pattern:/open.*(goal|saving)/i,                    query:'Show my savings goals' },
  { pattern:/create.*(goal|saving)/i,                  query:'Create a new savings goal' },
  { pattern:/analyze.*(spend|kharcha|expense)/i,       query:'Analyze my spending patterns' },
  { pattern:(/(transfer|send|bhejo).*(money|paisa|funds)/i), query:'I want to transfer money' },
  { pattern:/fraud|suspicious|scam|hack/i,             query:'Check my account for fraud' },
  { pattern:/forecast|predict|next month/i,            query:'Show my 90-day cash forecast' },
  { pattern:/help|madad|support/i,                     query:'I need help with my account' },
];

const WAKE_WORDS = ['hey silverlink', 'hey silver link', 'silverlink', 'silver link', 'ey silverlink'];

const VBStates = { idle:'idle', listening:'listening', processing:'processing', speaking:'speaking', waking:'waking' };

// ── Voice State Bar Config ────────────────────────────────────────────────────
const VB_CONFIG = {
  [VBStates.idle]:       { text:'READY',        color:'var(--text-3)',  glow:'none',                                   icon:'◎' },
  [VBStates.waking]:     { text:'WAKE WORD…',   color:'var(--purple)',  glow:'0 0 8px rgba(168,85,247,0.4)',           icon:'◉' },
  [VBStates.listening]:  { text:'LISTENING…',   color:'#f43f5e',        glow:'0 0 8px rgba(244,63,94,0.3)',            icon:'◉' },
  [VBStates.processing]: { text:'PROCESSING…',  color:'var(--gold)',    glow:'0 0 8px rgba(245,200,66,0.3)',           icon:'◈' },
  [VBStates.speaking]:   { text:'SPEAKING…',    color:'var(--neon)',    glow:'0 0 8px rgba(0,255,200,0.3)',            icon:'▷' },
};

// ── Check Speech API support ──────────────────────────────────────────────────
const getSpeechRecognition = () =>
  window.SpeechRecognition || window.webkitSpeechRecognition || null;

const ChatInterface = memo(({ onEscalate, lang, onLangChange }) => {
  const [messages,   setMessages]   = useState([WELCOME]);
  const [input,      setInput]      = useState('');
  const [thinking,   setThinking]   = useState(false);
  const [vbState,    setVbState]    = useState(VBStates.idle);
  const [emotion,    setEmotion]    = useState('calm');
  const [escalated,  setEscalated]  = useState(false);
  const [wakeActive, setWakeActive] = useState(false);
  const [voiceError, setVoiceError] = useState(null);

  const endRef       = useRef(null);
  const inputRef     = useRef(null);
  const recogRef     = useRef(null);
  const wakeRecogRef = useRef(null);
  const synthRef     = useRef(window.speechSynthesis);
  // FIX: use ref to avoid stale closures in speech callbacks
  const vbStateRef   = useRef(vbState);
  useEffect(() => { vbStateRef.current = vbState; }, [vbState]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior:'smooth' }); }, [messages, thinking]);

  // ── Speech synthesis ──────────────────────────────────────────────────────
  const speakText = useCallback((text, langCode) => {
    if (!synthRef.current || !window.speechSynthesis) return;
    synthRef.current.cancel();
    const plain = text
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/[▸◈▷→⬡▲✦◉◎]/g, '')
      .replace(/\n/g, '. ')
      .trim()
      .slice(0, 300);
    if (!plain) return;
    const utt = new SpeechSynthesisUtterance(plain);
    utt.lang  = getSpeechLang(langCode) || 'en-IN';
    utt.rate  = 0.9;
    utt.pitch = 1.0;
    utt.onstart = () => setVbState(VBStates.speaking);
    utt.onend   = () => setVbState(VBStates.idle);
    utt.onerror = () => setVbState(VBStates.idle);
    synthRef.current.speak(utt);
  }, []);

  const stopSpeaking = useCallback(() => {
    synthRef.current?.cancel();
    setVbState(VBStates.idle);
  }, []);

  // ── Send message ──────────────────────────────────────────────────────────
  const sendMessage = useCallback(async (text, ovLang) => {
    const t = text?.trim();
    if (!t || thinking) return;
    synthRef.current?.cancel();
    setMessages(p => [...p, { id:Date.now(), role:'user', content:t }]);
    setInput('');
    setThinking(true);
    setVbState(VBStates.processing);
    try {
      const { data } = await api.post('/chat', { message:t, forceLang: ovLang || lang });
      if (data.success) {
        const msg = {
          id: Date.now() + 1, role:'assistant',
          content: data.data.reply,
          emotion: data.data.emotion,
          language: data.data.language,
        };
        setMessages(p => [...p, msg]);
        setEmotion(data.data.emotion || 'calm');
        if (data.data.language && data.data.language !== lang) onLangChange?.(data.data.language);
        if (data.data.escalateToHuman && !escalated) { setEscalated(true); onEscalate?.(); }
        setVbState(VBStates.idle);
        setTimeout(() => speakText(data.data.reply, data.data.language || lang), 300);
      }
    } catch (err) {
      const m = err.response?.data?.message || 'Connection error. Please check the backend is running.';
      setMessages(p => [...p, { id:Date.now()+1, role:'assistant', content:m, emotion:'calm', language:lang }]);
      setVbState(VBStates.idle);
    } finally {
      setThinking(false);
      inputRef.current?.focus();
    }
  }, [thinking, lang, onLangChange, onEscalate, escalated, speakText]);

  // ── Parse voice command → query string ───────────────────────────────────
  const parseVoiceCommand = useCallback((transcript) => {
    const lower = transcript.toLowerCase();
    for (const cmd of VOICE_COMMANDS) {
      if (cmd.pattern.test(lower)) return cmd.query;
    }
    return transcript; // pass raw transcript if no command matched
  }, []);

  // ── Start active (post-wake) recognition ─────────────────────────────────
  const startActiveListening = useCallback(() => {
    const SR = getSpeechRecognition();
    if (!SR) return;
    recogRef.current?.abort();

    const rec = new SR();
    rec.lang            = getSpeechLang(lang) || 'en-IN';
    rec.interimResults  = false;
    rec.maxAlternatives = 1;
    rec.continuous      = false;

    rec.onstart = () => {
      setVbState(VBStates.listening);
      setVoiceError(null);
    };

    rec.onresult = e => {
      const raw        = e.results[0]?.[0]?.transcript || '';
      const query      = parseVoiceCommand(raw);
      setInput(query);
      setVbState(VBStates.processing);
      sendMessage(query);
    };

    rec.onend = () => {
      // Only reset if we're still in listening state (not already processing/speaking)
      if (vbStateRef.current === VBStates.listening) setVbState(VBStates.idle);
    };

    rec.onerror = e => {
      if (e.error === 'aborted') return;
      const msg = e.error === 'not-allowed'
        ? 'Microphone permission denied. Please allow mic access in browser settings.'
        : e.error === 'no-speech'
        ? 'No speech detected. Please try again.'
        : `Voice error: ${e.error}`;
      setVoiceError(msg);
      setVbState(VBStates.idle);
    };

    rec.start();
    recogRef.current = rec;
  }, [lang, parseVoiceCommand, sendMessage]);

  // ── Wake word detection ───────────────────────────────────────────────────
  const startWakeWordDetection = useCallback(() => {
    const SR = getSpeechRecognition();
    if (!SR || wakeActive) return;

    const rec = new SR();
    rec.lang           = 'en-US';
    rec.interimResults = true;
    rec.continuous     = true;

    rec.onresult = e => {
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const transcript = e.results[i][0].transcript.toLowerCase().trim();
        if (WAKE_WORDS.some(w => transcript.includes(w))) {
          rec.stop();
          setWakeActive(false);
          // Brief visual feedback, then start active listening
          setVbState(VBStates.waking);
          setTimeout(() => startActiveListening(), 600);
          return;
        }
      }
    };
    rec.onerror = () => { setWakeActive(false); };
    rec.onend   = () => { setWakeActive(false); };

    try {
      rec.start();
      wakeRecogRef.current = rec;
      setWakeActive(true);
    } catch {
      setWakeActive(false);
    }
  }, [wakeActive, startActiveListening]);

  const stopWakeWord = useCallback(() => {
    wakeRecogRef.current?.abort();
    setWakeActive(false);
  }, []);

  // ── Mic button toggle ─────────────────────────────────────────────────────
  const toggleMic = useCallback(() => {
    setVoiceError(null);
    const SR = getSpeechRecognition();

    if (!SR) {
      setVoiceError('Voice recognition requires Google Chrome. Please switch to Chrome.');
      return;
    }
    if (vbStateRef.current === VBStates.speaking) { stopSpeaking(); return; }
    if (vbStateRef.current === VBStates.listening) { recogRef.current?.stop(); setVbState(VBStates.idle); return; }
    if (vbStateRef.current === VBStates.idle)  { startActiveListening(); return; }
  }, [startActiveListening, stopSpeaking]);

  // ── Clear chat ────────────────────────────────────────────────────────────
  const clearChat = useCallback(async () => {
    synthRef.current?.cancel();
    recogRef.current?.abort();
    wakeRecogRef.current?.abort();
    setWakeActive(false);
    try { await api.delete('/chat/history'); } catch {}
    setMessages([WELCOME]);
    setEmotion('calm');
    setEscalated(false);
    setInput('');
    setVoiceError(null);
  }, []);

  // ── Cleanup on unmount ────────────────────────────────────────────────────
  useEffect(() => () => {
    synthRef.current?.cancel();
    recogRef.current?.abort();
    wakeRecogRef.current?.abort();
  }, []);

  const isListening  = vbState === VBStates.listening;
  const isSpeaking   = vbState === VBStates.speaking;
  const vbc          = VB_CONFIG[vbState] || VB_CONFIG[VBStates.idle];
  const hasSpeechAPI = !!getSpeechRecognition();

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', background:'transparent' }}>

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px', borderBottom:'1px solid var(--border-x)', flexShrink:0, background:'rgba(6,13,30,0.9)', backdropFilter:'blur(10px)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <AIAvatar size={36} pulse={true} speaking={isSpeaking} listening={isListening} />
          <div>
            <p style={{ margin:0, fontSize:12, fontWeight:700, color:'var(--text-1)', fontFamily:'var(--font-head)', letterSpacing:.05 }}>MEERA AI</p>
            <div style={{ display:'flex', alignItems:'center', gap:5, marginTop:2 }}>
              <span style={{ width:5, height:5, borderRadius:'50%', background:'var(--neon)', boxShadow:'0 0 4px rgba(0,255,200,0.8)', display:'inline-block', animation:'pulseNeon 1.5s infinite' }}/>
              <span style={{ fontSize:9, color:vbc.color, fontFamily:'var(--font-mono)', letterSpacing:.06, textShadow:vbc.glow }}>{vbc.icon} {vbc.text}</span>
            </div>
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:7 }}>
          <EmotionBadge emotion={emotion} size="sm" />
          {/* Wake word toggle */}
          {hasSpeechAPI && (
            <button
              onClick={wakeActive ? stopWakeWord : startWakeWordDetection}
              title={wakeActive ? 'Disable wake word' : 'Enable "Hey SilverLink" wake word'}
              style={{ padding:'4px 8px', borderRadius:6, border:`1px solid ${wakeActive ? 'rgba(168,85,247,0.5)' : 'var(--border-x)'}`, background:wakeActive ? 'rgba(168,85,247,0.12)' : 'transparent', color:wakeActive ? 'var(--purple)' : 'var(--text-3)', fontSize:9, cursor:'pointer', fontFamily:'var(--font-mono)', fontWeight:700, transition:'all .15s' }}>
              {wakeActive ? '◉ WAKE' : '○ WAKE'}
            </button>
          )}
          <button onClick={clearChat} className="btn-x" style={{ padding:'4px 8px', fontSize:10 }}>⌫ CLEAR</button>
        </div>
      </div>

      {/* ── Language bar ──────────────────────────────────────────────────── */}
      <div style={{ padding:'6px 14px', borderBottom:'1px solid var(--border-2)', background:'rgba(6,13,30,0.7)', display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
        <span style={{ fontSize:9, fontFamily:'var(--font-mono)', color:'var(--text-3)', flexShrink:0 }}>LANG:</span>
        <LanguageSelector value={lang} onChange={onLangChange} />
        {!hasSpeechAPI && (
          <span style={{ fontSize:9, color:'#f43f5e', fontFamily:'var(--font-mono)', marginLeft:'auto' }}>⚠ Voice: Chrome only</span>
        )}
      </div>

      {/* ── Quick actions ─────────────────────────────────────────────────── */}
      <div style={{ display:'flex', gap:5, padding:'7px 14px', overflowX:'auto', flexShrink:0, scrollbarWidth:'none', background:'rgba(6,13,30,0.5)' }}>
        {QUICK.map(q => (
          <button key={q.label} onClick={() => sendMessage(q.query)} disabled={thinking}
            style={{ flexShrink:0, display:'flex', alignItems:'center', gap:5, padding:'5px 11px', borderRadius:6, border:'1px solid var(--border-x)', background:'transparent', color:'var(--text-3)', fontSize:10, cursor:thinking ? 'not-allowed' : 'pointer', fontFamily:'inherit', fontWeight:600, letterSpacing:.05, transition:'all .15s', opacity:thinking ? .5 : 1 }}
            onMouseEnter={e => { if (!thinking) { e.currentTarget.style.borderColor='var(--neon)'; e.currentTarget.style.color='var(--neon)'; e.currentTarget.style.background='var(--neon-dim)'; }}}
            onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border-x)'; e.currentTarget.style.color='var(--text-3)'; e.currentTarget.style.background='transparent'; }}>
            <span style={{ fontSize:12 }}>{q.icon}</span>{q.label}
          </button>
        ))}
      </div>

      {/* ── Voice error banner ─────────────────────────────────────────────── */}
      {voiceError && (
        <div style={{ margin:'0 14px 0', background:'rgba(244,63,94,0.06)', border:'1px solid rgba(244,63,94,0.2)', borderRadius:8, padding:'7px 11px', display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
          <span style={{ fontSize:11, color:'#f43f5e' }}>⚠</span>
          <span style={{ flex:1, fontSize:10, color:'var(--text-2)', fontFamily:'var(--font-mono)' }}>{voiceError}</span>
          <button onClick={() => setVoiceError(null)} style={{ background:'none', border:'none', color:'var(--text-3)', cursor:'pointer', fontSize:12 }}>×</button>
        </div>
      )}

      {/* ── Messages ──────────────────────────────────────────────────────── */}
      <div style={{ flex:1, overflowY:'auto', padding:'14px', display:'flex', flexDirection:'column', gap:14 }}>
        {messages.map(m => <ChatBubble key={m.id} message={m} />)}
        {thinking && <ThinkingBubble />}
        <div ref={endRef} />
      </div>

      {/* ── Escalated banner ──────────────────────────────────────────────── */}
      {escalated && (
        <div style={{ margin:'0 14px 8px', background:'rgba(59,130,246,0.08)', border:'1px solid rgba(59,130,246,0.25)', borderRadius:10, padding:'8px 12px', display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontSize:14 }}>👨‍💼</span>
          <div style={{ flex:1 }}>
            <p style={{ margin:0, fontSize:11, fontWeight:600, color:'var(--blue-x)', fontFamily:'var(--font-mono)' }}>AGENT_CONNECTING…</p>
            <p style={{ margin:0, fontSize:10, color:'var(--text-3)' }}>Estimated wait: ~2 minutes</p>
          </div>
          <span style={{ width:7, height:7, borderRadius:'50%', background:'var(--blue-x)', boxShadow:'0 0 6px rgba(59,130,246,0.8)', animation:'pulseNeon 1s infinite' }}/>
        </div>
      )}

      {/* ── Input area ────────────────────────────────────────────────────── */}
      <div style={{ padding:'10px 14px 14px', borderTop:'1px solid var(--border-x)', background:'rgba(6,13,30,0.9)', flexShrink:0 }}>
        <div style={{ display:'flex', gap:8, alignItems:'flex-end' }}>
          <textarea
            value={input} onChange={e => setInput(e.target.value)} ref={inputRef} rows={1}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); }}}
            placeholder={`Type or speak${hasSpeechAPI ? ` · Say "Hey SilverLink" to wake` : ''}… ${isListening ? '🔴 Listening…' : ''}`}
            style={{ flex:1, background:'rgba(10,22,40,0.8)', border:'1px solid var(--border-x)', borderRadius:10, padding:'9px 13px', fontSize:14, color:'var(--text-1)', outline:'none', fontFamily:'inherit', resize:'none', lineHeight:1.5, maxHeight:100, transition:'border-color .2s, box-shadow .2s' }}
            onFocus={e => { e.target.style.borderColor='var(--neon)'; e.target.style.boxShadow='0 0 0 3px rgba(0,255,200,0.06), 0 0 16px rgba(0,255,200,0.08)'; }}
            onBlur={e  => { e.target.style.borderColor='var(--border-x)'; e.target.style.boxShadow='none'; }}
          />
          {/* Mic button */}
          <button
            onClick={toggleMic}
            disabled={!hasSpeechAPI}
            title={hasSpeechAPI ? (isListening ? 'Stop listening' : isSpeaking ? 'Stop speaking' : 'Start voice input') : 'Voice requires Chrome'}
            style={{ width:40, height:40, borderRadius:10, border:'1px solid', flexShrink:0, cursor:hasSpeechAPI ? 'pointer' : 'not-allowed', display:'flex', alignItems:'center', justifyContent:'center', transition:'all .2s', opacity:hasSpeechAPI ? 1 : .4,
              borderColor: isListening ? 'rgba(244,63,94,0.6)' : isSpeaking ? 'rgba(0,255,200,0.5)' : 'var(--border-x)',
              background:  isListening ? 'rgba(244,63,94,0.12)' : isSpeaking ? 'rgba(0,255,200,0.1)' : 'transparent',
              boxShadow:   isListening ? '0 0 12px rgba(244,63,94,0.3)' : isSpeaking ? '0 0 12px rgba(0,255,200,0.2)' : 'none',
            }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              {isListening
                ? <rect x="6" y="6" width="12" height="12" rx="2" fill="#f43f5e"/>
                : <>
                    <rect x="9" y="2" width="6" height="13" rx="3" stroke={isSpeaking ? '#00ffc8' : '#64748b'} strokeWidth="1.5" fill="none"/>
                    <path d="M5 11c0 3.9 3.1 7 7 7s7-3.1 7-7" stroke={isSpeaking ? '#00ffc8' : '#64748b'} strokeWidth="1.5" strokeLinecap="round" fill="none"/>
                    <line x1="12" y1="18" x2="12" y2="22" stroke={isSpeaking ? '#00ffc8' : '#64748b'} strokeWidth="1.5" strokeLinecap="round"/>
                  </>
              }
            </svg>
          </button>
          {/* Send button */}
          <button
            onClick={() => sendMessage(input)} disabled={!input.trim() || thinking}
            style={{ width:40, height:40, borderRadius:10, border:'1px solid', flexShrink:0, cursor:(!input.trim() || thinking) ? 'not-allowed' : 'pointer', display:'flex', alignItems:'center', justifyContent:'center', transition:'all .15s',
              borderColor: (!input.trim() || thinking) ? 'var(--border-2)' : 'rgba(0,255,200,0.4)',
              background:  (!input.trim() || thinking) ? 'transparent' : 'rgba(0,255,200,0.1)',
              boxShadow:   (!input.trim() || thinking) ? 'none' : '0 0 12px rgba(0,255,200,0.15)',
            }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M22 2L11 13" stroke={(!input.trim() || thinking) ? '#334155' : '#00ffc8'} strokeWidth="1.8" strokeLinecap="round"/>
              <path d="M22 2L15 22L11 13L2 9L22 2Z" fill={(!input.trim() || thinking) ? '#334155' : '#00ffc8'}/>
            </svg>
          </button>
        </div>
        {/* Human escalation */}
        <button
          onClick={() => { sendMessage('Connect me to a human agent', 'en'); setEscalated(true); onEscalate?.(); }}
          className="btn-x"
          style={{ width:'100%', marginTop:8, fontSize:10, letterSpacing:.06 }}>
          👨‍💼 ESCALATE TO HUMAN AGENT
        </button>
      </div>
    </div>
  );
});

export default ChatInterface;
