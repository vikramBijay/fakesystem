import { useEffect, useRef, useState } from 'react';
import EarthGlobe from './EarthGlobe';
import { API } from '../utils/API';

const STEPS = [
  { id: 'step1', icon: '🔍', label: 'Crawling review sources' },
  { id: 'step2', icon: '🧠', label: 'Analyzing patterns' },
  { id: 'step3', icon: '🛡️', label: 'Detecting suspicious activity' },
];

export default function LoadingPage({ active }) {
  const [progress, setProgress] = useState({ step1: 0, step2: 0, step3: 0 });
  const [activeStep, setActiveStep] = useState(0);
  const timers = useRef([]);

  useEffect(() => {
    if (!active) return;
    timers.current.forEach(clearTimeout);
    setProgress({ step1: 0, step2: 0, step3: 0 });
    setActiveStep(0);
    timers.current.push(setTimeout(() => { setProgress(p => ({ ...p, step1: 100 })); setActiveStep(1); }, 300));
    timers.current.push(setTimeout(() => { setProgress(p => ({ ...p, step2: 72 })); setActiveStep(2); }, 3200));
    timers.current.push(setTimeout(() => { setProgress(p => ({ ...p, step3: 45 })); setActiveStep(3); }, 7000));
    return () => timers.current.forEach(clearTimeout);
  }, [active]);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden', paddingTop: '64px',
    }}>
      {/* Globe — bottom right, clipped */}
      <div style={{
        position: 'absolute', right: '-80px', bottom: '-100px',
        pointerEvents: 'none', zIndex: 0, opacity: 0.7,
        width: '520px', height: '520px', flexShrink: 0,
        overflow: 'hidden',
      }}>
        <EarthGlobe size={520} speed={0.004} geoData={API} />
      </div>

      {/* Card */}
      <div style={{
        position: 'relative', zIndex: 2,
        background: 'rgba(12,10,28,0.75)',
        border: '1px solid rgba(139,92,246,0.22)',
        borderRadius: '24px',
        padding: '2.8rem 2.6rem',
        textAlign: 'center',
        width: '100%', maxWidth: '520px',
        margin: '2rem',
        backdropFilter: 'blur(18px)',
        boxShadow: '0 0 60px rgba(109,40,217,0.15), 0 0 0 1px rgba(139,92,246,0.1)',
        animation: 'fadeUp .4s ease both',
      }}>

        {/* Spinner */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.6rem' }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '50%',
            border: '3px solid rgba(139,92,246,0.15)',
            borderTop: '3px solid #8b5cf6',
            borderRight: '3px solid #a78bfa',
            animation: 'spin 1s linear infinite',
          }} />
        </div>

        <div style={{
          fontFamily: "'Syne', sans-serif", fontSize: '1.5rem',
          fontWeight: 800, color: '#f1f0ff', marginBottom: '.4rem',
        }}>
          Scanning Reviews...
        </div>
        <div style={{ fontSize: '.88rem', color: '#9d97c0', marginBottom: '2rem' }}>
          Running AI detection algorithms
        </div>

        {/* Steps */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {STEPS.map((step, i) => {
            const done = activeStep > i;
            return (
              <div key={step.id} style={{
                display: 'flex', alignItems: 'center', gap: '14px',
                background: done ? 'rgba(139,92,246,0.08)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${done ? 'rgba(139,92,246,0.25)' : 'rgba(255,255,255,0.06)'}`,
                borderRadius: '12px', padding: '.9rem 1.1rem',
                transition: 'all .4s ease',
                textAlign: 'left',
              }}>
                {/* Icon box */}
                <div style={{
                  width: '36px', height: '36px', borderRadius: '9px', flexShrink: 0,
                  background: done ? 'rgba(139,92,246,0.2)' : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${done ? 'rgba(139,92,246,0.4)' : 'rgba(255,255,255,0.08)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1rem', transition: 'all .4s',
                }}>
                  {step.icon}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: '.84rem', fontWeight: 600, color: done ? '#f1f0ff' : '#9d97c0',
                    marginBottom: '6px', transition: 'color .3s',
                  }}>
                    {step.label}
                  </div>
                  {/* Progress bar */}
                  <div style={{
                    height: '3px', background: 'rgba(255,255,255,0.06)',
                    borderRadius: '999px', overflow: 'hidden',
                  }}>
                    <div style={{
                      height: '100%', borderRadius: '999px',
                      width: `${progress[step.id]}%`,
                      background: 'linear-gradient(90deg, #6d28d9, #8b5cf6, #a78bfa)',
                      transition: 'width 1.8s cubic-bezier(.4,0,.2,1)',
                      boxShadow: '0 0 8px rgba(139,92,246,0.6)',
                    }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(30px); } to { opacity:1; transform:none; } }
      `}</style>
    </div>
  );
}