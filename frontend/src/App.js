import React, { Suspense, Component, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// ── Lazy-loaded pages (code splitting) ───────────────────────────────────────
const Login     = lazy(() => import('./pages/Login'));
const Signup    = lazy(() => import('./pages/Signup'));
const Dashboard = lazy(() => import('./pages/Dashboard'));

// ── Full-screen loader ───────────────────────────────────────────────────────
const Loader = () => (
  <div style={{ minHeight:'100vh', background:'#000510', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:12 }}>
    <div style={{ width:56, height:56, borderRadius:18, background:'rgba(0,255,200,0.1)', border:'1px solid rgba(0,255,200,0.25)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 0 20px rgba(0,255,200,0.15)' }}>
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" style={{ animation:'breathe 1.5s ease-in-out infinite' }}>
        <path d="M12 2L4 7V12C4 16.5 7.5 20.7 12 22C16.5 20.7 20 16.5 20 12V7L12 2Z" stroke="#00ffc8" strokeWidth="1.5" fill="rgba(0,255,200,0.1)"/>
        <path d="M9 12L11 14L15 10" stroke="#00ffc8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </div>
    <p style={{ color:'rgba(0,255,200,0.5)', fontSize:12, margin:0, fontFamily:'monospace', letterSpacing:'.08em' }}>SILVERLINK X LOADING…</p>
    <style>{`
      @keyframes breathe {
        0%,100% { opacity:0.5; transform:scale(0.92); }
        50%      { opacity:1;   transform:scale(1.08); }
      }
    `}</style>
  </div>
);

// ── Global Error Boundary ────────────────────────────────────────────────────
// Catches any React render errors and prevents the entire app from crashing.
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError:false, error:null, errorInfo:null };
  }

  static getDerivedStateFromError(error) {
    return { hasError:true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError:false, error:null, errorInfo:null });
    // Navigate to dashboard to recover
    window.location.href = '/dashboard';
  };

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div style={{ minHeight:'100vh', background:'#000510', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
        <div style={{ maxWidth:440, width:'100%', background:'rgba(10,22,40,0.95)', border:'1px solid rgba(244,63,94,0.3)', borderRadius:18, padding:'28px 24px', textAlign:'center' }}>
          <div style={{ fontSize:36, marginBottom:12 }}>⚠</div>
          <h2 style={{ margin:'0 0 8px', color:'#f43f5e', fontFamily:'monospace', fontSize:16, fontWeight:700, letterSpacing:'.05em' }}>SYSTEM_ERROR</h2>
          <p style={{ margin:'0 0 16px', color:'rgba(255,255,255,0.5)', fontSize:12, lineHeight:1.5 }}>
            Something went wrong in this section. Your account data is safe.
          </p>
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <pre style={{ margin:'0 0 16px', color:'rgba(244,63,94,0.7)', fontSize:10, textAlign:'left', overflowX:'auto', padding:'10px', background:'rgba(244,63,94,0.05)', borderRadius:8 }}>
              {this.state.error.toString()}
            </pre>
          )}
          <button
            onClick={this.handleReset}
            style={{ padding:'10px 24px', borderRadius:8, border:'1px solid rgba(0,255,200,0.4)', background:'rgba(0,255,200,0.1)', color:'#00ffc8', fontSize:12, cursor:'pointer', fontFamily:'monospace', fontWeight:700, letterSpacing:'.05em' }}>
            ↺ RECOVER &amp; RELOAD
          </button>
        </div>
      </div>
    );
  }
}

// ── Section-level Error Boundary ─────────────────────────────────────────────
// Wraps individual panels so a crash in one panel doesn't break the whole UI.
export class SectionErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { hasError:false }; }
  static getDerivedStateFromError() { return { hasError:true }; }
  componentDidCatch(error) { console.error('[Section Error]', error); }
  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div style={{ padding:'20px', textAlign:'center', background:'rgba(244,63,94,0.04)', border:'1px solid rgba(244,63,94,0.2)', borderRadius:12, margin:'8px 0' }}>
        <p style={{ margin:'0 0 8px', fontSize:12, color:'#f43f5e', fontFamily:'monospace' }}>⚠ This section encountered an error</p>
        <button onClick={() => this.setState({ hasError:false })} style={{ padding:'5px 14px', border:'1px solid rgba(244,63,94,0.3)', borderRadius:6, background:'transparent', color:'#f43f5e', fontSize:10, cursor:'pointer', fontFamily:'monospace' }}>
          RETRY
        </button>
      </div>
    );
  }
}

// ── Route Guards ─────────────────────────────────────────────────────────────
const Protected = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <Loader />;
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const Public = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <Loader />;
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children;
};

// ── Routes ────────────────────────────────────────────────────────────────────
const AppRoutes = () => (
  <Routes>
    <Route path="/"          element={<Navigate to="/dashboard" replace />} />
    <Route path="/login"     element={<Public><Login /></Public>} />
    <Route path="/signup"    element={<Public><Signup /></Public>} />
    <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
    <Route path="*"          element={<Navigate to="/dashboard" replace />} />
  </Routes>
);

const App = () => (
  <ErrorBoundary>
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<Loader />}>
          <AppRoutes />
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  </ErrorBoundary>
);

export default App;
