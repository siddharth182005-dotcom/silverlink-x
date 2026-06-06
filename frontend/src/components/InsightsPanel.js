import React, { useState, useEffect, useCallback, memo } from 'react';
import api from '../utils/api';

const PCFG = {
  urgent:  { border:'rgba(244,63,94,0.3)', bg:'rgba(244,63,94,0.06)', color:'#f43f5e', label:'URGENT',   icon:'⬡', glow:'rgba(244,63,94,0.3)' },
  high:    { border:'rgba(245,200,66,0.3)', bg:'rgba(245,200,66,0.05)', color:'var(--gold)', label:'HIGH', icon:'◈', glow:'rgba(245,200,66,0.3)' },
  medium:  { border:'rgba(59,130,246,0.3)', bg:'rgba(59,130,246,0.05)', color:'var(--blue-x)', label:'MEDIUM', icon:'◎', glow:'rgba(59,130,246,0.3)' },
  positive:{ border:'rgba(0,255,200,0.25)', bg:'rgba(0,255,200,0.04)', color:'var(--neon)', label:'POSITIVE', icon:'✦', glow:'rgba(0,255,200,0.3)' },
  low:     { border:'var(--border-x)', bg:'transparent', color:'var(--text-3)', label:'INFO', icon:'▷', glow:'none' },
};
const TYPE_ICON = { saving:'💡', alert:'⬡', goal:'▲', fraud:'⚠', default:'✦' };

