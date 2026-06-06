import React, { useState, useEffect, useCallback, memo } from 'react';
import api from '../utils/api';

const fmt = n => {
  const num = parseFloat(n);
  return isNaN(num) ? '0' : num.toLocaleString('en-IN', { minimumFractionDigits: 0 });
};

const CAT_COLOR = { Shopping:'var(--purple)', Bills:'var(--gold)', Health:'#22d3ee', Mobile:'#a78bfa', Food:'#fb923c', Transport:'#34d399', Housing:'#f472b6', Entertainment:'#c084fc' };
const CAT_ICON  = { Shopping:'◈', Bills:'◇', Health:'✦', Mobile:'◉', Food:'◆', Transport:'▷', Housing:'⬡', Entertainment:'◎' };

// ── Budget Bar ────────────────────────────────────────────────────────────────
const BudgetBar = memo(({ b }) => {
  // Defensive: guard all fields
  if (!b) return null;
  const spent  = parseFloat(b.spent  ?? 0) || 0;
  const limit  = parseFloat(b.limit  ?? 1) || 1;
  const pct    = Math.min(100, (spent / limit) * 100);
  const left   = limit - spent;
  const over   = spent > limit;
  const color  = over ? '#f43f5e' : pct >= 85 ? 'var(--gold)' : 'var(--neon)';
  const glow   = over ? '0 0 8px rgba(244,63,94,0.4)' : pct >= 85 ? '0 0 8px rgba(245,200,66,0.4)' : '0 0 8px rgba(0,255,200,0.3)';
  const cColor = CAT_COLOR[b.category] || 'var(--text-2)';
  const cIcon  = CAT_ICON[b.category]  || '◦';
  return (
    <div className="ag-card" style={{ padding:'12px 14px', marginBottom:8, transition:'border-color .2s' }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(0,255,200,0.2)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-x)'}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ width:28, height:28, borderRadius:7, background:`${cColor}12`, border:`1px solid ${cColor}30`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, color:cColor }}>
            {cIcon}
          </div>
          <div>
            <p style={{ margin:0, fontSize:12, fontWeight:600, color:'var(--text-1)' }}>{b.category || 'Unknown'}</p>
            {(over || pct >= 90) && (
              <span className={`tag-x ${over ? 'tag-red' : 'tag-gold'}`} style={{ fontSize:8 }}>
                {over ? 'OVER BUDGET' : 'NEAR LIMIT'}
              </span>
            )}
          </div>
        </div>
        <div style={{ textAlign:'right' }}>
          <p className="mono" style={{ margin:'0 0 2px', fontSize:12, fontWeight:600, color:'var(--text-1)' }}>
            ₹{fmt(spent)} / ₹{fmt(limit)}
          </p>
          <p style={{ margin:0, fontSize:9, fontFamily:'var(--font-mono)', color:over ? '#f43f5e' : 'var(--text-3)' }}>
            {over ? `₹${fmt(Math.abs(left))} OVER` : `₹${fmt(left)} LEFT`}
          </p>
        </div>
      </div>
      <div style={{ height:5, background:'rgba(255,255,255,0.04)', borderRadius:3, overflow:'hidden', position:'relative' }}>
        <div style={{ height:'100%', width:`${pct}%`, background:color, borderRadius:3, boxShadow:glow, transition:'width 1.2s cubic-bezier(.22,1,.36,1)' }}/>
        <div style={{ position:'absolute', top:0, left:0, width:`${pct}%`, height:'100%', background:'linear-gradient(90deg, transparent 60%, rgba(255,255,255,0.1) 100%)' }}/>
      </div>
    </div>
  );
});

