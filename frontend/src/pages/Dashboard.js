import React, { useState, useCallback, memo, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { SectionErrorBoundary } from '../App';
import BalanceCard         from '../components/BalanceCard';
import TransactionList     from '../components/TransactionList';
import ChatInterface       from '../components/ChatInterface';
import TransferModal       from '../components/TransferModal';
import FraudPanel          from '../components/FraudPanel';
import PredictivePanel     from '../components/PredictivePanel';
import BudgetGoalsPanel    from '../components/BudgetGoalsPanel';
import InsightsPanel       from '../components/InsightsPanel';
import FinancialHealthScore from '../components/FinancialHealthScore';

const TABS = [
  { id:'chat',     icon:'◉', label:'AI CHAT',  color:'var(--neon)'   },
  { id:'account',  icon:'◈', label:'ACCOUNT',  color:'var(--gold)'   },
  { id:'insights', icon:'✦', label:'INSIGHTS', color:'var(--purple)' },
  { id:'predict',  icon:'▲', label:'FORECAST', color:'var(--blue-x)' },
  { id:'budget',   icon:'◎', label:'BUDGET',   color:'var(--neon2)'  },
  { id:'fraud',    icon:'⬡', label:'SECURITY', color:'#f43f5e'       },
];

const BgOrbs = memo(() => (
  <div style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:0, overflow:'hidden' }}>
    <div style={{ position:'absolute', top:'10%',  left:'15%',  width:500, height:500, borderRadius:'50%', background:'radial-gradient(circle, rgba(0,255,200,0.025) 0%, transparent 65%)', animation:'floatUp 8s ease-in-out infinite' }}/>
    <div style={{ position:'absolute', top:'55%',  right:'10%', width:400, height:400, borderRadius:'50%', background:'radial-gradient(circle, rgba(168,85,247,0.02) 0%, transparent 65%)',  animation:'floatUp 11s ease-in-out infinite reverse' }}/>
    <div style={{ position:'absolute', bottom:'5%',left:'40%',  width:300, height:300, borderRadius:'50%', background:'radial-gradient(circle, rgba(245,200,66,0.015) 0%, transparent 65%)', animation:'floatUp 9s ease-in-out infinite' }}/>
  </div>
));