const InsightCard = memo(({ insight, index }) => {
  const cfg = PCFG[insight.priority] || PCFG.low;
  return (
    <div className="ag-card" style={{ padding:'13px 15px', marginBottom:8, borderColor:cfg.border, background:cfg.bg, animation:`fadeSlideUp .3s ease ${index*0.05}s both`, transition:'border-color .2s, background .2s' }}
      onMouseEnter={e=>{e.currentTarget.style.borderColor=`rgba(0,255,200,0.2)`;}}
      onMouseLeave={e=>{e.currentTarget.style.borderColor=cfg.border;}}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:8, marginBottom:7 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ width:28, height:28, borderRadius:7, background:`${cfg.glow.replace('0.3','0.1')}`, border:`1px solid ${cfg.border}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, color:cfg.color, boxShadow:`0 0 8px ${cfg.glow}` }}>
            {TYPE_ICON[insight.type]||TYPE_ICON.default}
          </div>
          <p style={{ margin:0, fontSize:12, fontWeight:700, color:'var(--text-1)', letterSpacing:'.01em' }}>{insight.title}</p>
        </div>
        <span className={`tag-x ${insight.priority==='urgent'?'tag-red':insight.priority==='positive'?'tag-neon':insight.priority==='medium'?'tag-blue':'tag-gold'}`} style={{ flexShrink:0, fontSize:8 }}>
          {cfg.icon} {cfg.label}
        </span>
      </div>
      <p style={{ margin:'0 0 8px', fontSize:11, color:'var(--text-2)', lineHeight:1.6 }}>{insight.body}</p>
      {insight.action && (
        <button style={{ padding:'5px 12px', borderRadius:6, border:`1px solid ${cfg.border}`, background:`${cfg.glow.replace('0.3','0.06')}`, color:cfg.color, fontSize:10, fontWeight:700, cursor:'pointer', fontFamily:'var(--font-mono)', letterSpacing:.05, transition:'all .15s' }}
          onMouseEnter={e=>{e.currentTarget.style.background=`${cfg.glow.replace('0.3','0.12')}`;}}
          onMouseLeave={e=>{e.currentTarget.style.background=`${cfg.glow.replace('0.3','0.06')}`;}}>
          {insight.action} →
        </button>
      )}
    </div>
  );
});

const InsightsPanel = memo(() => {
  const [insights, setInsights] = useState([]);
  const [loading,  setLoading]  = useState(true);

  const load = useCallback(async () => {
    try { const r = await api.get('/banking/insights'); if(r.data.success) setInsights(r.data.data.insights); }
    catch {} finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  if (loading) return (
    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
      {[...Array(3)].map((_,i)=>(
        <div key={i} className="ag-card" style={{ height:85, background:'linear-gradient(90deg,rgba(168,85,247,0.02),rgba(168,85,247,0.05),rgba(168,85,247,0.02))', backgroundSize:'200%', animation:'shimmer 1.5s infinite' }}/>
      ))}
    </div>
  );

  const urgent = insights.filter(i=>i.priority==='urgent');
  const rest   = insights.filter(i=>i.priority!=='urgent');

  return (
    <div>
      {/* Header */}
      <div className="ag-card" style={{ padding:'14px 18px', marginBottom:14, background:'linear-gradient(135deg,rgba(10,22,40,0.97),rgba(6,13,30,0.99))' }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ width:40, height:40, borderRadius:10, background:'rgba(168,85,247,0.1)', border:'1px solid rgba(168,85,247,0.3)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, boxShadow:'0 0 12px rgba(168,85,247,0.2)', flexShrink:0 }}>🤖</div>
          <div>
            <p style={{ margin:'0 0 2px', fontSize:13, fontWeight:700, color:'var(--text-1)', fontFamily:'var(--font-head)', letterSpacing:'.03em' }}>AUTONOMOUS AGENT</p>
            <p style={{ margin:0, fontSize:10, fontFamily:'var(--font-mono)', color:'var(--text-3)' }}>Analysed 90-day window · {insights.length} insight{insights.length!==1?'s':''} generated</p>
          </div>
          <div style={{ marginLeft:'auto', textAlign:'right' }}>
            <div style={{ width:8, height:8, borderRadius:'50%', background:'var(--neon)', boxShadow:'0 0 6px rgba(0,255,200,0.8)', animation:'pulseNeon 1.5s infinite', marginLeft:'auto', marginBottom:4 }}/>
            <span style={{ fontSize:9, fontFamily:'var(--font-mono)', color:'var(--text-3)' }}>LIVE</span>
          </div>
        </div>
        {/* Metric summary */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginTop:14 }}>
          {[
            { label:'URGENT', val:urgent.length, color:'#f43f5e' },
            { label:'INSIGHTS', val:insights.length, color:'var(--purple)' },
            { label:'POSITIVE', val:insights.filter(i=>i.priority==='positive').length, color:'var(--neon)' },
          ].map(k=>(
            <div key={k.label} style={{ textAlign:'center', background:`${k.color}08`, border:`1px solid ${k.color}22`, borderRadius:8, padding:'8px' }}>
              <p className="mono" style={{ margin:'0 0 2px', fontSize:18, fontWeight:700, color:k.color, textShadow:`0 0 10px ${k.color}44` }}>{k.val}</p>
              <p style={{ margin:0, fontSize:9, fontFamily:'var(--font-mono)', color:'var(--text-3)', letterSpacing:.06 }}>{k.label}</p>
            </div>
          ))}
        </div>
      </div>

      {urgent.length>0 && (
        <>
          <p style={{ margin:'0 0 8px', fontSize:9, fontFamily:'var(--font-mono)', color:'#f43f5e', letterSpacing:.1 }}>// ACTION_REQUIRED</p>
          {urgent.map((i,idx) => <InsightCard key={i.id} insight={i} index={idx}/>)}
          <div style={{ height:1, background:'linear-gradient(90deg, transparent, var(--border-x), transparent)', margin:'14px 0' }}/>
        </>
      )}

      {rest.length>0 && (
        <>
          <p style={{ margin:'0 0 8px', fontSize:9, fontFamily:'var(--font-mono)', color:'var(--text-3)', letterSpacing:.1 }}>// RECOMMENDATIONS</p>
          {rest.map((i,idx) => <InsightCard key={i.id} insight={i} index={idx}/>)}
        </>
      )}

      {insights.length===0 && (
        <div className="ag-card" style={{ padding:'30px 20px', textAlign:'center' }}>
          <div style={{ fontSize:32, marginBottom:10, animation:'floatUp 2.5s ease-in-out infinite' }}>✦</div>
          <p style={{ margin:'0 0 4px', fontFamily:'var(--font-head)', fontSize:14, fontWeight:700, color:'var(--neon)', textShadow:'0 0 12px rgba(0,255,200,0.4)' }}>ALL_CLEAR</p>
          <p style={{ margin:0, fontSize:10, fontFamily:'var(--font-mono)', color:'var(--text-3)' }}>No action items at this time</p>
        </div>
      )}

      <p style={{ margin:'14px 0 0', fontSize:9, fontFamily:'var(--font-mono)', color:'var(--text-3)', textAlign:'center' }}>
        ◈ AI AGENTS UPDATE EVERY 24H · BASED ON TRANSACTION PATTERNS
      </p>
    </div>
  );
});

export default InsightsPanel;
