import { useState } from 'react';
import EarthGlobe from './EarthGlobe';
import { API } from '../utils/API';

function PieChart({ fakePct }) {
  const r = 64, cx = 80, cy = 80, sw = 18;
  const circ = 2 * Math.PI * r;
  const realD = ((100 - fakePct) / 100) * circ;
  const fakeD = (fakePct / 100) * circ;
  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      <svg width="160" height="160" viewBox="0 0 160 160">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={sw} />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#34d399" strokeWidth={sw}
          strokeDasharray={`${realD} ${circ}`} strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cy})`} style={{ transition: 'stroke-dasharray 1.2s ease' }} />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f87171" strokeWidth={sw}
          strokeDasharray={`${fakeD} ${circ}`} strokeDashoffset={-realD} strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cy})`} style={{ transition: 'all 1.2s ease' }} />
      </svg>
      <div style={{
        position: 'absolute', inset: 0, display: 'flex',
        flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '1.8rem', fontWeight: 800, color: '#f87171', lineHeight: 1 }}>{fakePct}%</div>
        <div style={{ fontSize: '.65rem', color: '#9d97c0', marginTop: '2px' }}>Fake</div>
      </div>
    </div>
  );
}

function ReviewCard({ r }) {
  return (
    <div style={{
      background: 'rgba(30,22,60,0.75)',
      border: `1px solid ${r.isFake ? 'rgba(248,113,113,0.25)' : 'rgba(52,211,153,0.2)'}`,
      borderLeft: `3px solid ${r.isFake ? '#f87171' : '#34d399'}`,
      borderRadius: '14px', padding: '1.1rem 1.3rem',
      display: 'flex', flexDirection: 'column', gap: '9px',
      transition: 'transform .2s',
      boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
        <div style={{ fontSize: '.88rem', lineHeight: 1.65, color: '#f1f0ff', flex: 1 }}>"{r.text}"</div>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: '4px',
          padding: '3px 10px', borderRadius: '999px', fontSize: '.66rem', fontWeight: 700,
          whiteSpace: 'nowrap', flexShrink: 0,
          background: r.isFake ? 'rgba(248,113,113,0.1)' : 'rgba(52,211,153,0.1)',
          color: r.isFake ? '#f87171' : '#34d399',
          border: `1px solid ${r.isFake ? 'rgba(248,113,113,0.2)' : 'rgba(52,211,153,0.2)'}`,
        }}>
          {r.isFake ? '✕ Fake' : '✓ Genuine'}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ color: '#fbbf24', fontSize: '.8rem', letterSpacing: '2px' }}>
          {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '.68rem', color: '#9d97c0' }}>Confidence</span>
          <div style={{ width: '70px', height: '4px', background: 'rgba(255,255,255,0.12)', borderRadius: '999px', overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: '999px',
              width: `${r.confidence}%`,
              background: r.isFake ? '#f87171' : '#34d399',
              transition: 'width 1s ease',
            }} />
          </div>
          <span style={{ fontSize: '.7rem', fontWeight: 700, color: r.isFake ? '#f87171' : '#34d399', minWidth: '28px' }}>
            {r.confidence}%
          </span>
        </div>
      </div>

      {r.reasons?.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
          {r.reasons.map(reason => (
            <span key={reason} style={{
              fontSize: '.67rem', fontWeight: 600, padding: '2px 9px', borderRadius: '999px',
              background: 'rgba(248,113,113,0.08)', color: '#f87171',
              border: '1px solid rgba(248,113,113,0.18)',
            }}>{reason}</span>
          ))}
        </div>
      )}

      {r.explanation && (
        <div style={{
          fontSize: '.76rem', lineHeight: 1.6, padding: '8px 12px', borderRadius: '9px',
          background: r.isFake ? 'rgba(248,113,113,0.05)' : 'rgba(52,211,153,0.05)',
          color: r.isFake ? '#fca5a5' : '#6ee7b7',
          borderLeft: `2px solid ${r.isFake ? 'rgba(248,113,113,0.25)' : 'rgba(52,211,153,0.25)'}`,
        }}>
          <div style={{ fontWeight: 700, fontSize: '.62rem', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: '3px', color: '#3e3a58' }}>
            🤖 AI Analysis
          </div>
          {r.explanation}
        </div>
      )}
    </div>
  );
}

const s = {
  card: {
    background: 'rgba(30,22,60,0.75)',
    border: '1px solid rgba(139,92,246,0.18)',
    borderRadius: '16px',
    boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
  },
};

