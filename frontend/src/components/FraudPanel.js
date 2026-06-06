import React, { useState, useEffect, useCallback, memo, useRef } from 'react';
import api from '../utils/api';

const ScoreRing = memo(({ score }) => {
  const canvasRef = useRef(null);
  const animRef   = useRef(null);
  useEffect(() => {
    const c = canvasRef.current; if (!c) return;
    const s = 120; c.width = s; c.height = s;
    const ctx = c.getContext('2d');
    const cx = s/2, cy = s/2, r = 48;
    let current = 0;
    const target = score / 100;
    const color = score>=80?'#00ffc8':score>=60?'#f5c842':'#f43f5e';
    const glow   = score>=80?'rgba(0,255,200,0.5)':score>=60?'rgba(245,200,66,0.5)':'rgba(244,63,94,0.5)';
    const draw = () => {
      ctx.clearRect(0,0,s,s);
      // Track
      ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2);
      ctx.strokeStyle='rgba(255,255,255,0.05)'; ctx.lineWidth=6; ctx.stroke();
      // Tick marks
      for(let i=0;i<36;i++) {
        const a = (i/36)*Math.PI*2 - Math.PI/2;
        const x1=cx+Math.cos(a)*(r+10); const y1=cy+Math.sin(a)*(r+10);
        const x2=cx+Math.cos(a)*(r+13); const y2=cy+Math.sin(a)*(r+13);
        ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2);
        ctx.strokeStyle=`rgba(0,255,200,${i/36<current?0.3:0.08})`; ctx.lineWidth=1; ctx.stroke();
      }
      // Arc
      ctx.beginPath(); ctx.arc(cx,cy,r,-Math.PI/2,-Math.PI/2+current*Math.PI*2);
      ctx.strokeStyle=color; ctx.lineWidth=6; ctx.lineCap='round';
      ctx.shadowColor=glow; ctx.shadowBlur=10; ctx.stroke(); ctx.shadowBlur=0;
      // Centre text
      ctx.fillStyle='#fff'; ctx.font=`bold 22px 'Space Mono', monospace`;
      ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(score,cx,cy-4);
      ctx.fillStyle='rgba(255,255,255,0.3)'; ctx.font=`10px 'Space Grotesk', sans-serif`;
      ctx.fillText('/100',cx,cy+12);
      if(current < target) { current = Math.min(target, current+0.015); animRef.current=requestAnimationFrame(draw); }
    };
    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [score]);
  return <canvas ref={canvasRef} style={{ width:60, height:60 }}/>;
});

