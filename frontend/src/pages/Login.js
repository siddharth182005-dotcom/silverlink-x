import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const Login = () => {
  const [form,    setForm]    = useState({ email:'', password:'' });
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate  = useNavigate();
  const canvasRef = useRef(null);
  const animRef   = useRef(null);

  // Animated background grid + nodes
  useEffect(() => {
    const c = canvasRef.current; if (!c) return;
    const resize = () => { c.width = window.innerWidth; c.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);
    const ctx = c.getContext('2d');
    const nodes = Array.from({ length: 40 }, () => ({
      x: Math.random() * c.width, y: Math.random() * c.height,
      vx: (Math.random() - .5) * .4, vy: (Math.random() - .5) * .4,
      r: Math.random() * 2 + 1,
    }));
    let frame = 0;
    const draw = () => {
      frame++;
      ctx.fillStyle = 'rgba(0,5,16,0.15)';
      ctx.fillRect(0, 0, c.width, c.height);
      nodes.forEach(n => {
        n.x += n.vx; n.y += n.vy;
        if (n.x < 0 || n.x > c.width)  n.vx *= -1;
        if (n.y < 0 || n.y > c.height) n.vy *= -1;
        // Draw connections
        nodes.forEach(m => {
          const d = Math.hypot(n.x - m.x, n.y - m.y);
          if (d < 120) {
            ctx.beginPath();
            ctx.moveTo(n.x, n.y); ctx.lineTo(m.x, m.y);
            ctx.strokeStyle = `rgba(0,255,200,${.12 * (1 - d/120)})`;
            ctx.lineWidth = .5; ctx.stroke();
          }
        });
        // Draw node
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0,255,200,${.3 + .2 * Math.sin(frame * .02 + n.r)})`;
        ctx.shadowColor = 'rgba(0,255,200,0.5)'; ctx.shadowBlur = 4;
        ctx.fill(); ctx.shadowBlur = 0;
      });
      animRef.current = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(animRef.current); window.removeEventListener('resize', resize); };
  }, []);

  const handleChange = useCallback(e => {
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));
    if (error) setError('');
  }, [error]);

  const handleSubmit = useCallback(async e => {
    e.preventDefault();
    if (!form.email.trim() || !form.password.trim()) { setError('Both fields required.'); return; }
    setLoading(true); setError('');
    try {
      const { data } = await api.post('/auth/login', { email: form.email.trim(), password: form.password });
      if (data.success) { login(data.user, data.token); navigate('/dashboard', { replace:true }); }
      else setError(data.message || 'Login failed.');
    } catch (err) {
      const m = err.response?.data?.message;
      if (!err.response) setError('Cannot connect to server. Start the backend first.');
      else if (err.response.status === 401) setError(m || 'Invalid credentials.');
      else setError(m || 'Login failed. Try again.');
    } finally { setLoading(false); }
  }, [form, login, navigate]);

  const fillDemo = useCallback(email => { setForm({ email, password:'password123' }); setError(''); }, []);

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:16, position:'relative', overflow:'hidden' }}>
      <canvas ref={canvasRef} style={{ position:'fixed', inset:0, zIndex:0 }}/>

      {/* Centered glow */}
      <div style={{ position:'fixed', top:'35%', left:'50%', transform:'translate(-50%,-50%)', width:500, height:500, borderRadius:'50%', background:'radial-gradient(circle, rgba(0,255,200,0.04) 0%, transparent 70%)', pointerEvents:'none', zIndex:0 }}/>

      <div style={{ position:'relative', zIndex:1, width:'100%', maxWidth:400 }}>
        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:32 }}>
          <div style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:60, height:60, borderRadius:18, background:'rgba(0,255,200,0.08)', border:'1px solid rgba(0,255,200,0.3)', marginBottom:14, boxShadow:'0 0 30px rgba(0,255,200,0.15)', animation:'floatUp 3s ease-in-out infinite' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L4 7V12C4 16.5 7.5 20.7 12 22C16.5 20.7 20 16.5 20 12V7L12 2Z" fill="none" stroke="rgba(0,255,200,0.8)" strokeWidth="1.2"/>
              <path d="M9 12L11 14L15 10" stroke="#00ffc8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 style={{ fontFamily:'var(--font-head)', fontSize:30, fontWeight:800, color:'#fff', margin:'0 0 4px', letterSpacing:'.02em' }}>
            SILVER<span style={{ color:'var(--neon)', textShadow:'0 0 16px rgba(0,255,200,0.5)' }}>LINK</span>
            <span style={{ fontSize:14, color:'var(--text-3)', marginLeft:6, fontWeight:400 }}>X</span>
          </h1>
          <p style={{ color:'var(--text-3)', fontSize:10, fontFamily:'var(--font-mono)', letterSpacing:.1 }}>ANTIGRAVITY BANKING INTELLIGENCE</p>
        </div>

        {/* Card */}
        <div className="ag-card" style={{ borderRadius:20, padding:'28px 26px' }}>
          <div style={{ marginBottom:22 }}>
            <p style={{ fontFamily:'var(--font-head)', fontSize:16, fontWeight:700, color:'var(--text-1)', margin:'0 0 4px' }}>INITIALIZE SESSION</p>
            <p style={{ fontSize:11, color:'var(--text-3)', fontFamily:'var(--font-mono)', margin:0 }}>{'>'} enter credentials to authenticate</p>
          </div>

          {error && (
            <div style={{ background:'rgba(244,63,94,0.08)', border:'1px solid rgba(244,63,94,0.3)', borderRadius:8, padding:'10px 13px', fontSize:12, color:'#f43f5e', marginBottom:18, fontFamily:'var(--font-mono)' }}>
              ERR: {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            {[
              { label:'EMAIL ADDRESS', name:'email', type:'email', placeholder:'user@domain.com', ac:'email' },
              { label:'PASSWORD',      name:'password', type:'password', placeholder:'••••••••', ac:'current-password' },
            ].map(f => (
              <div key={f.name} style={{ marginBottom:16 }}>
                <label style={{ display:'block', fontSize:9, fontFamily:'var(--font-mono)', color:'var(--text-3)', letterSpacing:.1, marginBottom:7, textTransform:'uppercase' }}>{f.label}</label>
                <input name={f.name} type={f.type} value={form[f.name]} onChange={handleChange}
                  placeholder={f.placeholder} autoComplete={f.ac} className="inp-x" autoFocus={f.name==='email'}/>
              </div>
            ))}

            <button type="submit" disabled={loading} style={{
              width:'100%', padding:'12px', borderRadius:10, border:'1px solid var(--neon)',
              background: loading ? 'rgba(0,255,200,0.05)' : 'rgba(0,255,200,0.12)',
              color: loading ? 'var(--text-3)' : 'var(--neon)',
              fontSize:13, fontWeight:700, cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily:'var(--font-head)', letterSpacing:'.08em',
              boxShadow: loading ? 'none' : '0 0 20px rgba(0,255,200,0.15)',
              transition:'all .2s', display:'flex', alignItems:'center', justifyContent:'center', gap:8,
            }}>
              {loading && <span style={{ width:14, height:14, border:'1.5px solid var(--neon)', borderTopColor:'transparent', borderRadius:'50%', animation:'orbitSpin .8s linear infinite', display:'inline-block' }}/>}
              {loading ? 'AUTHENTICATING…' : 'LAUNCH →'}
            </button>
          </form>

          {/* Demo accounts */}
          <div style={{ marginTop:18 }}>
            <div className="section-x" style={{ marginBottom:8 }}>DEMO ACCOUNTS</div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:6 }}>
              {[
                { label:'🇮🇳 RAMESH', sub:'Hindi · Fraud Alert', email:'ramesh@silverlink.com' },
                { label:'🇬🇧 SUNITA', sub:'English',             email:'sunita@silverlink.com' },
                { label:'🌴 ARJUN',   sub:'Tamil',               email:'arjun@silverlink.com'  },
              ].map(d => (
                <button key={d.email} onClick={() => fillDemo(d.email)} style={{
                  padding:'8px 6px', borderRadius:8, border:'1px solid var(--border-x)',
                  background:'transparent', color:'var(--text-3)', fontSize:10,
                  cursor:'pointer', fontFamily:'inherit', textAlign:'center',
                  transition:'all .15s', lineHeight:1.4,
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor='var(--neon)'; e.currentTarget.style.color='var(--neon)'; e.currentTarget.style.background='var(--neon-dim)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border-x)'; e.currentTarget.style.color='var(--text-3)'; e.currentTarget.style.background='transparent'; }}>
                  <div style={{ fontWeight:600, marginBottom:2 }}>{d.label}</div>
                  <div style={{ fontSize:9, fontFamily:'var(--font-mono)', opacity:.6 }}>{d.sub}</div>
                </button>
              ))}
            </div>
            <p style={{ textAlign:'center', fontSize:10, fontFamily:'var(--font-mono)', color:'var(--text-3)', marginTop:8 }}>
              PASSWORD: <span style={{ color:'var(--neon)' }}>password123</span>
            </p>
          </div>

          <div style={{ marginTop:20, textAlign:'center' }}>
            <p style={{ fontSize:11, color:'var(--text-3)', margin:0 }}>
              No account?{' '}
              <Link to="/signup" style={{ color:'var(--neon)', textDecoration:'none', fontWeight:500 }}>Create one →</Link>
            </p>
          </div>
        </div>

        <p style={{ textAlign:'center', fontSize:9, color:'var(--text-3)', marginTop:20, fontFamily:'var(--font-mono)', letterSpacing:.06 }}>
          ◈ 256-BIT ENCRYPTED · JWT SECURED · RBI COMPLIANT
        </p>
      </div>
    </div>
  );
};

export default Login;
