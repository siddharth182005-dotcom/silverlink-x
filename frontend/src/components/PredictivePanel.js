import React, { useState, useEffect, useCallback, memo, useRef } from 'react';
import api from '../utils/api';

const SparkBar = memo(({ label, value, max, color, glow }) => {
  const pct = Math.min(100, (value/max)*100);
  return (
    <div style={{ marginBottom:12 }}>
      <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, marginBottom:5 }}>
        <span style={{ color:'var(--text-2)', fontFamily:'var(--font-mono)', fontSize:10, letterSpacing:.05 }}>{label}</span>
        <span className="mono" style={{ color:'var(--text-1)', fontWeight:600 }}>₹{value.toLocaleString('en-IN')}</span>
      </div>
      <div style={{ height:5, background:'rgba(255,255,255,0.04)', borderRadius:3, overflow:'hidden', position:'relative' }}>
        <div style={{ height:'100%', width:`${pct}%`, background:color, borderRadius:3, boxShadow:glow, transition:'width 1.3s cubic-bezier(.22,1,.36,1)' }}/>
        <div style={{ position:'absolute', top:0, left:0, width:`${pct}%`, height:'100%', background:'linear-gradient(90deg, transparent 60%, rgba(255,255,255,0.15) 100%)', borderRadius:3 }}/>
      </div>
    </div>
  );
});

// Mini wave canvas for forecast tab
const WaveCanvas = memo(({ data }) => {
  const ref = useRef(null);
  useEffect(() => {
    const c = ref.current; if (!c || !data) return;
    c.width = c.offsetWidth*2; c.height = c.offsetHeight*2;
    const W=c.width, H=c.height;
    const ctx = c.getContext('2d');
    const vals = data.map(d => d.savings);
    const max  = Math.max(...vals)*1.2;
    const pts  = vals.map((v,i) => ({ x: (i/(vals.length-1))*W, y: H - (v/max)*H*.8 - H*.1 }));

    // Income area
    const incPts = data.map((d,i) => ({ x:(i/(data.length-1))*W, y:H-(d.income/Math.max(...data.map(x=>x.income))*1.1)*H*.8-H*.1 }));
    ctx.beginPath();
    ctx.moveTo(incPts[0].x, H);
    incPts.forEach(p => ctx.lineTo(p.x, p.y));
    ctx.lineTo(incPts[incPts.length-1].x, H);
    const gI = ctx.createLinearGradient(0,0,0,H);
    gI.addColorStop(0,'rgba(0,255,200,0.12)'); gI.addColorStop(1,'transparent');
    ctx.fillStyle=gI; ctx.fill();

    // Savings line
    ctx.beginPath(); pts.forEach((p,i) => i===0?ctx.moveTo(p.x,p.y):ctx.lineTo(p.x,p.y));
    ctx.strokeStyle='rgba(245,200,66,0.8)'; ctx.lineWidth=2; ctx.shadowColor='rgba(245,200,66,0.5)'; ctx.shadowBlur=6; ctx.stroke(); ctx.shadowBlur=0;

    // Dots
    pts.forEach(p => {
      ctx.beginPath(); ctx.arc(p.x,p.y,4,0,Math.PI*2);
      ctx.fillStyle='#f5c842'; ctx.shadowColor='rgba(245,200,66,0.8)'; ctx.shadowBlur=8; ctx.fill(); ctx.shadowBlur=0;
    });
  }, [data]);
  return <canvas ref={ref} style={{ width:'100%', height:70, display:'block' }}/>;
});

