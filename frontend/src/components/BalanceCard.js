import React, { useState, useEffect, useCallback, memo, useRef } from 'react';
import api from '../utils/api';

const BalanceCard = memo(({ user, onBalanceUpdate }) => {
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(true);
  const [error,   setError]   = useState('');
  const canvasRef = useRef(null);
  const animRef   = useRef(null);

  const fetchBalance = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const { data } = await api.get('/banking/balance');
      if (data.success) { setBalance(data.data.balance); onBalanceUpdate?.(data.data.balance); }
    } catch { setError('Connection error'); }
    finally { setLoading(false); }
  }, [onBalanceUpdate]);

  useEffect(() => { fetchBalance(); }, [fetchBalance]);

  // Animated particle canvas
  useEffect(() => {
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext('2d');
    c.width = c.offsetWidth * 2; c.height = c.offsetHeight * 2;
    const W = c.width, H = c.height;
    const particles = Array.from({ length: 30 }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - .5) * .6, vy: (Math.random() - .5) * .6,
      r: Math.random() * 1.5 + .5, a: Math.random(),
    }));
    let frame = 0;
    const draw = () => {
      frame++;
      ctx.clearRect(0, 0, W, H);
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
        p.a = .3 + .3 * Math.sin(frame * .02 + p.r * 2);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0,255,200,${p.a})`;
        ctx.shadowColor = 'rgba(0,255,200,0.6)'; ctx.shadowBlur = 4;
        ctx.fill(); ctx.shadowBlur = 0;
      });
      animRef.current = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  const fmt = (n) => parseFloat(n).toLocaleString('en-IN', { minimumFractionDigits: 2 });

  return (
    <div style={{ borderRadius:20, overflow:'hidden', position:'relative', marginBottom:16 }}>
      {/* Particle canvas background */}
      <canvas ref={canvasRef} style={{ position:'absolute', inset:0, width:'100%', height:'100%', opacity:.4 }}/>

      {/* Main card */}
      <div style={{
        background:'linear-gradient(135deg, rgba(6,13,30,0.97) 0%, rgba(10,22,40,0.97) 50%, rgba(6,13,30,0.97) 100%)',
        border:'1px solid rgba(0,255,200,0.2)',
        borderRadius:20, padding:'22px 22px 20px',
        position:'relative', overflow:'hidden',
        boxShadow:'0 0 40px rgba(0,255,200,0.05), inset 0 1px 0 rgba(0,255,200,0.1)',
      }}>
        {/* Top line accent */}
        <div style={{ position:'absolute', top:0, left:0, right:0, height:1, background:'linear-gradient(90deg, transparent 0%, rgba(0,255,200,0.6) 50%, transparent 100%)' }}/>
        {/* Corner brackets */}
        {[[0,0,'top:8px;left:8px;border-top:1px;border-left:1px'],[1,0,'top:8px;right:8px;border-top:1px;border-right:1px'],[0,1,'bottom:8px;left:8px;border-bottom:1px;border-left:1px'],[1,1,'bottom:8px;right:8px;border-bottom:1px;border-right:1px']].map(([h,v],i) => (
          <div key={i} style={{
            position:'absolute', width:14, height:14,
            top: v===0 ? 8 : undefined, bottom: v===1 ? 8 : undefined,
            left: h===0 ? 8 : undefined, right: h===1 ? 8 : undefined,
            borderTop: v===0 ? '1px solid rgba(0,255,200,0.4)' : undefined,
            borderBottom: v===1 ? '1px solid rgba(0,255,200,0.4)' : undefined,
            borderLeft: h===0 ? '1px solid rgba(0,255,200,0.4)' : undefined,
            borderRight: h===1 ? '1px solid rgba(0,255,200,0.4)' : undefined,
          }}/>
        ))}

        <div style={{ position:'relative' }}>
          {/* Header row */}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:18 }}>
            <div>
              <p style={{ color:'var(--text-3)', fontSize:10, margin:'0 0 4px', fontFamily:'var(--font-mono)', letterSpacing:.08 }}>// ACCOUNT HOLDER</p>
              <p style={{ color:'var(--text-1)', fontSize:17, margin:0, fontFamily:'var(--font-head)', fontWeight:700, letterSpacing:'.01em' }}>
                {user?.name?.split(' ')[0]?.toUpperCase()} <span style={{ color:'var(--neon)', fontSize:14 }}>🙏</span>
              </p>
            </div>
            <div style={{ textAlign:'right' }}>
              <div className="tag-x tag-neon" style={{ marginBottom:4 }}>● LIVE</div>
              <p style={{ color:'var(--text-3)', fontSize:10, fontFamily:'var(--font-mono)', margin:0 }}>{user?.accountNumber || '****XXXX'}</p>
            </div>
          </div>

          {/* Balance */}
          <p style={{ color:'var(--text-3)', fontSize:9, margin:'0 0 6px', fontFamily:'var(--font-mono)', letterSpacing:.1, textTransform:'uppercase' }}>
            {'>'} available_balance
          </p>
          {loading ? (
            <div style={{ height:40, width:200, borderRadius:6, background:'linear-gradient(90deg, rgba(0,255,200,0.05), rgba(0,255,200,0.12), rgba(0,255,200,0.05))', backgroundSize:'200%', animation:'shimmer 1.5s infinite' }}/>
          ) : error ? (
            <p style={{ color:'var(--red-x)', fontSize:13, margin:0 }}>{error} <button onClick={fetchBalance} style={{ color:'var(--neon)', background:'none', border:'none', cursor:'pointer', fontSize:12 }}>↺ retry</button></p>
          ) : (
            <div style={{ display:'flex', alignItems:'baseline', gap:6 }}>
              <span style={{ color:'var(--text-3)', fontSize:18, fontFamily:'var(--font-mono)' }}>₹</span>
              <span className="mono" style={{ color:'#fff', fontSize:36, fontWeight:700, letterSpacing:'-1px', textShadow:'0 0 20px rgba(255,255,255,0.15)' }}>
                {visible ? fmt(balance || 0) : '██,███.██'}
              </span>
              <button onClick={() => setVisible(v => !v)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-3)', padding:'2px 6px', marginLeft:2 }}>
                {visible
                  ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="1.5"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5"/></svg>
                  : <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                }
              </button>
            </div>
          )}

          {/* Separator */}
          <div style={{ height:1, background:'linear-gradient(90deg, rgba(0,255,200,0.4) 0%, transparent 100%)', margin:'16px 0 12px' }}/>

          {/* Footer metadata */}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <p style={{ color:'var(--text-3)', fontSize:10, fontFamily:'var(--font-mono)', margin:0 }}>
              {user?.bank || 'SILVERLINK BANK'} · SAVINGS
            </p>
            <div style={{ display:'flex', gap:6 }}>
              <span className="tag-x tag-neon" style={{ fontSize:8 }}>KYC ✓</span>
              <span className="tag-x tag-gold"  style={{ fontSize:8 }}>2FA</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default BalanceCard;