export default function DashboardPage({ data, onNewAnalysis }) {
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 9;
  if (!data) return null;

  const { reviews, fakePercentage, insights, source, backendError } = data;
  const fakeCount = reviews.filter(r => r.isFake).length;
  const realCount = reviews.length - fakeCount;
  const totalPages = Math.ceil(reviews.length / PAGE_SIZE);
  const pageReviews = reviews.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const maxBarTotal = insights?.ratingDistribution ? Math.max(...Object.values(insights.ratingDistribution), 1) : 1;

  const alertColor = fakePercentage >= 50 ? '#f87171' : fakePercentage >= 25 ? '#fbbf24' : '#34d399';
  const alertBg = fakePercentage >= 50 ? 'rgba(248,113,113,0.07)' : fakePercentage >= 25 ? 'rgba(251,191,36,0.07)' : 'rgba(52,211,153,0.07)';
  const alertBorder = fakePercentage >= 50 ? 'rgba(248,113,113,0.22)' : fakePercentage >= 25 ? 'rgba(251,191,36,0.22)' : 'rgba(52,211,153,0.22)';

  return (
    <div style={{ position: 'relative', zIndex: 1, minHeight: '100vh', paddingTop: '64px', overflowX: 'hidden' }}>

      {/* Globe — top right background */}
      <div style={{
        position: 'fixed', right: '-120px', top: '-60px',
        pointerEvents: 'none', zIndex: 0, opacity: 0.7,
      }}>
        <EarthGlobe size={520} speed={0.0013} geoData={API} />
      </div>

      <div style={{ position: 'relative', zIndex: 2, maxWidth: '900px', margin: '0 auto', padding: '2rem 1.5rem 4rem' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '1.4rem' }}>
          <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: '1.8rem', fontWeight: 800, color: '#f1f0ff' }}>
            Analysis Complete
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {source === 'demo' && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '5px 12px', borderRadius: '999px', fontSize: '.7rem', fontWeight: 700, background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.3)', color: '#a78bfa' }}>
                ⚡ Demo Mode Active
              </span>
            )}
            {source === 'live' && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '5px 12px', borderRadius: '999px', fontSize: '.7rem', fontWeight: 700, background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)', color: '#34d399' }}>
                🟢 Live Data
              </span>
            )}
            <button onClick={onNewAnalysis} style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              padding: '7px 16px', borderRadius: '999px', fontSize: '.78rem', fontWeight: 700,
              background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.3)',
              color: '#a78bfa', cursor: 'pointer', fontFamily: "'Syne',sans-serif",
            }}>
              ← New Analysis
            </button>
          </div>
        </div>

        {/* Alert */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          padding: '.85rem 1.2rem', borderRadius: '12px', fontSize: '.84rem', fontWeight: 500,
          marginBottom: '1.6rem', color: alertColor,
          background: alertBg, border: `1px solid ${alertBorder}`,
        }}>
          {fakePercentage >= 50 && `⚠️ High Fake Activity — ${fakePercentage}% of reviews appear suspicious. Be cautious with this product.`}
          {fakePercentage >= 25 && fakePercentage < 50 && `🔶 Moderate Concern — ${fakePercentage}% show suspicious patterns.`}
          {fakePercentage < 25 && `✅ Mostly Genuine — Only ${fakePercentage}% flagged. Looks trustworthy.`}
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '12px', marginBottom: '1.6rem' }}>
          {[
            { icon: '🔍', label: 'TOTAL REVIEWS', value: reviews.length, color: '#a78bfa' },
            { icon: '🚨', label: 'FAKE DETECTED', value: fakeCount, color: '#f87171' },
            { icon: '✅', label: 'GENUINE REVIEWS', value: realCount, color: '#34d399' },
            { icon: '📊', label: 'FAKE RATE', value: fakePercentage + '%', color: fakePercentage > 50 ? '#f87171' : fakePercentage > 25 ? '#fbbf24' : '#34d399' },
          ].map((st, i) => (
            <div key={st.label} style={{
              ...s.card, padding: '1.2rem 1.1rem',
              animationDelay: `${i * 0.06}s`,
            }}>
              <div style={{ fontSize: '1.2rem', marginBottom: '.6rem' }}>{st.icon}</div>
              <div style={{ fontSize: '.62rem', fontWeight: 700, color: '#9d97c0', textTransform: 'uppercase', letterSpacing: '.09em', marginBottom: '6px' }}>{st.label}</div>
              <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 'clamp(1.4rem,2.2vw,2rem)', fontWeight: 800, color: st.color, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{st.value}</div>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '1.6rem' }}>
          {/* Pie */}
          <div style={{ ...s.card, padding: '1.5rem' }}>
            <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '.9rem', fontWeight: 700, marginBottom: '1.2rem' }}>Authenticity Breakdown</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.8rem', flexWrap: 'wrap', justifyContent: 'center' }}>
              <PieChart fakePct={fakePercentage} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[
                  { color: '#f87171', label: 'Fake Reviews', count: fakeCount },
                  { color: '#34d399', label: 'Genuine Reviews', count: realCount },
                ].map(l => (
                  <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '9px', height: '9px', borderRadius: '50%', background: l.color, flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: '.78rem', color: '#9d97c0' }}>{l.label}</div>
                      <div style={{ fontWeight: 700, fontSize: '.88rem', color: '#f1f0ff' }}>{l.count} review{l.count !== 1 ? 's' : ''}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bar chart */}
          <div style={{ ...s.card, padding: '1.5rem' }}>
            <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '.9rem', fontWeight: 700, marginBottom: '1.2rem' }}>Ratings vs Fake Detection</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[5, 4, 3, 2, 1].map(star => {
                const total = insights?.ratingDistribution?.[star] || 0;
                const fakes = insights?.fakeByRating?.[star] || 0;
                const realW = Math.round(((total - fakes) / maxBarTotal) * 100);
                const fakeW = Math.round((fakes / maxBarTotal) * 100);
                return (
                  <div key={star} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ fontSize: '.73rem', fontWeight: 600, color: '#9d97c0', width: '26px', flexShrink: 0, textAlign: 'right' }}>{star}★</div>
                    <div style={{ flex: 1, height: '10px', background: 'rgba(255,255,255,0.08)', borderRadius: '999px', overflow: 'hidden', position: 'relative' }}>
                      <div style={{ height: '100%', borderRadius: '999px', background: '#34d399', width: `${realW}%`, transition: 'width 1s ease', minWidth: total > 0 ? '3px' : 0 }} />
                      <div style={{ height: '100%', borderRadius: '999px', background: '#f87171', width: `${fakeW}%`, position: 'absolute', top: 0, left: `${realW}%`, transition: 'width 1s ease' }} />
                    </div>
                    <div style={{ fontSize: '.7rem', fontWeight: 700, color: '#9d97c0', width: '20px', flexShrink: 0 }}>{total}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Insights */}
        <div style={{ ...s.card, padding: '1.5rem', marginBottom: '1.6rem' }}>
          <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '.9rem', fontWeight: 700, marginBottom: '1.1rem' }}>🔎 Pattern Insights</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.2rem' }}>
            <div>
              <div style={{ fontSize: '.62rem', fontWeight: 700, color: '#9d97c0', textTransform: 'uppercase', letterSpacing: '.09em', marginBottom: '8px' }}>⚠️ Suspicious Patterns</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {insights?.suspiciousPatterns?.length > 0
                  ? insights.suspiciousPatterns.map(p => (
                    <span key={p} style={{ fontSize: '.68rem', fontWeight: 600, padding: '3px 10px', borderRadius: '999px', background: 'rgba(248,113,113,0.1)', color: '#f87171', border: '1px solid rgba(248,113,113,0.18)' }}>⚠ {p}</span>
                  ))
                  : <span style={{ fontSize: '.78rem', color: '#3e3a58', fontStyle: 'italic' }}>No suspicious patterns found</span>}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '.62rem', fontWeight: 700, color: '#9d97c0', textTransform: 'uppercase', letterSpacing: '.09em', marginBottom: '8px' }}>🔁 Repeated Words Found</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {insights?.repeatedWords?.length > 0
                  ? insights.repeatedWords.map(w => (
                    <span key={w} style={{ fontSize: '.68rem', fontWeight: 600, padding: '3px 10px', borderRadius: '999px', background: 'rgba(139,92,246,0.1)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.18)' }}>{w}</span>
                  ))
                  : <span style={{ fontSize: '.78rem', color: '#3e3a58', fontStyle: 'italic' }}>No repeated words found</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Reviews */}
        <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', color: '#f1f0ff' }}>
          Review Analysis
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {pageReviews.map((r, i) => <ReviewCard key={i} r={r} />)}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginTop: '20px', flexWrap: 'wrap' }}>
            <button disabled={page === 0} onClick={() => { setPage(p => p - 1); window.scrollTo(0, 0); }} style={{
              padding: '7px 16px', borderRadius: '999px', border: '1px solid rgba(139,92,246,0.2)',
              background: 'rgba(30,22,60,0.75)', color: '#9d97c0', fontSize: '.78rem', fontWeight: 600,
              cursor: page === 0 ? 'default' : 'pointer', opacity: page === 0 ? .35 : 1,
            }}>← Prev</button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button key={i} onClick={() => { setPage(i); window.scrollTo(0, 0); }} style={{
                width: '34px', height: '34px', borderRadius: '50%', fontSize: '.8rem', fontWeight: 600,
                cursor: 'pointer', fontFamily: "'Syne',sans-serif",
                background: i === page ? '#8b5cf6' : 'rgba(30,22,60,0.75)',
                border: `1px solid ${i === page ? '#8b5cf6' : 'rgba(139,92,246,0.2)'}`,
                color: i === page ? '#fff' : '#9d97c0',
                boxShadow: i === page ? '0 0 15px rgba(139,92,246,0.5)' : 'none',
              }}>{i + 1}</button>
            ))}
            <button disabled={page === totalPages - 1} onClick={() => { setPage(p => p + 1); window.scrollTo(0, 0); }} style={{
              padding: '7px 16px', borderRadius: '999px', border: '1px solid rgba(139,92,246,0.2)',
              background: 'rgba(30,22,60,0.75)', color: '#9d97c0', fontSize: '.78rem', fontWeight: 600,
              cursor: page === totalPages - 1 ? 'default' : 'pointer', opacity: page === totalPages - 1 ? .35 : 1,
            }}>Next →</button>
          </div>
        )}
      </div>
    </div>
  );
}