const PredictivePanel = memo(() => {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try { const r = await api.get('/banking/predict/cashflow'); if (r.data.success) setData(r.data.data); }
    catch {} finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  if (loading) return (
    <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
      {[...Array(3)].map((_,i)=>(
        <div key={i} className="ag-card" style={{ height:80, background:'linear-gradient(90deg,rgba(0,255,200,0.02),rgba(0,255,200,0.05),rgba(0,255,200,0.02))', backgroundSize:'200%', animation:'shimmer 1.5s infinite' }}/>
      ))}
    </div>
  );
  if (!data) return null;

  const maxVal = Math.max(data.nextMonthIncome, data.nextMonthExpenses, data.nextMonthSavings)*1.2;
  const riskColor = data.riskLevel==='low'?'var(--neon)':data.riskLevel==='medium'?'var(--gold)':'#f43f5e';
  const riskGlow  = data.riskLevel==='low'?'0 0 8px rgba(0,255,200,0.5)':data.riskLevel==='medium'?'0 0 8px rgba(245,200,66,0.5)':'0 0 8px rgba(244,63,94,0.5)';

  return (
    <div>
      {/* Hero */}
      <div className="ag-card" style={{ padding:'18px 20px', marginBottom:12, overflow:'hidden', position:'relative' }}>
        <div style={{ position:'absolute', top:0, right:0, width:160, height:160, borderRadius:'50%', background:'radial-gradient(circle, rgba(0,255,200,0.04) 0%, transparent 70%)', transform:'translate(30%,-30%)' }}/>
        <p style={{ margin:'0 0 2px', fontSize:9, fontFamily:'var(--font-mono)', color:'var(--text-3)', letterSpacing:.1 }}>// 90_DAY_FORECAST</p>
        <p style={{ margin:'0 0 12px', fontSize:12, color:'var(--text-2)', lineHeight:1.55 }}>{data.insight}</p>

        {/* Wave chart */}
        {data.forecast && (
          <div style={{ marginBottom:14, borderRadius:8, overflow:'hidden', background:'rgba(0,255,200,0.02)', border:'1px solid var(--border-2)', padding:'8px 4px 4px' }}>
            <WaveCanvas data={data.forecast}/>
            <div style={{ display:'flex', justifyContent:'space-around', padding:'4px 0 2px' }}>
              {data.forecast.map((f,i) => <span key={i} style={{ fontSize:9, fontFamily:'var(--font-mono)', color:'var(--text-3)', textAlign:'center' }}>{f.month.split(' ')[0].toUpperCase()}</span>)}
            </div>
          </div>
        )}

        {/* KPI row */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
          {[
            { label:'INCOME',   val:data.nextMonthIncome,   color:'var(--neon)',   glow:'rgba(0,255,200,0.3)'  },
            { label:'EXPENSES', val:data.nextMonthExpenses, color:'#f43f5e',       glow:'rgba(244,63,94,0.3)'  },
            { label:'SAVINGS',  val:data.nextMonthSavings,  color:'var(--gold)',   glow:'rgba(245,200,66,0.3)' },
          ].map(k => (
            <div key={k.label} style={{ background:`${k.glow.replace('0.3','0.06')}`, border:`1px solid ${k.glow.replace('0.3','0.2')}`, borderRadius:10, padding:'10px 8px', textAlign:'center' }}>
              <p style={{ margin:'0 0 3px', fontSize:9, fontFamily:'var(--font-mono)', color:'rgba(255,255,255,0.35)', letterSpacing:.06 }}>{k.label}</p>
              <p className="mono" style={{ margin:0, fontSize:14, fontWeight:700, color:k.color, textShadow:`0 0 12px ${k.glow}` }}>
                ₹{(k.val/1000).toFixed(0)}k
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Risk indicator */}
      <div className="ag-card" style={{ padding:'12px 16px', marginBottom:12, borderColor:`${riskColor}33`, background:`${riskColor}06`, display:'flex', alignItems:'center', gap:12 }}>
        <span style={{ fontSize:20, animation:'pulseNeon 2s infinite' }}>{data.riskLevel==='low'?'◉':data.riskLevel==='medium'?'◎':'⬡'}</span>
        <div>
          <p style={{ margin:'0 0 2px', fontSize:11, fontWeight:700, color:riskColor, fontFamily:'var(--font-mono)', textShadow:riskGlow, textTransform:'uppercase' }}>{data.riskLevel} FINANCIAL RISK</p>
          <p style={{ margin:0, fontSize:11, color:'var(--text-3)' }}>{data.lowBalanceAlert?'Low balance warning for next month':'Cash flow trajectory is healthy'}</p>
        </div>
      </div>

      {/* Breakdown bars */}
      <div className="ag-card" style={{ padding:'16px 18px', marginBottom:12 }}>
        <p style={{ margin:'0 0 12px', fontSize:9, fontFamily:'var(--font-mono)', color:'var(--text-3)', letterSpacing:.1 }}>// NEXT_MONTH_BREAKDOWN</p>
        <SparkBar label="EXPECTED_INCOME"   value={data.nextMonthIncome}   max={maxVal} color="linear-gradient(90deg,var(--neon2),var(--neon))"  glow="0 0 6px rgba(0,255,200,0.4)"/>
        <SparkBar label="EXPECTED_EXPENSES" value={data.nextMonthExpenses} max={maxVal} color="linear-gradient(90deg,#c41e3a,#f43f5e)"            glow="0 0 6px rgba(244,63,94,0.4)"/>
        <SparkBar label="PROJECTED_SAVINGS" value={data.nextMonthSavings}  max={maxVal} color="linear-gradient(90deg,#d4a01a,var(--gold2))"       glow="0 0 6px rgba(245,200,66,0.4)"/>
      </div>

      {/* 90-day table */}
      <div className="ag-card" style={{ overflow:'hidden' }}>
        <div style={{ display:'grid', gridTemplateColumns:'1.5fr 1fr 1fr 1fr', padding:'8px 14px', borderBottom:'1px solid var(--border-2)', background:'rgba(0,255,200,0.03)' }}>
          {['MONTH','INCOME','EXPENSES','SAVINGS'].map(h=>(
            <span key={h} style={{ fontSize:9, fontFamily:'var(--font-mono)', color:'var(--text-3)', letterSpacing:.07 }}>{h}</span>
          ))}
        </div>
        {data.forecast?.map((row,i)=>(
          <div key={i} style={{ display:'grid', gridTemplateColumns:'1.5fr 1fr 1fr 1fr', padding:'10px 14px', borderBottom:i<data.forecast.length-1?'1px solid var(--border-2)':'none', background:i===0?'rgba(245,200,66,0.04)':'transparent', transition:'background .15s' }}
            onMouseEnter={e=>e.currentTarget.style.background='rgba(0,255,200,0.03)'}
            onMouseLeave={e=>e.currentTarget.style.background=i===0?'rgba(245,200,66,0.04)':'transparent'}>
            <span style={{ fontSize:11, color:i===0?'var(--gold)':'var(--text-2)', fontWeight:i===0?600:400, display:'flex', alignItems:'center', gap:4 }}>
              {row.month.split(' ')[0]} {i===0&&<span style={{ fontSize:9, color:'var(--gold)', fontFamily:'var(--font-mono)' }}>▶NEXT</span>}
            </span>
            <span className="mono" style={{ fontSize:11, color:'var(--neon)' }}>₹{(row.income/1000).toFixed(0)}k</span>
            <span className="mono" style={{ fontSize:11, color:'#f43f5e' }}>₹{(row.expenses/1000).toFixed(0)}k</span>
            <span className="mono" style={{ fontSize:11, color:'var(--gold)', fontWeight:600 }}>₹{(row.savings/1000).toFixed(0)}k</span>
          </div>
        ))}
      </div>
      <p style={{ margin:'12px 0 0', fontSize:9, fontFamily:'var(--font-mono)', color:'var(--text-3)', textAlign:'center' }}>
        ◈ ML REGRESSION · 6-MONTH TRAINING WINDOW
      </p>
    </div>
  );
});

export default PredictivePanel;
