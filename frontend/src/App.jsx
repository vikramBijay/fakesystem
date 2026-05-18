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

// ── Song catalogue ────────────────────────────────────────────────────────
export const SONGS = [
  {
    id: 'cornfield',
    title: 'Cornfield Chase',
    artist: 'Hans Zimmer · Interstellar',
    src: '/interstellar-cornfield-chase.mp3',
    emoji: '🌌',
  },
  {
    id: 'unstoppable',
    title: 'Unstoppable',
    artist: 'Sia',
    src: '/Unstoppable.mp3',
    emoji: '⚡',
  },
  {
    id: 'azadi',
    title: 'Azadi',
    artist: 'Dub Sharma',
    src: '/Azadi___Dub_Sharma__Video.mp3',
    emoji: '🇮🇳',
  },
  {
    id: 'paradox',
    title: 'Paradox',
    artist: 'Dhanda Nyoliwala',
    src: '/Dhanda_Nyoliwala_-_Paradox__Official_Music_Video_.mp3',
    emoji: '🔥',
  },
];

// ── Lightweight page-visibility wrapper ──────────────────────────────────
function PageSlot({ visible, children }) {
  return (
    <div style={{
      position: visible ? 'relative' : 'fixed',
      inset: visible ? 'auto' : 0,
      zIndex: visible ? 1 : -1,
      opacity: visible ? 1 : 0,
      visibility: visible ? 'visible' : 'hidden',
      transition: visible ? 'opacity .18s ease' : 'none',
      pointerEvents: visible ? 'auto' : 'none',
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
  const [currentSong, setCurrentSong] = useState(null); // SONGS[id] or null
  const [showPricing, setShowPricing] = useState(false);
  const audioRef = useRef(null);

  const goTo = (p) => {
    setShowPricing(false);
    setPage(p);
  };

  // ── Audio ─────────────────────────────────────────────────────────────
  // Called from HomePage when user picks a song from the picker
  const pickAndPlay = (song) => {
    const audio = audioRef.current;
    if (!audio) return;
    // If same song is already playing, just stop
    if (isPlaying && currentSong?.id === song.id) {
      audio.pause();
      setIsPlaying(false);
      return;
    }
    audio.src = song.src;
    audio.load();
    audio.play()
      .then(() => {
        setCurrentSong(song);
        setIsPlaying(true);
      })
      .catch(() => {});
  };

  const stopMusic = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    setIsPlaying(false);
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
      {/* Single audio element — src is swapped dynamically */}
      <audio ref={audioRef} loop preload="none" />

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

      <PageSlot visible={page === 'home'}>
        <HomePage
          onAnalyze={() => goTo('search')}
          onDemo={runDemo}
          isPlaying={isPlaying}
          currentSong={currentSong}
          onPickSong={pickAndPlay}
          onStopMusic={stopMusic}
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