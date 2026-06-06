import React, { useState, useCallback, memo } from 'react';
import api from '../utils/api';

const TransferModal = memo(({ balance, onClose, onSuccess }) => {
  const [form,    setForm]    = useState({ toAccount:'', amount:'', note:'' });
  const [step,    setStep]    = useState(1); // 1=form 2=confirm 3=success
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const handleChange = useCallback(e => {
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));
    setError('');
  }, []);

  const handleSubmit = useCallback(async () => {
    if (step === 1) {
      if (!form.toAccount.trim()) { setError('Recipient account required.'); return; }
      if (!form.amount || isNaN(form.amount) || parseFloat(form.amount) <= 0) { setError('Enter a valid amount.'); return; }
      if (balance && parseFloat(form.amount) > balance) { setError('Insufficient balance.'); return; }
      setStep(2); return;
    }
    setLoading(true); setError('');
    try {
      const { data } = await api.post('/banking/transfer', { toAccount: form.toAccount, amount: parseFloat(form.amount), note: form.note });
      if (data.success) { setStep(3); setTimeout(() => onSuccess?.(data.data.newBalance), 1500); }
      else setError(data.message || 'Transfer failed.');
    } catch (err) {
      setError(err.response?.data?.message || 'Transfer failed.');
    } finally { setLoading(false); }
  }, [step, form, balance, onSuccess]);

  const amt = parseFloat(form.amount) || 0;

  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,5,16,0.85)', zIndex:100, display:'flex', alignItems:'center', justifyContent:'center', padding:16, backdropFilter:'blur(8px)' }}>
      <div onClick={e => e.stopPropagation()} className="ag-card" style={{ width:'100%', maxWidth:380, borderRadius:20, overflow:'hidden' }}>
        {/* Header */}
        <div style={{ padding:'16px 20px', borderBottom:'1px solid var(--border-x)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <p style={{ margin:'0 0 2px', fontFamily:'var(--font-head)', fontSize:16, fontWeight:700, color:'var(--text-1)' }}>
              {step === 3 ? '✦ TRANSFER COMPLETE' : '→ TRANSFER FUNDS'}
            </p>
            <p style={{ margin:0, fontSize:10, fontFamily:'var(--font-mono)', color:'var(--text-3)' }}>
              {step === 1 ? 'STEP 01 · DETAILS' : step === 2 ? 'STEP 02 · CONFIRM' : 'STATUS · SUCCESS'}
            </p>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'1px solid var(--border-x)', borderRadius:6, width:28, height:28, cursor:'pointer', color:'var(--text-3)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14 }}>✕</button>
        </div>

        <div style={{ padding:'20px 20px 22px' }}>
          {step === 3 ? (
            <div style={{ textAlign:'center', padding:'12px 0' }}>
              <div style={{ width:64, height:64, borderRadius:'50%', background:'rgba(0,255,200,0.1)', border:'1px solid rgba(0,255,200,0.4)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 14px', fontSize:28, boxShadow:'0 0 24px rgba(0,255,200,0.2)' }}>✓</div>
              <p className="mono" style={{ margin:'0 0 4px', fontSize:22, fontWeight:700, color:'var(--neon)', textShadow:'0 0 16px rgba(0,255,200,0.5)' }}>₹{amt.toLocaleString('en-IN')}</p>
              <p style={{ margin:'0 0 12px', fontSize:12, color:'var(--text-2)' }}>Sent to {form.toAccount}</p>
              <span className="tag-x tag-neon">TRANSACTION VERIFIED</span>
            </div>
          ) : step === 2 ? (
            <div>
              <div className="ag-card" style={{ padding:'14px 16px', marginBottom:16, borderColor:'rgba(0,255,200,0.2)' }}>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                  {[['TO',form.toAccount],['AMOUNT','₹'+amt.toLocaleString('en-IN')],['NOTE',form.note||'—'],['METHOD','IMPS']].map(([k,v]) => (
                    <div key={k}>
                      <p style={{ margin:'0 0 2px', fontSize:9, fontFamily:'var(--font-mono)', color:'var(--text-3)', letterSpacing:.06 }}>{k}</p>
                      <p className="mono" style={{ margin:0, fontSize:13, color:'var(--text-1)', fontWeight:500 }}>{v}</p>
                    </div>
                  ))}
                </div>
              </div>
              {error && <p style={{ color:'var(--red-x)', fontSize:12, marginBottom:12 }}>{error}</p>}
              <div style={{ display:'flex', gap:8 }}>
                <button onClick={() => setStep(1)} className="btn-x" style={{ flex:1 }}>← BACK</button>
                <button onClick={handleSubmit} disabled={loading}
                  style={{ flex:2, padding:'10px', borderRadius:8, border:'1px solid var(--neon)', background:'rgba(0,255,200,0.12)', color:'var(--neon)', fontSize:13, fontWeight:600, cursor:loading?'not-allowed':'pointer', fontFamily:'inherit', letterSpacing:.04, boxShadow:'0 0 16px rgba(0,255,200,0.15)', transition:'all .2s' }}>
                  {loading ? 'PROCESSING…' : 'CONFIRM TRANSFER'}
                </button>
              </div>
            </div>
          ) : (
            <div>
              {[
                { label:'RECIPIENT ACCOUNT / UPI ID', name:'toAccount', placeholder:'Enter account number or UPI ID', type:'text' },
                { label:'AMOUNT (₹)', name:'amount', placeholder:'Enter amount', type:'number' },
                { label:'NOTE (optional)', name:'note', placeholder:'What is this for?', type:'text' },
              ].map(f => (
                <div key={f.name} style={{ marginBottom:14 }}>
                  <label style={{ display:'block', fontSize:9, fontFamily:'var(--font-mono)', color:'var(--text-3)', letterSpacing:.08, marginBottom:6, textTransform:'uppercase' }}>{f.label}</label>
                  <input name={f.name} type={f.type} value={form[f.name]} onChange={handleChange} placeholder={f.placeholder} className="inp-x" autoComplete="off"/>
                </div>
              ))}
              {balance && (
                <p style={{ fontSize:10, fontFamily:'var(--font-mono)', color:'var(--text-3)', margin:'0 0 14px' }}>
                  AVAILABLE: <span style={{ color:'var(--neon)' }}>₹{parseFloat(balance).toLocaleString('en-IN')}</span>
                </p>
              )}
              {error && <p style={{ color:'var(--red-x)', fontSize:12, marginBottom:12 }}>{error}</p>}
              <button onClick={handleSubmit} style={{ width:'100%', padding:'11px', borderRadius:8, border:'1px solid var(--neon)', background:'rgba(0,255,200,0.12)', color:'var(--neon)', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit', letterSpacing:.04, boxShadow:'0 0 16px rgba(0,255,200,0.12)', transition:'all .2s' }}
                onMouseEnter={e => e.currentTarget.style.background='rgba(0,255,200,0.2)'}
                onMouseLeave={e => e.currentTarget.style.background='rgba(0,255,200,0.12)'}>
                REVIEW TRANSFER →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export default TransferModal;
