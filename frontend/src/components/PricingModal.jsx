import { useState } from 'react';

const plans = [
  {
    id: 'free',
    name: 'Free',
    tagline: 'Explore FakeGuard',
    price: { monthly: 0, yearly: 0 },
    cta: 'Start for Free',
    ctaStyle: 'ghost',
    features: [
      'Demo mode analysis',
      'Up to 5 scans / day',
      'Basic fake detection',
      'Review pattern insights',
      'Email support',
    ],
    badge: null,
  },
  {
    id: 'pro',
    name: 'Pro',
    tagline: 'For power researchers',
    price: { monthly: 17, yearly: 14 },
    cta: 'Get Pro Plan',
    ctaStyle: 'primary',
    features: [
      'Unlimited live scans',
      'Amazon & Flipkart support',
      'Advanced AI detection',
      'Full review export (CSV)',
      'Priority processing',
      'API access (500 req/mo)',
    ],
    badge: 'MOST POPULAR',
    highlight: true,
  },
  {
    id: 'max',
    name: 'Max',
    tagline: 'Higher limits, priority access',
    price: { monthly: 100, yearly: 83 },
    cta: 'Get Max Plan',
    ctaStyle: 'ghost',
    features: [
      'Everything in Pro',
      '5× or 20× more scans',
      'Bulk URL batch analysis',
      'White-label reports',
      'Dedicated support',
      'Unlimited API access',
      'Early feature access',
    ],
    badge: null,
  },
];

