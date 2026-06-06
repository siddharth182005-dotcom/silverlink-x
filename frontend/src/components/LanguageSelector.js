import React, { memo, useCallback } from 'react';

export const LANGUAGES = [
  { code:'en', label:'EN', name:'English', native:'English' },
  { code:'hi', label:'HI', name:'Hindi',   native:'हिंदी'   },
  { code:'ta', label:'TA', name:'Tamil',   native:'தமிழ்'  },
  { code:'te', label:'TE', name:'Telugu',  native:'తెలుగు' },
  { code:'bn', label:'BN', name:'Bengali', native:'বাংলা'  },
  { code:'mr', label:'MR', name:'Marathi', native:'मराठी'  },
];

const SpeechLangMap = { en:'en-IN', hi:'hi-IN', ta:'ta-IN', te:'te-IN', bn:'bn-IN', mr:'mr-IN' };
export const getSpeechLang = (code) => SpeechLangMap[code] || 'en-IN';

const LanguageSelector = memo(({ value, onChange, compact = false }) => {
  const handleChange = useCallback((e) => onChange(e.target.value), [onChange]);
  if (compact) {
    return (
      <select value={value} onChange={handleChange} className="inp-x"
        style={{ padding:'4px 8px', fontSize:11, width:'auto', cursor:'pointer' }}>
        {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.label} · {l.native}</option>)}
      </select>
    );
  }
  return (
    <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
      {LANGUAGES.map(l => (
        <button key={l.code} onClick={() => onChange(l.code)}
          style={{
            padding:'4px 10px', borderRadius:6, fontSize:11, fontWeight:600,
            border: value===l.code ? '1px solid var(--neon)' : '1px solid var(--border-x)',
            background: value===l.code ? 'var(--neon-dim)' : 'transparent',
            color: value===l.code ? 'var(--neon)' : 'var(--text-3)',
            cursor:'pointer', transition:'all .15s', fontFamily:'inherit',
            letterSpacing:'0.04em',
            boxShadow: value===l.code ? '0 0 8px rgba(0,255,200,0.15)' : 'none',
          }}>
          {l.label}
        </button>
      ))}
    </div>
  );
});

export default LanguageSelector;
