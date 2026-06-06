import React, { useState, useEffect, memo } from 'react';
import api from '../utils/api';

const FinancialHealthScore = memo(() => {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const compute = async () => {
      try {
        const [bal, txns, budgets, goals, fraud] = await Promise.allSettled([
          api.get('/banking/balance'),
          api.get('/banking/transactions?limit=20'),
          api.get('/banking/budgets'),
          api.get('/banking/goals'),
          api.get('/banking/fraud/alerts'),
        ]);

        const balance    = bal?.value?.data?.data?.balance        ?? 0;
        const allTxns    = txns?.value?.data?.data?.transactions  ?? [];
        const budgetList = budgets?.value?.data?.data?.budgets    ?? [];
        const goalList   = goals?.value?.data?.data?.goals        ?? [];
        const hasFraud   = (fraud?.value?.data?.data?.alerts ?? []).some(a => !a.resolved);

        const debits  = allTxns.filter(t => t.type === 'debit').reduce((s, t) => s + (t.amount || 0), 0);
        const credits = allTxns.filter(t => t.type === 'credit').reduce((s, t) => s + (t.amount || 0), 0);
        const savingsRate = credits > 0 ? Math.min(1, (credits - debits) / credits) : 0;

        const overBudget  = budgetList.filter(b => (b.spent ?? 0) > (b.limit ?? 0)).length;
        const budgetScore = budgetList.length > 0 ? Math.max(0, 1 - (overBudget / budgetList.length)) : 0.8;

        const goalsProgress = goalList.length > 0
          ? goalList.reduce((s, g) => s + Math.min(1, (g.saved || 0) / (g.target || 1)), 0) / goalList.length
          : 0.5;

        const balanceScore  = balance > 50000 ? 1 : balance > 10000 ? 0.7 : balance > 1000 ? 0.4 : 0.1;
        const fraudPenalty  = hasFraud ? -15 : 0;

        const raw = (
          savingsRate   * 25 +
          budgetScore   * 25 +
          goalsProgress * 20 +
          balanceScore  * 30
        );
        const score = Math.min(100, Math.max(0, Math.round(raw + fraudPenalty)));

        const grade  = score >= 85 ? 'EXCELLENT' : score >= 70 ? 'GOOD' : score >= 50 ? 'FAIR' : 'NEEDS WORK';
        const color  = score >= 85 ? 'var(--neon)' : score >= 70 ? '#22d3ee' : score >= 50 ? 'var(--gold)' : '#f43f5e';
        const factors = [
          { label:'Savings Rate',    score:Math.round(savingsRate * 100),   max:100 },
          { label:'Budget Control',  score:Math.round(budgetScore * 100),   max:100 },
          { label:'Goal Progress',   score:Math.round(goalsProgress * 100), max:100 },
          { label:'Balance Health',  score:Math.round(balanceScore * 100),  max:100 },
        ];

        setData({ score, grade, color, factors, hasFraud });
      } catch {
        setData({ score:72, grade:'GOOD', color:'#22d3ee', factors:[], hasFraud:false });
      } finally {
        setLoading(false);
      }
    };
    compute();
  }, []);

  if (loading) return (
    <div className="ag-card" style={{ height:110, background:'linear-gradient(90deg,rgba(0,255,200,0.02),rgba(0,255,200,0.04),rgba(0,255,200,0.02))', backgroundSize:'200%', animation:'shimmer 1.5s infinite' }}/>
  );
  if (!data) return null;

  const circumference = 2 * Math.PI * 34;
  const strokeDash    = (data.score / 100) * circumference;

  return (
    <div className="ag-card" style={{ padding:'16px', marginBottom:14, background:'linear-gradient(135deg,rgba(10,22,40,0.98),rgba(6,13,30,0.99))' }}>
      <div style={{ display:'flex', alignItems:'center', gap:14 }}>
        {/* Circular score gauge */}
        <div style={{ position:'relative', flexShrink:0 }}>
          <svg width="80" height="80" viewBox="0 0 80 80">
            <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="5"/>
            <circle cx="40" cy="40" r="34" fill="none" stroke={data.color} strokeWidth="5"
              strokeDasharray={`${strokeDash} ${circumference}`}
              strokeLinecap="round"
              transform="rotate(-90 40 40)"
              style={{ filter:`drop-shadow(0 0 6px ${data.color})`, transition:'stroke-dasharray 1.5s cubic-bezier(.22,1,.36,1)' }}
            />
          </svg>
          <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
            <span style={{ fontSize:20, fontWeight:800, color:data.color, fontFamily:'var(--font-mono)', lineHeight:1 }}>{data.score}</span>
            <span style={{ fontSize:7, color:'var(--text-3)', fontFamily:'var(--font-mono)', letterSpacing:.05 }}>/100</span>
          </div>
        </div>

        {/* Info */}
        <div style={{ flex:1 }}>
          <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:4 }}>
            <p style={{ margin:0, fontSize:9, fontFamily:'var(--font-mono)', color:'var(--text-3)', letterSpacing:.07 }}>// AI FINANCIAL HEALTH</p>
            <span className="tag-x" style={{ fontSize:8, color:data.color, borderColor:`${data.color}40`, background:`${data.color}10` }}>{data.grade}</span>
          </div>
          {data.hasFraud && (
            <p style={{ margin:'0 0 6px', fontSize:9, color:'#f43f5e', fontFamily:'var(--font-mono)' }}>⚠ Score reduced — unresolved fraud alert</p>
          )}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'3px 10px' }}>
            {data.factors.map(f => (
              <div key={f.label} style={{ display:'flex', alignItems:'center', gap:5 }}>
                <span style={{ fontSize:9, color:'var(--text-3)', fontFamily:'var(--font-mono)', minWidth:72 }}>{f.label}</span>
                <div style={{ flex:1, height:3, background:'rgba(255,255,255,0.05)', borderRadius:2, overflow:'hidden' }}>
                  <div style={{ height:'100%', width:`${f.score}%`, background:f.score >= 75 ? 'var(--neon)' : f.score >= 50 ? 'var(--gold)' : '#f43f5e', transition:'width 1.5s ease', borderRadius:2 }}/>
                </div>
                <span style={{ fontSize:9, color:'var(--text-2)', fontFamily:'var(--font-mono)', minWidth:22, textAlign:'right' }}>{f.score}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});

export default FinancialHealthScore;
