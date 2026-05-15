import { useState, useRef } from 'react';
import EarthGlobe from './EarthGlobe';
import { API } from '../utils/API';

export default function SearchPage({ onAnalyze, onDemo }) {
  const [url, setUrl] = useState('');
  const inputRef = useRef(null);

  const handleSubmit = () => {
    if (!url.trim()) {
      onDemo();
    } else {
      onAnalyze(url.trim());
    }
  };

  return (
    <div className="page-search">
      {/* Globe background — right side, half visible */}
      <div className="search-globe-container">
        <EarthGlobe size={720} speed={0.0013} geoData={API} />
      </div>

      <div className="search-content">
        <div className="eyebrow" style={{ marginBottom: '1.1rem' }}>
          🔗 Paste Product URL
        </div>

        <h1 className="search-h1">
          Analyze Any Product<br />
          <span className="gradient-text">in Seconds</span>
        </h1>

        <p className="search-sub">
          Paste an Amazon or Flipkart product URL below. Our engine scrapes up
          to 30 reviews and runs AI-powered fake detection — leave blank to try
          Demo Mode.
        </p>

        <div className="search-box">
          <div className="url-row">
            <input
              ref={inputRef}
              type="url"
              className="url-input"
              placeholder="https://www.amazon.in/dp/... or flipkart.com/..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            />
            <button className="btn-analyze" onClick={handleSubmit}>
              Analyze Reviews
            </button>
          </div>
          <p className="url-hint">
            Leave blank for{' '}
            <span className="link" onClick={onDemo}>
              Demo Mode
            </span>{' '}
            — no URL needed
          </p>
        </div>

        <div className="supported-sites">
          {[
            { color: '#f97316', label: 'Flipkart' },
            { color: '#3b82f6', label: 'Amazon India' },
            { color: '#3e3a58', label: 'More coming soon' },
          ].map((s) => (
            <div className="site-badge" key={s.label}>
              <div className="site-dot" style={{ background: s.color }} />
              {s.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}