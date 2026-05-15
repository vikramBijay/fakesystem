import { useState, useRef } from 'react';
import HomePage from './components/HomePage';
import SearchPage from './components/SearchPage';
import LoadingPage from './components/LoadingPage';
import DashboardPage from './components/DashboardPage';
import StarCanvas from './components/StarCanvas';
import PricingModal from './components/PricingModal';
import { analyzeLocally, DEMO_REVIEWS } from './utils/detection';
import './App.css';

const BACKEND_URL = (() => {
  const { hostname } = window.location;
  if (hostname === '127.0.0.1' || hostname === 'localhost')
    return 'http://localhost:4000';
  return 'https://fakesystem.onrender.com';
})();

// ── Lightweight page-visibility wrapper ──────────────────────────────────
// Keeps the component mounted (globe stays alive, no re-init).
// Uses visibility + opacity so the hidden page is invisible AND
// non-interactive. pointer-events:none prevents accidental clicks.
function PageSlot({ visible, children }) {
  return (
    <div style={{
      position: visible ? 'relative' : 'fixed',
      inset: visible ? 'auto' : 0,
      zIndex: visible ? 1 : -1,
      opacity: visible ? 1 : 0,
      visibility: visible ? 'visible' : 'hidden',
      // Instant show, gentle fade-in
      transition: visible ? 'opacity .18s ease' : 'none',
      pointerEvents: visible ? 'auto' : 'none',
      // When hidden, take zero layout space
      ...(visible ? {} : { width: 0, height: 0, overflow: 'hidden' }),
    }}>
      {children}
    </div>
  );
}

export default function App() {
  const [page, setPage] = useState('home');
  const [results, setResults] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showPricing, setShowPricing] = useState(false);
  const audioRef = useRef(null);

  const goTo = (p) => {
    setShowPricing(false);
    setPage(p);
  };

  // ── Audio ─────────────────────────────────────────────────────────────
  const toggleMusic = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  // ── Analysis ──────────────────────────────────────────────────────────
  const runDemo = async () => {
    goTo('loading');
    await new Promise(r => setTimeout(r, 1600));
    const result = analyzeLocally(DEMO_REVIEWS);
    setResults({ ...result, source: 'demo' });
    setPage('dashboard');
  };

  const runAnalysis = async (url) => {
    goTo('loading');
    let data = null, backendError = null;
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 180000);
      const resp = await fetch(`${BACKEND_URL}/api/analyze`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }), signal: controller.signal,
      });
      clearTimeout(timer);
      const body = await resp.json();
      if (!resp.ok) backendError = body.error || 'Unknown error';
      else data = body;
    } catch (err) {
      backendError = err.name === 'AbortError' ? 'Request timed out.' : 'Backend not reachable (port 4000?).';
    }
    if (data) setResults(data);
    else {
      const result = analyzeLocally(DEMO_REVIEWS);
      setResults({ ...result, source: 'client-fallback', backendError });
    }
    setPage('dashboard');
  };

  return (
    <>
      <audio ref={audioRef} src="/interstellar-cornfield-chase.mp3" loop preload="auto" />

      <StarCanvas />

      <nav>
        <div className="logo" onClick={() => goTo('home')}>
          <div className="logo-icon">
            <svg viewBox="0 0 18 18" fill="none" width="18" height="18">
              <path d="M9 2L2 6v6l7 4 7-4V6L9 2z" stroke="#fff" strokeWidth="1.5" strokeLinejoin="round"/>
              <path d="M9 10l-3-2m3 2l3-2m-3 2v4" stroke="#a78bfa" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
          </div>
          Fake<span>Guard</span>
        </div>
        <div className="nav-links">
          <span className={`nav-link ${page === 'home' ? 'active' : ''}`} onClick={() => goTo('home')}>Home</span>
          <span className={`nav-link ${page === 'search' ? 'active' : ''}`} onClick={() => goTo('search')}>Analyze</span>
          <span className="nav-link" onClick={() => setShowPricing(true)} style={{ cursor: 'pointer' }}>Pricing</span>
          <span className="nav-badge">AI POWERED</span>
        </div>
      </nav>

      {/* ── All pages always mounted — globe never re-initializes ── */}
      <PageSlot visible={page === 'home'}>
        <HomePage
          onAnalyze={() => goTo('search')}
          onDemo={runDemo}
          isPlaying={isPlaying}
          onToggleMusic={toggleMusic}
        />
      </PageSlot>

      <PageSlot visible={page === 'search'}>
        <SearchPage onAnalyze={runAnalysis} onDemo={runDemo} />
      </PageSlot>

      <PageSlot visible={page === 'loading'}>
        <LoadingPage active={page === 'loading'} />
      </PageSlot>

      <PageSlot visible={page === 'dashboard'}>
        <DashboardPage data={results} onNewAnalysis={() => goTo('search')} />
      </PageSlot>

      {showPricing && (
        <PricingModal onClose={() => setShowPricing(false)} />
      )}
    </>
  );
}