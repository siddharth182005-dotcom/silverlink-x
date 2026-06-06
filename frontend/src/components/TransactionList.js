import React, { useState, useEffect, useCallback, memo } from 'react';
import api from '../utils/api';

const CAT_COLOR = {
  Income:'var(--neon)', Shopping:'var(--purple)', Bills:'var(--gold)',
  Health:'#22d3ee', Mobile:'#a78bfa', Food:'#fb923c',
  Transport:'#34d399', Transfer:'var(--blue-x)', Housing:'#f472b6', Entertainment:'#c084fc',
};
const CAT_ICON = {
  Income:'▲', Shopping:'◈', Bills:'◇', Health:'✦', Mobile:'◉',
  Food:'◆', Transport:'▷', Transfer:'→', Housing:'⬡', Entertainment:'◎', default:'◦',
};

const TransactionList = memo(({ refreshKey }) => {
  const [txns,    setTxns]    = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/banking/transactions?limit=8');
      if (data.success) setTxns(data.data.transactions);
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load, refreshKey]);

  if (loading) return (
    <div className="ag-card" style={{ padding:'14px 16px' }}>
      {[...Array(4)].map((_,i) => (
        <div key={i} style={{ display:'flex', gap:10, alignItems:'center', marginBottom:12 }}>
          <div style={{ width:34, height:34, borderRadius:8, background:'rgba(0,255,200,0.05)', animation:'shimmer 1.5s infinite', backgroundSize:'200%' }}/>
          <div style={{ flex:1 }}>
            <div style={{ height:11, width:'60%', borderRadius:3, background:'rgba(255,255,255,0.05)', marginBottom:5 }}/>
            <div style={{ height:9,  width:'40%', borderRadius:3, background:'rgba(255,255,255,0.03)' }}/>
          </div>
          <div style={{ height:13, width:70, borderRadius:3, background:'rgba(255,255,255,0.05)' }}/>
        </div>
      ))}
    </div>
  );

  return (
    <div className="ag-card" style={{ overflow:'hidden' }}>
      {txns.map((t, i) => {
        const isCredit = t.type === 'credit';
        const color = CAT_COLOR[t.category] || 'var(--text-2)';
        const icon  = CAT_ICON[t.category]  || CAT_ICON.default;
        const isRisky = (t.riskScore || 0) >= 60;
        return (
          <div key={t.id} style={{
            display:'flex', alignItems:'center', gap:12, padding:'11px 16px',
            borderBottom: i < txns.length - 1 ? '1px solid var(--border-2)' : 'none',
            transition:'background .15s', cursor:'default',
            background: isRisky ? 'rgba(244,63,94,0.04)' : 'transparent',
          }}
            onMouseEnter={e => e.currentTarget.style.background = isRisky ? 'rgba(244,63,94,0.07)' : 'rgba(0,255,200,0.03)'}
            onMouseLeave={e => e.currentTarget.style.background = isRisky ? 'rgba(244,63,94,0.04)' : 'transparent'}
          >
            {/* Icon */}
            <div style={{
              width:34, height:34, borderRadius:9, flexShrink:0,
              background:`${color}10`, border:`1px solid ${color}30`,
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:14, color,
              boxShadow: isRisky ? '0 0 8px rgba(244,63,94,0.2)' : 'none',
            }}>
              {isRisky ? '⚠' : icon}
            </div>

            {/* Info */}
            <div style={{ flex:1, minWidth:0 }}>
              <p style={{ margin:'0 0 2px', fontSize:13, fontWeight:500, color:'var(--text-1)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                {t.description}
              </p>
              <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                <span style={{ fontSize:9, fontFamily:'var(--font-mono)', color:'var(--text-3)' }}>{t.date}</span>
                <span style={{ fontSize:8, padding:'1px 5px', borderRadius:3, background:`${color}15`, color, border:`0.5px solid ${color}30`, fontWeight:600, letterSpacing:.04 }}>{t.method || t.category}</span>
                {isRisky && <span className="tag-x tag-red" style={{ fontSize:8 }}>RISK {t.riskScore}</span>}
              </div>
            </div>

            {/* Amount */}
            <div style={{ textAlign:'right', flexShrink:0 }}>
              <p className="mono" style={{
                margin:0, fontSize:13, fontWeight:700,
                color: isCredit ? 'var(--neon)' : isRisky ? 'var(--red-x)' : 'var(--text-1)',
                textShadow: isCredit ? '0 0 8px rgba(0,255,200,0.3)' : 'none',
              }}>
                {isCredit ? '+' : '−'}₹{t.amount.toLocaleString('en-IN')}
              </p>
            </div>
          </div>
        );
      })}

      {txns.length === 0 && (
        <div style={{ padding:'28px', textAlign:'center', color:'var(--text-3)', fontSize:13, fontFamily:'var(--font-mono)' }}>
          NO_TRANSACTIONS_FOUND
        </div>
      )}
    </div>
  );
});

export default TransactionList;
