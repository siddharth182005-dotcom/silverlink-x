import React, { useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LANGUAGES } from '../components/LanguageSelector';
import api from '../utils/api';

const Signup = () => {
  const [form,    setForm]    = useState({ name:'', email:'', phone:'', password:'', confirmPassword:'', preferredLanguage:'en' });
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate  = useNavigate();

  const handleChange = useCallback(e => {
    setForm(p=>({...p,[e.target.name]:e.target.value})); if(error) setError('');
  },[error]);

  const handleSubmit = useCallback(async e => {
    e.preventDefault();
    if(!form.name.trim())          { setError('Full name required.'); return; }
    if(!form.email.trim())         { setError('Email required.'); return; }
    if(!form.password)             { setError('Password required.'); return; }
    if(form.password.length<6)     { setError('Password must be 6+ characters.'); return; }
    if(form.password!==form.confirmPassword){ setError('Passwords do not match.'); return; }
    setLoading(true); setError('');
    try {
      const { data } = await api.post('/auth/signup',{ name:form.name.trim(), email:form.email.trim(), phone:form.phone.trim(), password:form.password, preferredLanguage:form.preferredLanguage });
      if(data.success){ login(data.user,data.token); navigate('/dashboard',{replace:true}); }
      else setError(data.message||'Signup failed.');
    } catch(err) {
      const m = err.response?.data?.message;
      if(!err.response) setError('Cannot connect to server.');
      else if(err.response.status===409) setError(m||'Email already registered.');
      else setError(m||'Signup failed. Try again.');
    } finally { setLoading(false); }
  },[form,login,navigate]);

  const fields = [
    { label:'FULL NAME *',        name:'name',            type:'text',     ph:'Ramesh Kumar'      },
    { label:'EMAIL ADDRESS *',    name:'email',           type:'email',    ph:'user@domain.com'   },
    { label:'PHONE (OPTIONAL)',   name:'phone',           type:'tel',      ph:'9876543210'        },
    { label:'PASSWORD *',         name:'password',        type:'password', ph:'Min 6 characters', ac:'new-password' },
    { label:'CONFIRM PASSWORD *', name:'confirmPassword', type:'password', ph:'Repeat password',  ac:'new-password' },
  ];

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:'16px', overflowY:'auto' }}>
      <div style={{ position:'fixed', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:600, height:600, borderRadius:'50%', background:'radial-gradient(circle, rgba(168,85,247,0.04) 0%, transparent 70%)', pointerEvents:'none' }}/>
      <div style={{ position:'relative', zIndex:1, width:'100%', maxWidth:400, paddingTop:20, paddingBottom:20 }}>
        <div style={{ textAlign:'center', marginBottom:24 }}>
          <h1 style={{ fontFamily:'var(--font-head)', fontSize:24, fontWeight:800, color:'#fff', margin:'0 0 4px', letterSpacing:'.04em' }}>
            SILVER<span style={{ color:'var(--neon)', textShadow:'0 0 12px rgba(0,255,200,0.4)' }}>LINK</span><span style={{ fontSize:12, color:'var(--text-3)', marginLeft:5 }}>X</span>
          </h1>
          <p style={{ color:'var(--text-3)', fontSize:9, fontFamily:'var(--font-mono)', letterSpacing:.1 }}>CREATE ACCOUNT</p>
        </div>
        <div className="ag-card" style={{ borderRadius:20, padding:'24px 22px' }}>
          <p style={{ fontFamily:'var(--font-head)', fontSize:14, fontWeight:700, color:'var(--text-1)', margin:'0 0 4px', letterSpacing:'.03em' }}>REGISTER NEW USER</p>
          <p style={{ fontSize:9, fontFamily:'var(--font-mono)', color:'var(--text-3)', margin:'0 0 20px' }}>{'>'} fill details to initialize account</p>
          {error && <div style={{ background:'rgba(244,63,94,0.08)', border:'1px solid rgba(244,63,94,0.3)', borderRadius:8, padding:'9px 13px', fontSize:11, color:'#f43f5e', marginBottom:16, fontFamily:'var(--font-mono)' }}>ERR: {error}</div>}
          <form onSubmit={handleSubmit} noValidate>
            {fields.map(f=>(
              <div key={f.name} style={{ marginBottom:13 }}>
                <label style={{ display:'block', fontSize:9, fontFamily:'var(--font-mono)', color:'var(--text-3)', letterSpacing:.09, marginBottom:6, textTransform:'uppercase' }}>{f.label}</label>
                <input name={f.name} type={f.type} value={form[f.name]} onChange={handleChange} placeholder={f.ph} className="inp-x" autoComplete={f.ac||'off'}/>
              </div>
            ))}
            <div style={{ marginBottom:16 }}>
              <label style={{ display:'block', fontSize:9, fontFamily:'var(--font-mono)', color:'var(--text-3)', letterSpacing:.09, marginBottom:6, textTransform:'uppercase' }}>PREFERRED LANGUAGE</label>
              <select name="preferredLanguage" value={form.preferredLanguage} onChange={handleChange} className="inp-x" style={{ cursor:'pointer' }}>
                {LANGUAGES.map(l=><option key={l.code} value={l.code}>{l.label} · {l.native} · {l.name}</option>)}
              </select>
            </div>
            <button type="submit" disabled={loading} style={{ width:'100%', padding:'11px', borderRadius:9, border:'1px solid var(--neon)', background:loading?'rgba(0,255,200,0.04)':'rgba(0,255,200,0.1)', color:loading?'var(--text-3)':'var(--neon)', fontSize:12, fontWeight:700, cursor:loading?'not-allowed':'pointer', fontFamily:'var(--font-head)', letterSpacing:'.07em', boxShadow:loading?'none':'0 0 16px rgba(0,255,200,0.1)', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
              {loading&&<span style={{ width:13, height:13, border:'1.5px solid var(--neon)', borderTopColor:'transparent', borderRadius:'50%', animation:'orbitSpin .8s linear infinite', display:'inline-block'}}/>}
              {loading?'CREATING ACCOUNT…':'CREATE ACCOUNT →'}
            </button>
          </form>
          <p style={{ textAlign:'center', fontSize:11, color:'var(--text-3)', margin:'16px 0 0', fontFamily:'var(--font-mono)' }}>
            Already registered? <Link to="/login" style={{ color:'var(--neon)', textDecoration:'none', fontWeight:600 }}>SIGN IN →</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
