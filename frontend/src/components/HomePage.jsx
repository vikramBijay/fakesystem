import HeroGlobe from './HeroGlobe';
import { API } from '../utils/API';

export default function HomePage({ onAnalyze, onDemo, isPlaying, onToggleMusic }) {
  return (
    <div style={{
      position: 'relative',
      width: '100%',
      height: '100vh',
      overflow: 'hidden',
    }}>

      {/* ── z1: GLOBE ── */}
      <div style={{
        position: 'absolute',
        top: '28%',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1,
        width: '740px',
        height: '740px',
        background: 'none',
        border: 'none',
        boxShadow: 'none',
        outline: 'none',
        pointerEvents: 'auto',
      }}>
        <HeroGlobe geoData={API} />
      </div>

      {/* ── z2: BOTTOM FADE ── */}
      <div style={{
        position: 'absolute',
        bottom: 0, left: 0, right: 0,
        height: '50%',
        zIndex: 2,
        pointerEvents: 'none',
        background: 'linear-gradient(to top, #080818 0%, #080818 15%, rgba(8,8,24,0.65) 45%, transparent 100%)',
      }} />

      {/* ── z2: LEFT FADE ── */}
      <div style={{
        position: 'absolute',
        top: 0, bottom: 0, left: 0,
        width: '22%',
        zIndex: 2,
        pointerEvents: 'none',
        background: 'linear-gradient(to right, #080818 0%, transparent 100%)',
      }} />

      {/* ── z2: RIGHT FADE ── */}
      <div style={{
        position: 'absolute',
        top: 0, bottom: 0, right: 0,
        width: '22%',
        zIndex: 2,
        pointerEvents: 'none',
        background: 'linear-gradient(to left, #080818 0%, transparent 100%)',
      }} />

      {/* ── z2: TOP FADE ── */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0,
        height: '22%',
        zIndex: 2,
        pointerEvents: 'none',
        background: 'linear-gradient(to bottom, #080818 0%, transparent 100%)',
      }} />

      {/* ── z4: EYEBROW PILL ── */}
      <div style={{
        position: 'absolute',
        top: '80px',
        left: 0, right: 0,
        zIndex: 4,
        display: 'flex',
        justifyContent: 'center',
        pointerEvents: 'none',
        animation: 'fadeUp .5s ease .1s both',
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(139,92,246,0.1)',
          border: '1px solid rgba(139,92,246,0.3)',
          padding: '5px 18px',
          borderRadius: '999px',
          fontSize: '.67rem',
          color: '#a78bfa',
          fontWeight: 600,
          letterSpacing: '.12em',
          textTransform: 'uppercase',
        }}>
          <span style={{
            width: '6px', height: '6px',
            background: '#34d399',
            borderRadius: '50%',
            animation: 'pulse 2s infinite',
            flexShrink: 0,
          }} />
          AI-Powered Review Intelligence
        </div>
      </div>

      {/* ── z3: TITLE ── */}
      <div style={{
        position: 'absolute',
        top: '118px',
        left: 0, right: 0,
        zIndex: 3,
        textAlign: 'center',
        pointerEvents: 'none',
        userSelect: 'none',
        animation: 'fadeUp .65s ease .2s both',
      }}>
        <h1 style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: 'clamp(3.5rem, 7.5vw, 6.5rem)',
          fontWeight: 800,
          lineHeight: 1,
          letterSpacing: '-0.02em',
          background: 'linear-gradient(170deg, #ffffff 0%, #e8e2ff 20%, #c4b5fd 50%, #a855f7 80%, #7c3aed 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          margin: 0,
          filter: 'drop-shadow(0 0 55px rgba(167,139,250,0.7)) drop-shadow(0 2px 20px rgba(109,40,217,0.5))',
          whiteSpace: 'nowrap',
        }}>
          FakeGuard
        </h1>
      </div>

      {/* ── z5: SIDE TEXT left ── */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '3rem',
        transform: 'translateY(-50%)',
        zIndex: 5,
        maxWidth: '190px',
        pointerEvents: 'none',
        animation: 'fadeUp .7s ease .4s both',
      }}>
        <p style={{
          fontSize: '.84rem',
          color: '#8B7CF6',
          lineHeight: 1.95,
          fontFamily: "'DM Sans', sans-serif",
          margin: 0,
        }}>
          Dive into the world of online reviews and expose what's real and what's not. Our AI analyzes patterns, detects fake feedback, and empowers you with trustworthy insights.
        </p>
      </div>

      {/* ── z5: BOTTOM-LEFT — Music button + Analyze Reviews ── */}
      <div style={{
        position: 'absolute',
        bottom: '6%',
        left: '3rem',
        zIndex: 5,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: '10px',
        animation: 'fadeUp .7s ease .5s both',
      }}>

        {/* 🎵 Music Play / Stop button */}
        <button
          onClick={onToggleMusic}
          title={isPlaying ? 'Stop music' : 'Play background music'}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '9px',
            padding: '.42rem 1.1rem .42rem .42rem',
            background: isPlaying
              ? 'rgba(109,28,217,0.35)'
              : 'rgba(255,255,255,0.05)',
            color: isPlaying ? '#c4b5fd' : '#6b6890',
            border: `1px solid ${isPlaying ? 'rgba(139,92,246,0.5)' : 'rgba(255,255,255,0.1)'}`,
            borderRadius: '999px',
            fontSize: '.78rem',
            fontWeight: 600,
            fontFamily: "'Syne', sans-serif",
            cursor: 'pointer',
            backdropFilter: 'blur(14px)',
            transition: 'all .22s',
            whiteSpace: 'nowrap',
            letterSpacing: '.04em',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = isPlaying
              ? 'rgba(109,28,217,0.5)'
              : 'rgba(255,255,255,0.09)';
            e.currentTarget.style.color = '#c4b5fd';
            e.currentTarget.style.borderColor = 'rgba(139,92,246,0.4)';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = isPlaying
              ? 'rgba(109,28,217,0.35)'
              : 'rgba(255,255,255,0.05)';
            e.currentTarget.style.color = isPlaying ? '#c4b5fd' : '#6b6890';
            e.currentTarget.style.borderColor = isPlaying
              ? 'rgba(139,92,246,0.5)'
              : 'rgba(255,255,255,0.1)';
            e.currentTarget.style.transform = '';
          }}
        >
          {/* Icon circle */}
          <span style={{
            width: '26px', height: '26px',
            borderRadius: '50%',
            background: isPlaying
              ? 'linear-gradient(135deg, #6d28d9, #8b5cf6)'
              : 'rgba(139,92,246,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
            boxShadow: isPlaying ? '0 0 12px rgba(109,40,217,0.6)' : 'none',
            transition: 'all .22s',
          }}>
            {isPlaying ? (
              /* Stop icon — two vertical bars */
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <rect x="1.5" y="1.5" width="2.5" height="7" rx="1" fill="#fff"/>
                <rect x="6" y="1.5" width="2.5" height="7" rx="1" fill="#fff"/>
              </svg>
            ) : (
              /* Play icon */
              <svg width="9" height="10" viewBox="0 0 9 10" fill="none">
                <path d="M1 1l7 4L1 9V1z" fill="#a78bfa"/>
              </svg>
            )}
          </span>

          {/* Animated sound bars when playing */}
          {isPlaying ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
              {[1, 1.6, 0.8, 1.3].map((h, i) => (
                <span key={i} style={{
                  display: 'inline-block',
                  width: '2px',
                  height: `${8 * h}px`,
                  background: '#a78bfa',
                  borderRadius: '2px',
                  animation: `soundBar ${0.5 + i * 0.15}s ease-in-out infinite alternate`,
                  transformOrigin: 'bottom',
                }} />
              ))}
              <span style={{ marginLeft: '5px' }}>Stop Music</span>
            </span>
          ) : (
            'Play Music'
          )}
        </button>

        {/* Analyze Reviews button */}
        <button
          onClick={onAnalyze}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '12px',
            padding: '.55rem 1.4rem .55rem .55rem',
            background: 'rgba(90,20,180,0.28)',
            color: '#ddd8ff',
            border: '1px solid rgba(139,92,246,0.4)',
            borderRadius: '999px',
            fontSize: '.85rem',
            fontWeight: 600,
            fontFamily: "'Syne', sans-serif",
            cursor: 'pointer',
            backdropFilter: 'blur(14px)',
            transition: 'all .22s',
            whiteSpace: 'nowrap',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(109,28,217,0.5)';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'rgba(90,20,180,0.28)';
            e.currentTarget.style.transform = '';
          }}
        >
          <span style={{
            width: '30px', height: '30px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #6d28d9, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
            boxShadow: '0 0 14px rgba(109,40,217,0.6)',
          }}>
            <svg width="9" height="11" viewBox="0 0 9 11" fill="none">
              <path d="M1 1l7 4.5L1 10V1z" fill="#fff" />
            </svg>
          </span>
          Analyze Reviews
        </button>
      </div>

      {/* ── z5: BOTTOM-RIGHT ghost button ── */}
      <div style={{
        position: 'absolute',
        bottom: '6%',
        right: '3rem',
        zIndex: 5,
        animation: 'fadeUp .7s ease .55s both',
      }}>
        <button
          onClick={onDemo}
          style={{
            padding: '.65rem 1.6rem',
            background: 'transparent',
            color: '#7a7698',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '999px',
            fontSize: '.85rem',
            fontWeight: 500,
            fontFamily: "'Syne', sans-serif",
            cursor: 'pointer',
            transition: 'all .22s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = 'rgba(139,92,246,0.4)';
            e.currentTarget.style.color = '#c4bfee';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
            e.currentTarget.style.color = '#7a7698';
            e.currentTarget.style.transform = '';
          }}
        >
          Try Demo Mode
        </button>
      </div>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(22px); }
          to   { opacity: 1; transform: none; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: .5; transform: scale(1.6); }
        }
        @keyframes soundBar {
          from { transform: scaleY(0.4); opacity: 0.6; }
          to   { transform: scaleY(1);   opacity: 1; }
        }
      `}</style>
    </div>
  );
}