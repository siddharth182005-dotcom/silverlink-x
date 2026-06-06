import React, { memo } from 'react';
import AIAvatar from './AIAvatar';
import EmotionBadge from './EmotionBadge';

const LANG_LABELS = { en:'English', hi:'हिंदी', ta:'தமிழ்', te:'తెలుగు', bn:'বাংলা', mr:'मराठी' };

const renderContent = (text) =>
  text.split('\n').map((line, i, arr) => {
    const parts = line.split(/\*\*(.*?)\*\*/g);
    return (
      <span key={i}>
        {parts.map((p, j) => j % 2 === 1 ? <strong key={j} style={{ color:'var(--neon)', fontWeight:600 }}>{p}</strong> : p)}
        {i < arr.length - 1 && <br />}
      </span>
    );
  });

export const ThinkingBubble = memo(() => (
  <div style={{ display:'flex', alignItems:'flex-end', gap:10, animation:'fadeSlideUp .25s ease' }}>
    <AIAvatar size={32} pulse={false} />
    <div className="ag-card" style={{ padding:'12px 18px', display:'flex', gap:6, alignItems:'center', borderRadius:'14px 14px 14px 3px' }}>
      {[0,150,300].map(delay => (
        <span key={delay} style={{
          width:6, height:6, borderRadius:'50%',
          background:'var(--neon)', display:'inline-block', opacity:.4,
          animation:`thinkBlink 1.2s ${delay}ms infinite`,
          boxShadow:'0 0 4px rgba(0,255,200,0.6)',
        }}/>
      ))}
      <span style={{ fontSize:11, color:'var(--text-3)', marginLeft:4, fontFamily:'var(--font-mono)', letterSpacing:.05 }}>PROCESSING</span>
    </div>
    <style>{`@keyframes thinkBlink{0%,100%{opacity:.2;transform:scale(.8)}50%{opacity:1;transform:scale(1)}}`}</style>
  </div>
));

const ChatBubble = memo(({ message }) => {
  const isUser = message.role === 'user';
  if (isUser) {
    return (
      <div style={{ display:'flex', justifyContent:'flex-end', animation:'fadeSlideUp .22s ease' }}>
        <div style={{
          maxWidth:'78%', position:'relative',
          background:'linear-gradient(135deg, rgba(0,255,200,0.12) 0%, rgba(0,212,170,0.06) 100%)',
          border:'1px solid rgba(0,255,200,0.25)',
          borderRadius:'14px 14px 3px 14px',
          padding:'10px 15px', fontSize:14, lineHeight:1.6, color:'var(--text-1)',
          boxShadow:'0 0 16px rgba(0,255,200,0.06)',
        }}>
          {/* top-line accent */}
          <div style={{ position:'absolute', top:0, left:0, right:0, height:1, background:'linear-gradient(90deg, transparent, rgba(0,255,200,0.4), transparent)', borderRadius:'14px 14px 0 0' }}/>
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display:'flex', alignItems:'flex-end', gap:10, animation:'fadeSlideUp .22s ease' }}>
      <AIAvatar size={32} pulse={false} speaking={false} />
      <div style={{ maxWidth:'78%' }}>
        <div className="ag-card" style={{ padding:'11px 15px', fontSize:14, lineHeight:1.65, color:'var(--text-1)', borderRadius:'14px 14px 14px 3px', whiteSpace:'pre-line' }}>
          {renderContent(message.content)}
        </div>
        {(message.emotion || message.language) && (
          <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:5 }}>
            {message.emotion && <EmotionBadge emotion={message.emotion} size="sm" />}
            {message.language && <span style={{ fontSize:9, color:'var(--text-3)', fontFamily:'var(--font-mono)', letterSpacing:.04 }}>{LANG_LABELS[message.language]||message.language}</span>}
          </div>
        )}
      </div>
    </div>
  );
});

export default ChatBubble;