// ── Goal Card ─────────────────────────────────────────────────────────────────
// FIX #1: prop was passed as `goal` but destructured as `g` → TypeError on g.saved
// Now correctly destructures `goal` and aliases it `g` for internal use.
const GoalCard = memo(({ goal: g, onTopUp }) => {
  // Defensive: guard undefined goal object and fields
  if (!g) return null;
  const saved  = parseFloat(g.saved  ?? 0) || 0;
  const target = parseFloat(g.target ?? 1) || 1;
  const pct    = Math.min(100, (saved / target) * 100);
  const done   = pct >= 100;
  return (
    <div className="ag-card"
      style={{ padding:'13px 15px', marginBottom:8, borderColor:done ? 'rgba(0,255,200,0.3)' : 'var(--border-x)', transition:'border-color .2s' }}
      onMouseEnter={e => e.currentTarget.style.borderColor = done ? 'rgba(0,255,200,0.5)' : 'rgba(0,255,200,0.2)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = done ? 'rgba(0,255,200,0.3)' : 'var(--border-x)'}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:2 }}>
            <span style={{ fontSize:18 }}>{g.emoji || '🎯'}</span>
            <span style={{ fontSize:13, fontWeight:600, color:'var(--text-1)' }}>{g.name || 'Unnamed Goal'}</span>
            {done && <span className="tag-x tag-neon" style={{ fontSize:8 }}>COMPLETE ✓</span>}
          </div>
          {g.deadline && (
            <p style={{ margin:0, fontSize:9, fontFamily:'var(--font-mono)', color:'var(--text-3)' }}>
              DEADLINE: {g.deadline}
            </p>
          )}
        </div>
        <div style={{ textAlign:'right' }}>
          <p className="mono" style={{ margin:'0 0 2px', fontSize:16, fontWeight:700, color:done ? 'var(--neon)' : 'var(--gold)', textShadow:done ? '0 0 10px rgba(0,255,200,0.4)' : '0 0 10px rgba(245,200,66,0.3)' }}>
            {Math.round(pct)}%
          </p>
          <p style={{ margin:0, fontSize:9, fontFamily:'var(--font-mono)', color:'var(--text-3)' }}>
            ₹{fmt(saved)} / ₹{fmt(target)}
          </p>
        </div>
      </div>
      <div style={{ height:5, background:'rgba(255,255,255,0.04)', borderRadius:3, overflow:'hidden', marginBottom:done ? 0 : 10, position:'relative' }}>
        <div style={{ height:'100%', width:`${pct}%`, background:done ? 'linear-gradient(90deg,var(--neon2),var(--neon))' : 'linear-gradient(90deg,#d4a01a,var(--gold2))', borderRadius:3, boxShadow:done ? '0 0 8px rgba(0,255,200,0.5)' : '0 0 8px rgba(245,200,66,0.4)', transition:'width 1.3s cubic-bezier(.22,1,.36,1)' }}/>
      </div>
      {!done && (
        <button
          onClick={() => onTopUp && onTopUp(g)}
          style={{ width:'100%', padding:'7px', borderRadius:7, border:'1px solid var(--border-x)', background:'transparent', color:'var(--text-3)', fontSize:10, cursor:'pointer', fontFamily:'var(--font-mono)', fontWeight:600, letterSpacing:.05, transition:'all .15s' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor='var(--neon)'; e.currentTarget.style.color='var(--neon)'; e.currentTarget.style.background='var(--neon-dim)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border-x)'; e.currentTarget.style.color='var(--text-3)'; e.currentTarget.style.background='transparent'; }}>
          + ADD FUNDS →
        </button>
      )}
    </div>
  );
});

// ── Top-Up Modal ──────────────────────────────────────────────────────────────
const TopUpModal = memo(({ goal, onClose, onDone }) => {
  const [amount, setAmount]   = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  if (!goal) return null; // defensive guard

  const submit = async () => {
    setError('');
    const n = parseFloat(amount);
    if (!n || n <= 0) { setError('Enter a valid positive amount.'); return; }
    setLoading(true);
    try {
      await api.patch(`/banking/goals/${goal.id}`, { amount: n });
      onDone?.();
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to update goal.');
    } finally {
      setLoading(false);
      onClose?.();
    }
  };

  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,5,16,0.85)', zIndex:100, display:'flex', alignItems:'center', justifyContent:'center', padding:16, backdropFilter:'blur(8px)' }}>
      <div onClick={e => e.stopPropagation()} className="ag-card" style={{ width:'100%', maxWidth:320, borderRadius:18, padding:'22px 20px' }}>
        <p style={{ margin:'0 0 4px', fontFamily:'var(--font-head)', fontSize:15, fontWeight:700, color:'var(--text-1)' }}>
          {goal.emoji || '🎯'} {goal.name || 'Goal'}
        </p>
        <p style={{ margin:'0 0 16px', fontSize:10, fontFamily:'var(--font-mono)', color:'var(--text-3)' }}>
          CURRENT: ₹{fmt(goal.saved ?? 0)} / ₹{fmt(goal.target ?? 0)}
        </p>
        {error && (
          <p style={{ margin:'0 0 10px', fontSize:10, color:'#f43f5e', fontFamily:'var(--font-mono)' }}>⚠ {error}</p>
        )}
        <label style={{ display:'block', fontSize:9, fontFamily:'var(--font-mono)', color:'var(--text-3)', letterSpacing:.09, marginBottom:7, textTransform:'uppercase' }}>
          AMOUNT TO ADD (₹)
        </label>
        <input
          type="number" value={amount} onChange={e => setAmount(e.target.value)}
          placeholder="Enter amount" className="inp-x" style={{ marginBottom:14 }} autoFocus
          onKeyDown={e => e.key === 'Enter' && submit()}
        />
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={onClose} className="btn-x" style={{ flex:1 }}>CANCEL</button>
          <button
            onClick={submit} disabled={loading}
            style={{ flex:2, padding:'10px', borderRadius:8, border:'1px solid var(--neon)', background:'rgba(0,255,200,0.12)', color:'var(--neon)', fontSize:12, fontWeight:700, cursor:loading ? 'not-allowed' : 'pointer', fontFamily:'var(--font-mono)', letterSpacing:.05 }}>
            {loading ? 'SAVING…' : 'CONFIRM +'}
          </button>
        </div>
      </div>
    </div>
  );
});