const HUD = memo(({ user, logout, sessionSecs, tab, urgentCount, humanAlert }) => {
  const mm = String(Math.floor(sessionSecs / 60)).padStart(2, '0');
  const ss = String(sessionSecs % 60).padStart(2, '0');
  const initials = user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2) || '??';
  return (
    <header style={{ position:'fixed', top:0, left:0, right:0, zIndex:20, height:50, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 16px', background:'rgba(0,5,16,0.85)', backdropFilter:'blur(16px)', borderBottom:'1px solid var(--border-x)' }}>
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        <div style={{ width:28, height:28, borderRadius:8, background:'rgba(0,255,200,0.1)', border:'1px solid rgba(0,255,200,0.3)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 0 10px rgba(0,255,200,0.2)' }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M12 2L4 7V12C4 16.5 7.5 20.7 12 22C16.5 20.7 20 16.5 20 12V7L12 2Z" stroke="#00ffc8" strokeWidth="1.2" fill="none"/><path d="M9 12L11 14L15 10" stroke="#00ffc8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
        <span style={{ fontFamily:'var(--font-head)', fontSize:15, fontWeight:800, color:'#fff', letterSpacing:'.04em' }}>
          SILVER<span style={{ color:'var(--neon)', textShadow:'0 0 10px rgba(0,255,200,0.4)' }}>LINK</span>
          <span style={{ fontSize:10, color:'var(--text-3)', marginLeft:4 }}>X</span>
        </span>
        <span style={{ fontSize:9, fontFamily:'var(--font-mono)', color:'var(--text-3)', padding:'2px 8px', border:'1px solid var(--border-x)', borderRadius:4 }}>
          {TABS.find(t => t.id === tab)?.label || '—'}
        </span>
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:12 }}>
        {humanAlert && <span className="tag-x tag-blue" style={{ animation:'pulseNeon 1.5s infinite' }}>AGENT_LINK</span>}
        {urgentCount > 0 && <span className="tag-x tag-red">⬡ {urgentCount} ALERT{urgentCount > 1 ? 'S' : ''}</span>}
        <div style={{ display:'flex', alignItems:'center', gap:5 }}>
          <span style={{ width:5, height:5, borderRadius:'50%', background:'var(--neon)', display:'inline-block', animation:'pulseNeon 2s infinite', boxShadow:'0 0 4px rgba(0,255,200,0.8)' }}/>
          <span className="mono" style={{ fontSize:10, color:'var(--text-3)' }}>SESSION {mm}:{ss}</span>
        </div>
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        <div style={{ display:'flex', alignItems:'center', gap:7, padding:'3px 10px', borderRadius:8, border:'1px solid var(--border-x)', background:'rgba(0,255,200,0.03)' }}>
          <div style={{ width:20, height:20, borderRadius:5, background:'rgba(0,255,200,0.1)', border:'1px solid rgba(0,255,200,0.25)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:8, fontWeight:700, color:'var(--neon)', fontFamily:'var(--font-mono)' }}>{initials}</div>
          <span style={{ fontSize:11, color:'var(--text-2)', fontWeight:500 }}>{user?.name?.split(' ')[0] || 'User'}</span>
        </div>
        <button onClick={logout} className="btn-x" style={{ padding:'4px 10px', fontSize:10 }}>EXIT</button>
      </div>
    </header>
  );
});

const BottomNav = memo(({ active, setActive, urgentCount }) => (
  <nav style={{ position:'fixed', bottom:0, left:0, right:0, zIndex:20, display:'flex', background:'rgba(0,5,16,0.92)', backdropFilter:'blur(16px)', borderTop:'1px solid var(--border-x)' }}>
    {TABS.map(tab => {
      const isActive = active === tab.id;
      const badge = (tab.id === 'fraud' || tab.id === 'insights') ? urgentCount : 0;
      return (
        <button key={tab.id} onClick={() => setActive(tab.id)} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:3, padding:'8px 4px 7px', border:'none', background:'none', cursor:'pointer', position:'relative', transition:'background .15s', borderTop:isActive ? `2px solid ${tab.color}` : '2px solid transparent' }}
          onMouseEnter={e => !isActive && (e.currentTarget.style.background = 'rgba(0,255,200,0.03)')}
          onMouseLeave={e => e.currentTarget.style.background = 'none'}>
          <span style={{ fontSize:15, filter:isActive ? 'none' : 'opacity(.35)', textShadow:isActive ? `0 0 8px ${tab.color}` : undefined, color:isActive ? tab.color : 'inherit', transition:'all .2s' }}>{tab.icon}</span>
          <span style={{ fontSize:8.5, fontFamily:'var(--font-mono)', fontWeight:isActive ? 700 : 400, color:isActive ? tab.color : 'var(--text-3)', letterSpacing:.04 }}>{tab.label}</span>
          {badge > 0 && <span style={{ position:'absolute', top:5, right:'15%', width:13, height:13, borderRadius:'50%', background:'#f43f5e', boxShadow:'0 0 6px rgba(244,63,94,0.7)', color:'#fff', fontSize:8, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center' }}>{badge}</span>}
        </button>
      );
    })}
  </nav>
));

const Section = ({ title, sub, children }) => (
  <div style={{ flex:1, maxWidth:620, margin:'0 auto', width:'100%', padding:'12px 14px 80px' }}>
    {title && (
      <div style={{ marginBottom:14 }}>
        <h2 style={{ margin:'0 0 2px', fontFamily:'var(--font-head)', fontSize:16, fontWeight:700, color:'var(--text-1)', letterSpacing:'.04em' }}>{title}</h2>
        {sub && <p style={{ margin:0, fontSize:10, color:'var(--text-3)', fontFamily:'var(--font-mono)' }}>{sub}</p>}
      </div>
    )}
    {children}
  </div>
);

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [tab,          setTab]          = useState('chat');
  const [showTransfer, setShowTransfer] = useState(false);
  const [balance,      setBalance]      = useState(null);
  const [txnKey,       setTxnKey]       = useState(0);
  const [humanAlert,   setHumanAlert]   = useState(false);
  const [lang,         setLang]         = useState(user?.preferredLanguage || 'en');
  const [sessionSecs,  setSessionSecs]  = useState(0);
  const urgentCount = 1;

  useEffect(() => {
    const id = setInterval(() => setSessionSecs(s => s + 1), 1000);
    return () => clearInterval(id);
  }, []);
  useEffect(() => { window.scrollTo(0, 0); }, [tab]);

  const handleTransferSuccess = useCallback(nb => {
    setBalance(nb);
    setTxnKey(k => k + 1);
    setShowTransfer(false);
  }, []);

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg0)', display:'flex', flexDirection:'column' }}>
      <BgOrbs/>
      <HUD user={user} logout={logout} sessionSecs={sessionSecs} tab={tab} urgentCount={urgentCount} humanAlert={humanAlert}/>

      {/* ── CHAT ─────────────────────────────────────────────────────────── */}
      {tab === 'chat' && (
        <div style={{ position:'fixed', top:50, bottom:0, left:0, right:0, zIndex:1, maxWidth:620, margin:'0 auto', width:'100%', display:'flex', flexDirection:'column', borderLeft:'1px solid var(--border-2)', borderRight:'1px solid var(--border-2)' }}>
          <SectionErrorBoundary>
            <ChatInterface onEscalate={() => setHumanAlert(true)} lang={lang} onLangChange={setLang}/>
          </SectionErrorBoundary>
        </div>
      )}

      {/* ── ACCOUNT ──────────────────────────────────────────────────────── */}
      {tab === 'account' && (
        <div style={{ paddingTop:62, position:'relative', zIndex:1 }}>
          <Section title="◈ ACCOUNT" sub="// balance · health score · transactions · profile">
            <SectionErrorBoundary>
              <FinancialHealthScore />
            </SectionErrorBoundary>
            <SectionErrorBoundary>
              <BalanceCard user={user} onBalanceUpdate={setBalance}/>
            </SectionErrorBoundary>

            {/* Action grid */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, marginBottom:16 }}>
              {[
                { icon:'◉', label:'AI CHAT',  color:'var(--neon)',   action:() => setTab('chat') },
                { icon:'→', label:'TRANSFER', color:'var(--gold)',   action:() => setShowTransfer(true) },
                { icon:'✦', label:'INSIGHTS', color:'var(--purple)', action:() => setTab('insights') },
                { icon:'👨‍💼', label:'AGENT', color:'var(--blue-x)', action:() => { setHumanAlert(true); setTab('chat'); } },
              ].map(b => (
                <button key={b.label} onClick={b.action} style={{ background:'transparent', border:'1px solid var(--border-x)', borderRadius:12, padding:'12px 6px 10px', display:'flex', flexDirection:'column', alignItems:'center', gap:5, cursor:'pointer', fontFamily:'inherit', transition:'all .15s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = b.color; e.currentTarget.style.background = `${b.color}08`; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-x)'; e.currentTarget.style.background = 'transparent'; }}>
                  <div style={{ width:32, height:32, borderRadius:8, background:`${b.color}10`, border:`1px solid ${b.color}30`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, color:b.color }}>{b.icon}</div>
                  <span style={{ fontSize:9, color:'var(--text-3)', fontFamily:'var(--font-mono)', fontWeight:600, letterSpacing:.05 }}>{b.label}</span>
                </button>
              ))}
            </div>

            {urgentCount > 0 && (
              <div onClick={() => setTab('fraud')} style={{ background:'rgba(244,63,94,0.06)', border:'1px solid rgba(244,63,94,0.25)', borderRadius:12, padding:'11px 14px', marginBottom:14, display:'flex', gap:10, alignItems:'center', cursor:'pointer', transition:'background .15s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(244,63,94,0.1)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(244,63,94,0.06)'}>
                <span style={{ fontSize:18, animation:'pulseNeon 1.5s infinite' }}>⬡</span>
                <div style={{ flex:1 }}>
                  <p style={{ margin:'0 0 2px', fontSize:12, fontWeight:700, color:'#f43f5e', fontFamily:'var(--font-mono)' }}>SECURITY_ALERT_DETECTED</p>
                  <p style={{ margin:0, fontSize:10, color:'var(--text-3)' }}>High-risk transaction flagged. Tap to investigate.</p>
                </div>
                <span style={{ fontSize:12, color:'#f43f5e' }}>→</span>
              </div>
            )}

            <div className="section-x" style={{ marginBottom:10 }}>RECENT TRANSACTIONS</div>
            <SectionErrorBoundary>
              <TransactionList refreshKey={txnKey}/>
            </SectionErrorBoundary>

            <div className="ag-card" style={{ padding:'14px 16px', marginTop:14 }}>
              <div className="section-x" style={{ marginBottom:12 }}>PROFILE</div>
              <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:14 }}>
                <div style={{ width:40, height:40, borderRadius:12, background:'rgba(0,255,200,0.08)', border:'1px solid rgba(0,255,200,0.2)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font-mono)', fontWeight:700, color:'var(--neon)', fontSize:13 }}>
                  {user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2) || '??'}
                </div>
                <div>
                  <p style={{ margin:0, fontSize:14, fontWeight:600, color:'var(--text-1)', fontFamily:'var(--font-head)' }}>{user?.name || '—'}</p>
                  <p style={{ margin:0, fontSize:11, color:'var(--text-3)' }}>{user?.email || '—'}</p>
                </div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                {[
                  ['ACCOUNT', user?.accountNumber || '—'],
                  ['PHONE',   user?.phone || '—'],
                  ['BANK',    user?.bank || '—'],
                  ['BALANCE', balance ? `₹${parseFloat(balance).toLocaleString('en-IN')}` : '—'],
                ].map(([k, v]) => (
                  <div key={k} style={{ background:'rgba(0,255,200,0.03)', border:'1px solid var(--border-2)', borderRadius:8, padding:'8px 11px' }}>
                    <p style={{ margin:'0 0 2px', fontSize:9, fontFamily:'var(--font-mono)', color:'var(--text-3)', letterSpacing:.07, textTransform:'uppercase' }}>{k}</p>
                    <p className="mono" style={{ margin:0, fontSize:12, fontWeight:500, color:'var(--text-1)' }}>{v}</p>
                  </div>
                ))}
              </div>
            </div>
            <p style={{ textAlign:'center', fontSize:9, color:'var(--text-3)', padding:'16px 0 0', fontFamily:'var(--font-mono)', letterSpacing:.06 }}>◈ 256-BIT ENCRYPTED · JWT SECURED · RBI COMPLIANT</p>
          </Section>
        </div>
      )}

      {tab === 'insights' && <div style={{ paddingTop:62, position:'relative', zIndex:1 }}><Section title="✦ INSIGHTS" sub="// autonomous AI recommendations"><SectionErrorBoundary><InsightsPanel/></SectionErrorBoundary></Section></div>}
      {tab === 'predict'  && <div style={{ paddingTop:62, position:'relative', zIndex:1 }}><Section title="▲ FORECAST" sub="// 90-day predictive cash flow intelligence"><SectionErrorBoundary><PredictivePanel/></SectionErrorBoundary></Section></div>}
      {tab === 'budget'   && <div style={{ paddingTop:62, position:'relative', zIndex:1 }}><Section title="◎ BUDGET"   sub="// smart budgeting · savings goals engine"><SectionErrorBoundary><BudgetGoalsPanel/></SectionErrorBoundary></Section></div>}
      {tab === 'fraud'    && <div style={{ paddingTop:62, position:'relative', zIndex:1 }}><Section title="⬡ SECURITY" sub="// real-time AI fraud detection"><SectionErrorBoundary><FraudPanel/></SectionErrorBoundary></Section></div>}

      <BottomNav active={tab} setActive={setTab} urgentCount={urgentCount}/>
      {showTransfer && <TransferModal balance={balance} onClose={() => setShowTransfer(false)} onSuccess={handleTransferSuccess}/>}
    </div>
  );
};

export default Dashboard;