const FraudPanel = memo(() => {
  const [data,      setData]      = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [resolving, setResolving] = useState(null);

  const load = useCallback(async () => {
    try {
      const r = await api.get('/banking/fraud/alerts');
      if (r.data.success) setData(r.data.data);
    } catch {} finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const resolve = useCallback(async (id) => {
    setResolving(id);
    try { await api.patch(`/banking/fraud/${id}/resolve`); await load(); }
    catch {} finally { setResolving(null); }
  }, [load]);

  if (loading) return (
    <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
      {[...Array(3)].map((_,i) => (
        <div key={i} className="ag-card" style={{ height:70, background:'linear-gradient(90deg,rgba(0,255,200,0.03),rgba(0,255,200,0.06),rgba(0,255,200,0.03))', backgroundSize:'200%', animation:'shimmer 1.5s infinite' }}/>
      ))}
    </div>
  );
  if (!data) return null;

  const score = data.score || 94;
  const scoreColor = score>=80?'var(--neon)':score>=60?'var(--gold)':'#f43f5e';
  const scoreLabel = score>=80?'SECURE':'REVIEW NEEDED';
  const activeAlerts = data.alerts?.filter(a => !a.resolved) || [];

  return (
    <div>
      {/* Hero score panel */}
      <div className="ag-card" style={{ padding:'18px 20px', marginBottom:12, background:'linear-gradient(135deg, rgba(10,22,40,0.97) 0%, rgba(6,13,30,0.99) 100%)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:16 }}>
          <ScoreRing score={score}/>
          <div>
            <p style={{ margin:'0 0 3px', fontSize:9, color:'var(--text-3)', fontFamily:'var(--font-mono)', letterSpacing:.1 }}>// AI SECURITY SCORE</p>
            <p style={{ margin:'0 0 5px', fontFamily:'var(--font-head)', fontSize:20, fontWeight:800, color:scoreColor, textShadow:`0 0 16px ${scoreColor}44` }}>{scoreLabel}</p>
            <p style={{ margin:'0 0 8px', fontSize:10, color:'var(--text-3)' }}>Isolation Forest + XGBoost · Sub-second risk scoring</p>
            <div style={{ display:'flex', gap:6 }}>
              <span className={`tag-x ${score>=80?'tag-neon':score>=60?'tag-gold':'tag-red'}`}>{activeAlerts.length} ACTIVE ALERT{activeAlerts.length!==1?'S':''}</span>
              <span className="tag-x tag-purple">REAL-TIME SCAN</span>
            </div>
          </div>
        </div>
        {/* Animated scan line */}
        <div style={{ position:'relative', height:2, background:'var(--border-2)', borderRadius:1, marginTop:16, overflow:'hidden' }}>
          <div style={{ position:'absolute', top:0, left:0, width:'30%', height:'100%', background:'linear-gradient(90deg, transparent, var(--neon), transparent)', animation:'scanLine 2s linear infinite' }}/>
        </div>
      </div>

      {/* Active alerts */}
      {activeAlerts.length > 0 && (
        <div style={{ marginBottom:12 }}>
          <p style={{ margin:'0 0 8px', fontSize:9, fontFamily:'var(--font-mono)', color:'#f43f5e', letterSpacing:.1 }}>// ACTIVE_THREATS</p>
          {activeAlerts.map(alert => (
            <div key={alert.id} className="ag-card" style={{ padding:'14px 16px', marginBottom:8, borderColor:'rgba(244,63,94,0.3)', background:'rgba(244,63,94,0.05)' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:8 }}>
                <div style={{ flex:1 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:6 }}>
                    <span style={{ fontSize:16, animation:'pulseNeon 1s infinite' }}>⬡</span>
                    <span className="tag-x tag-red">HIGH RISK</span>
                    <span className="tag-x tag-red" style={{ fontSize:8 }}>SCORE {alert.riskScore}/100</span>
                  </div>
                  <p style={{ margin:'0 0 3px', fontSize:13, fontWeight:600, color:'var(--text-1)' }}>{alert.description}</p>
                  <p style={{ margin:'0 0 5px', fontSize:11, color:'var(--text-3)', lineHeight:1.5 }}>{alert.recommendation}</p>
                  <p style={{ margin:0, fontSize:9, fontFamily:'var(--font-mono)', color:'rgba(244,63,94,0.5)' }}>MODEL: {alert.model}</p>
                </div>
                <button onClick={() => resolve(alert.id)} disabled={resolving===alert.id}
                  style={{ flexShrink:0, padding:'6px 12px', borderRadius:7, border:'1px solid rgba(244,63,94,0.5)', background:'rgba(244,63,94,0.1)', color:'#f43f5e', fontSize:10, fontWeight:700, cursor:'pointer', fontFamily:'var(--font-mono)', letterSpacing:.05, transition:'all .15s' }}
                  onMouseEnter={e=>{e.currentTarget.style.background='rgba(244,63,94,0.2)';}}
                  onMouseLeave={e=>{e.currentTarget.style.background='rgba(244,63,94,0.1)';}}>
                  {resolving===alert.id ? '…' : 'RESOLVE'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* High-risk transactions */}
      {data.highRiskTransactions?.length > 0 && (
        <div style={{ marginBottom:12 }}>
          <p style={{ margin:'0 0 8px', fontSize:9, fontFamily:'var(--font-mono)', color:'var(--gold)', letterSpacing:.1 }}>// FLAGGED_TRANSACTIONS</p>
          {data.highRiskTransactions.map(t => (
            <div key={t.id} className="ag-card" style={{ padding:'11px 14px', marginBottom:7, borderColor:'rgba(244,63,94,0.2)', display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ width:32, height:32, borderRadius:8, background:'rgba(244,63,94,0.1)', border:'1px solid rgba(244,63,94,0.3)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, color:'#f43f5e', flexShrink:0 }}>⚠</div>
              <div style={{ flex:1, minWidth:0 }}>
                <p style={{ margin:'0 0 2px', fontSize:13, fontWeight:500, color:'var(--text-1)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{t.description}</p>
                <p style={{ margin:0, fontSize:10, fontFamily:'var(--font-mono)', color:'var(--text-3)' }}>{t.date} · {t.method}</p>
              </div>
              <div style={{ textAlign:'right', flexShrink:0 }}>
                <p className="mono" style={{ margin:'0 0 2px', fontSize:13, fontWeight:700, color:'#f43f5e' }}>−₹{t.amount.toLocaleString('en-IN')}</p>
                <span className="tag-x tag-red" style={{ fontSize:8 }}>RISK {t.riskScore}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* All clear */}
      {activeAlerts.length===0 && !data.highRiskTransactions?.length && (
        <div className="ag-card" style={{ padding:'28px 20px', textAlign:'center', borderColor:'rgba(0,255,200,0.2)' }}>
          <div style={{ fontSize:36, marginBottom:10, animation:'floatUp 2.5s ease-in-out infinite' }}>⬡</div>
          <p style={{ margin:'0 0 4px', fontFamily:'var(--font-head)', fontSize:15, fontWeight:700, color:'var(--neon)', textShadow:'0 0 12px rgba(0,255,200,0.4)' }}>ALL SYSTEMS CLEAR</p>
          <p style={{ margin:0, fontSize:11, color:'var(--text-3)' }}>No threats detected across all accounts</p>
        </div>
      )}

      {/* Security tips */}
      <div className="ag-card" style={{ padding:'13px 16px', marginTop:8 }}>
        <p style={{ margin:'0 0 8px', fontSize:9, fontFamily:'var(--font-mono)', color:'var(--text-3)', letterSpacing:.08 }}>// SECURITY_PROTOCOLS</p>
        {['Never share OTP with anyone — not even bank staff.','Use UPI PIN only on trusted, official apps.','Enable transaction SMS alerts for instant monitoring.'].map((tip,i)=>(
          <div key={i} style={{ display:'flex', gap:8, alignItems:'flex-start', marginBottom:i<2?6:0 }}>
            <span style={{ color:'var(--neon)', fontSize:10, flexShrink:0, marginTop:1 }}>▷</span>
            <p style={{ margin:0, fontSize:11, color:'var(--text-3)', lineHeight:1.5 }}>{tip}</p>
          </div>
        ))}
      </div>
    </div>
  );
});

export default FraudPanel;