// ── Empty States ──────────────────────────────────────────────────────────────
const EmptyState = ({ icon, text }) => (
  <div style={{ textAlign:'center', padding:'32px 16px', color:'var(--text-3)' }}>
    <div style={{ fontSize:28, marginBottom:10, opacity:.4 }}>{icon}</div>
    <p style={{ margin:0, fontSize:11, fontFamily:'var(--font-mono)' }}>{text}</p>
  </div>
);

// ── Skeleton Loader ───────────────────────────────────────────────────────────
const Skeleton = () => (
  <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
    {[...Array(4)].map((_, i) => (
      <div key={i} className="ag-card" style={{ height:65, background:'linear-gradient(90deg,rgba(0,255,200,0.02),rgba(0,255,200,0.04),rgba(0,255,200,0.02))', backgroundSize:'200%', animation:'shimmer 1.5s infinite' }}/>
    ))}
  </div>
);

// ── Main Panel ────────────────────────────────────────────────────────────────
const BudgetGoalsPanel = memo(() => {
  const [budgets,    setBudgets]    = useState([]);
  const [goals,      setGoals]      = useState([]);
  const [tab,        setTab]        = useState('budgets');
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [topUpGoal,  setTopUpGoal]  = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [b, g] = await Promise.all([
        api.get('/banking/budgets'),
        api.get('/banking/goals'),
      ]);
      // Defensive: validate response shape before setting state
      setBudgets(Array.isArray(b?.data?.data?.budgets) ? b.data.data.budgets : []);
      setGoals(Array.isArray(g?.data?.data?.goals)     ? g.data.data.goals   : []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load data. Please retry.');
      setBudgets([]);
      setGoals([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <Skeleton />;

  if (error) return (
    <div className="ag-card" style={{ padding:'16px', textAlign:'center' }}>
      <p style={{ margin:'0 0 10px', fontSize:12, color:'#f43f5e', fontFamily:'var(--font-mono)' }}>⚠ {error}</p>
      <button onClick={load} className="btn-x" style={{ fontSize:10 }}>RETRY ↻</button>
    </div>
  );

  // Safe aggregations with fallbacks
  const totalBudget = budgets.reduce((s, b) => s + (parseFloat(b?.limit  ?? 0) || 0), 0);
  const totalSpent  = budgets.reduce((s, b) => s + (parseFloat(b?.spent  ?? 0) || 0), 0);
  const overCount   = budgets.filter(b => (b?.spent ?? 0) > (b?.limit ?? 0)).length;
  const totalSaved  = goals.reduce((s, g) => s + (parseFloat(g?.saved  ?? 0) || 0), 0);
  const totalTarget = goals.reduce((s, g) => s + (parseFloat(g?.target ?? 0) || 0), 0);
  const goalsPct    = totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0;

  return (
    <div>
      {/* Tabs */}
      <div style={{ display:'flex', gap:4, marginBottom:14, background:'rgba(0,255,200,0.03)', padding:3, borderRadius:10, border:'1px solid var(--border-x)' }}>
        {[{ id:'budgets', icon:'◎', label:'BUDGETS' }, { id:'goals', icon:'▲', label:'GOALS' }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ flex:1, padding:'8px', borderRadius:8, border:tab===t.id ? '1px solid rgba(0,255,200,0.25)' : '1px solid transparent', background:tab===t.id ? 'rgba(0,255,200,0.1)' : 'transparent', color:tab===t.id ? 'var(--neon)' : 'var(--text-3)', fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:'var(--font-mono)', letterSpacing:.06, transition:'all .15s', display:'flex', alignItems:'center', justifyContent:'center', gap:6, boxShadow:tab===t.id ? '0 0 12px rgba(0,255,200,0.1)' : 'none' }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ── BUDGETS TAB ── */}
      {tab === 'budgets' && (
        <>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:12 }}>
            {[
              { label:'BUDGETED', val:`₹${(totalBudget / 1000).toFixed(0)}k`,              color:'var(--neon)' },
              { label:'SPENT',    val:`₹${(totalSpent  / 1000).toFixed(0)}k`,              color:overCount > 0 ? '#f43f5e' : 'var(--text-1)' },
              { label:'OVER',     val:`${overCount} CAT${overCount !== 1 ? 'S' : ''}`,     color:overCount > 0 ? '#f43f5e' : 'var(--text-3)' },
            ].map(k => (
              <div key={k.label} className="ag-card" style={{ padding:'10px 12px', textAlign:'center' }}>
                <p style={{ margin:'0 0 3px', fontSize:9, fontFamily:'var(--font-mono)', color:'var(--text-3)', letterSpacing:.07 }}>{k.label}</p>
                <p className="mono" style={{ margin:0, fontSize:15, fontWeight:700, color:k.color }}>{k.val}</p>
              </div>
            ))}
          </div>
          {overCount > 0 && (
            <div className="ag-card" style={{ padding:'9px 13px', marginBottom:10, borderColor:'rgba(244,63,94,0.3)', background:'rgba(244,63,94,0.06)', fontSize:11, color:'#f43f5e', display:'flex', gap:7, alignItems:'center' }}>
              <span>⬡</span>
              {overCount} categor{overCount > 1 ? 'ies' : 'y'} exceeding budget limit this month
            </div>
          )}
          {budgets.length === 0
            ? <EmptyState icon="◎" text="NO BUDGETS CONFIGURED" />
            : budgets.map(b => b ? <BudgetBar key={b.id || Math.random()} b={b} /> : null)
          }
        </>
      )}

      {/* ── GOALS TAB ── */}
      {tab === 'goals' && (
        <>
          <div className="ag-card" style={{ padding:'14px 18px', marginBottom:12, background:'linear-gradient(135deg,rgba(10,22,40,0.97),rgba(6,13,30,0.99))' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
              <div>
                <p style={{ margin:'0 0 2px', fontSize:9, fontFamily:'var(--font-mono)', color:'var(--text-3)', letterSpacing:.08 }}>// TOTAL SAVINGS PROGRESS</p>
                <p className="mono" style={{ margin:0, fontSize:20, fontWeight:700, color:'var(--neon)', textShadow:'0 0 16px rgba(0,255,200,0.4)' }}>₹{fmt(totalSaved)}</p>
              </div>
              <div style={{ textAlign:'right' }}>
                <p style={{ margin:'0 0 2px', fontSize:9, fontFamily:'var(--font-mono)', color:'var(--text-3)' }}>TARGET</p>
                <p className="mono" style={{ margin:0, fontSize:13, color:'var(--gold)' }}>₹{fmt(totalTarget)}</p>
              </div>
            </div>
            <div style={{ height:6, background:'rgba(255,255,255,0.04)', borderRadius:3, overflow:'hidden' }}>
              <div style={{ height:'100%', width:`${goalsPct}%`, background:'linear-gradient(90deg,var(--neon2),var(--neon))', borderRadius:3, boxShadow:'0 0 10px rgba(0,255,200,0.5)', transition:'width 1.5s ease' }}/>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', marginTop:5 }}>
              <span style={{ fontSize:9, fontFamily:'var(--font-mono)', color:'var(--neon)' }}>{goalsPct}% of total target reached</span>
              <span style={{ fontSize:9, fontFamily:'var(--font-mono)', color:'var(--text-3)' }}>
                {goals.filter(g => (g?.saved ?? 0) >= (g?.target ?? 1)).length}/{goals.length} COMPLETE
              </span>
            </div>
          </div>
          {goals.length === 0
            ? <EmptyState icon="▲" text="NO SAVINGS GOALS YET" />
            : goals.map(g => g ? <GoalCard key={g.id || Math.random()} goal={g} onTopUp={setTopUpGoal} /> : null)
          }
        </>
      )}

      {topUpGoal && (
        <TopUpModal
          goal={topUpGoal}
          onClose={() => setTopUpGoal(null)}
          onDone={() => { setTopUpGoal(null); load(); }}
        />
      )}
    </div>
  );
});

export default BudgetGoalsPanel;