export default function PricingModal({ onClose }) {
  const [billing, setBilling] = useState('yearly');

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 50, overflowY: 'auto',
      background: 'rgba(6, 5, 18, 0.96)', backdropFilter: 'blur(20px)',
      animation: 'fadeIn .3s ease both',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      paddingTop: '80px', paddingBottom: '60px',
    }}>
      {/* Close button */}
      <button
        onClick={onClose}
        title="Close"
        style={{
          position: 'fixed', top: '18px', right: '24px',
          width: '38px', height: '38px', borderRadius: '50%',
          background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
          color: '#9d97c0', fontSize: '1.1rem',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', transition: 'all .2s', zIndex: 51, lineHeight: 1,
        }}
        onMouseEnter={e => { e.currentTarget.style.background='rgba(139,92,246,0.22)'; e.currentTarget.style.color='#fff'; e.currentTarget.style.borderColor='rgba(139,92,246,0.5)'; }}
        onMouseLeave={e => { e.currentTarget.style.background='rgba(255,255,255,0.06)'; e.currentTarget.style.color='#9d97c0'; e.currentTarget.style.borderColor='rgba(255,255,255,0.12)'; }}
      >✕</button>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '2.8rem', animation: 'slideUp .45s ease both', padding: '0 1rem' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '7px',
          background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.3)',
          padding: '5px 18px', borderRadius: '999px',
          fontSize: '.65rem', color: '#a78bfa', fontWeight: 700,
          letterSpacing: '.13em', textTransform: 'uppercase', marginBottom: '1.2rem',
        }}>
          <span style={{ width:'6px',height:'6px',background:'#34d399',borderRadius:'50%',animation:'pulse 2s infinite',flexShrink:0 }} />
          Plans That Grow With You
        </div>

        <h1 style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: 'clamp(2rem, 5vw, 4rem)',
          fontWeight: 800,
          background: 'linear-gradient(160deg, #ffffff 0%, #e8e2ff 30%, #c4b5fd 65%, #a855f7 100%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          margin: '0 0 .6rem', lineHeight: 1.05, letterSpacing: '-0.02em',
        }}>
          Choose Your Plan
        </h1>

        <p style={{ fontSize: '.95rem', color: '#6b6890', margin: '0 0 2rem', fontFamily: "'Nunito Sans', sans-serif" }}>
          Start free. Upgrade when you need more power.
        </p>

        {/* Billing toggle */}
        <div style={{
          display: 'inline-flex', alignItems: 'center',
          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(139,92,246,0.2)',
          borderRadius: '999px', padding: '5px',
        }}>
          {['monthly', 'yearly'].map(b => (
            <button key={b} onClick={() => setBilling(b)} style={{
              padding: '8px 22px', borderRadius: '999px',
              fontSize: '.78rem', fontWeight: 700, cursor: 'pointer',
              transition: 'all .22s', fontFamily: "'Syne', sans-serif",
              background: billing === b ? 'linear-gradient(135deg, #6d28d9, #8b5cf6)' : 'transparent',
              color: billing === b ? '#fff' : '#6b6890', border: 'none',
              boxShadow: billing === b ? '0 0 14px rgba(109,40,217,0.45)' : 'none',
              letterSpacing: '.04em',
            }}>
              {b === 'monthly' ? 'Monthly' : (
                <span style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                  Yearly
                  <span style={{ background:'rgba(52,211,153,0.2)',color:'#34d399',fontSize:'.6rem',padding:'2px 8px',borderRadius:'999px',fontWeight:800,letterSpacing:'.06em' }}>
                    SAVE 17%
                  </span>
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Plans grid — responsive via inline media query workaround using CSS class */}
      <div className="pricing-grid" style={{
        width: '100%', maxWidth: '1120px',
        padding: '0 clamp(.75rem,3vw,2rem)',
        animation: 'slideUp .55s ease .1s both',
        alignItems: 'start',
      }}>
        {plans.map((plan) => (
          <PlanCard key={plan.id} plan={plan} billing={billing} onClose={onClose} />
        ))}
      </div>

      <p style={{ marginTop:'2.4rem',fontSize:'.75rem',color:'#3e3a58',animation:'slideUp .55s ease .2s both',fontFamily:"'Nunito Sans', sans-serif",letterSpacing:'.02em',textAlign:'center',padding:'0 1rem' }}>
        No commitment · Cancel anytime · Secure payments via Stripe
      </p>

      <style>{`
        @keyframes fadeIn  { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { opacity:0; transform:translateY(28px) } to { opacity:1; transform:none } }
        @keyframes pulse   { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(1.6)} }
        @keyframes shimmer { 0%{background-position:200% center} 100%{background-position:-200% center} }
        .pricing-grid{display:grid;grid-template-columns:repeat(3,minmax(0,360px));gap:20px;}
        @media(max-width:900px){.pricing-grid{grid-template-columns:repeat(2,minmax(0,1fr));}}
        @media(max-width:600px){.pricing-grid{grid-template-columns:1fr;}}
      `}</style>
    </div>
  );
}

function PlanCard({ plan, billing, onClose }) {
  const price = plan.price[billing];
  const isHighlighted = plan.highlight;

  return (
    <div style={{
      position: 'relative',
      background: isHighlighted
        ? 'linear-gradient(160deg, rgba(109,40,217,0.2) 0%, rgba(28,20,58,0.9) 100%)'
        : 'rgba(16, 12, 36, 0.75)',
      border: isHighlighted ? '1px solid rgba(139,92,246,0.55)' : '1px solid rgba(139,92,246,0.14)',
      borderRadius: '22px', padding: '2.2rem 1.8rem 1.8rem',
      display: 'flex', flexDirection: 'column',
      boxShadow: isHighlighted ? '0 0 70px rgba(109,40,217,0.22), 0 0 0 1px rgba(139,92,246,0.15)' : 'none',
      transition: 'transform .22s, box-shadow .22s',
      marginTop: isHighlighted ? '-12px' : '0',
    }}
    onMouseEnter={e => {
      e.currentTarget.style.transform = 'translateY(-5px)';
      e.currentTarget.style.boxShadow = isHighlighted ? '0 0 90px rgba(109,40,217,0.38), 0 0 0 1px rgba(139,92,246,0.3)' : '0 0 40px rgba(109,40,217,0.14)';
    }}
    onMouseLeave={e => {
      e.currentTarget.style.transform = '';
      e.currentTarget.style.boxShadow = isHighlighted ? '0 0 70px rgba(109,40,217,0.22), 0 0 0 1px rgba(139,92,246,0.15)' : 'none';
    }}
    >
      {plan.badge && (
        <div style={{
          position:'absolute',top:'-14px',left:'50%',transform:'translateX(-50%)',
          background:'linear-gradient(90deg, #6d28d9, #8b5cf6, #a78bfa, #8b5cf6, #6d28d9)',
          backgroundSize:'200% auto',animation:'shimmer 3s linear infinite',
          color:'#fff',fontSize:'.62rem',fontWeight:800,padding:'5px 18px',
          borderRadius:'999px',letterSpacing:'.1em',whiteSpace:'nowrap',
          boxShadow:'0 0 18px rgba(139,92,246,0.65)',fontFamily:"'Syne', sans-serif",
        }}>
          ✦ {plan.badge}
        </div>
      )}

      <div style={{ width:'44px',height:'44px',borderRadius:'12px',background:isHighlighted?'rgba(139,92,246,0.25)':'rgba(139,92,246,0.08)',border:`1px solid ${isHighlighted?'rgba(139,92,246,0.5)':'rgba(139,92,246,0.15)'}`,display:'flex',alignItems:'center',justifyContent:'center',marginBottom:'1.2rem',boxShadow:isHighlighted?'0 0 18px rgba(109,40,217,0.35)':'none' }}>
        <svg viewBox="0 0 18 18" fill="none" width="20" height="20">
          <path d="M9 2L2 6v6l7 4 7-4V6L9 2z" stroke={isHighlighted?'#c4b5fd':'#7c5cbf'} strokeWidth="1.5" strokeLinejoin="round"/>
          <path d="M9 10l-3-2m3 2l3-2m-3 2v4" stroke={isHighlighted?'#a78bfa':'#6d4fa0'} strokeWidth="1.2" strokeLinecap="round"/>
        </svg>
      </div>

      <div style={{ fontFamily:"'Syne', sans-serif",fontSize:'1.25rem',fontWeight:800,color:'#f1f0ff',marginBottom:'.25rem',letterSpacing:'-0.01em' }}>{plan.name}</div>
      <div style={{ fontSize:'.78rem',color:'#6b6890',marginBottom:'1.5rem',fontFamily:"'Nunito Sans', sans-serif" }}>{plan.tagline}</div>

      <div style={{ marginBottom:'1.8rem',minHeight:'64px',display:'flex',alignItems:'flex-end',gap:'8px' }}>
        <span style={{ fontFamily:"'Syne', sans-serif",fontSize:'2.8rem',fontWeight:800,color:'#f1f0ff',lineHeight:1,fontVariantNumeric:'tabular-nums',letterSpacing:'-0.02em' }}>
          ${price}
        </span>
        {price !== 0 && (
          <span style={{ fontSize:'.72rem',color:'#6b6890',paddingBottom:'8px',lineHeight:1.5,fontFamily:"'Nunito Sans', sans-serif" }}>
            USD / mo<br />
            <span style={{ color:'#4a4670' }}>{billing === 'yearly' ? 'billed annually' : 'billed monthly'}</span>
          </span>
        )}
      </div>

      <button onClick={onClose} style={{
        width:'100%',padding:'.8rem',borderRadius:'12px',fontSize:'.85rem',fontWeight:700,
        fontFamily:"'Syne', sans-serif",cursor:'pointer',transition:'all .22s',marginBottom:'1.6rem',letterSpacing:'.03em',
        ...(plan.ctaStyle === 'primary' ? {
          background:'linear-gradient(135deg, #6d28d9 0%, #8b5cf6 60%, #a78bfa 100%)',
          color:'#fff',border:'none',boxShadow:'0 0 26px rgba(109,40,217,0.55)',
        } : {
          background:'transparent',color:'#c4b5fd',border:'1px solid rgba(139,92,246,0.35)',
        }),
      }}
      onMouseEnter={e => {
        if (plan.ctaStyle === 'primary') { e.currentTarget.style.boxShadow='0 0 44px rgba(109,40,217,0.75)'; e.currentTarget.style.transform='translateY(-2px)'; }
        else { e.currentTarget.style.background='rgba(139,92,246,0.12)'; e.currentTarget.style.borderColor='rgba(139,92,246,0.6)'; e.currentTarget.style.transform='translateY(-2px)'; }
      }}
      onMouseLeave={e => {
        if (plan.ctaStyle === 'primary') { e.currentTarget.style.boxShadow='0 0 26px rgba(109,40,217,0.55)'; e.currentTarget.style.transform=''; }
        else { e.currentTarget.style.background='transparent'; e.currentTarget.style.borderColor='rgba(139,92,246,0.35)'; e.currentTarget.style.transform=''; }
      }}
      >{plan.cta}</button>

      <div style={{ height:'1px',background:'rgba(139,92,246,0.12)',marginBottom:'1.3rem' }} />

      <div style={{ display:'flex',flexDirection:'column',gap:'10px' }}>
        {plan.features.map(feat => (
          <div key={feat} style={{ display:'flex',alignItems:'flex-start',gap:'10px',fontSize:'.82rem',color:'#b8b3d8',fontFamily:"'Nunito Sans', sans-serif" }}>
            <span style={{ width:'17px',height:'17px',borderRadius:'50%',background:isHighlighted?'rgba(139,92,246,0.25)':'rgba(139,92,246,0.1)',border:`1px solid ${isHighlighted?'rgba(139,92,246,0.5)':'rgba(139,92,246,0.2)'}`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,marginTop:'1px',fontSize:'.55rem',color:'#a78bfa',fontWeight:800 }}>✓</span>
            {feat}
          </div>
        ))}
      </div>
    </div>
  );
}