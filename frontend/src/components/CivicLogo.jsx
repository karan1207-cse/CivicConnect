export default function CivicLogo({ size = 44 }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div className="logo-mark" style={{ width: size, height: size }}>
        <svg viewBox="0 0 100 100" style={{ width: '78%', height: '78%' }}>
          <circle cx="50" cy="50" r="46" fill="none" stroke="#1a56db" strokeWidth="3.5" />
          <circle cx="50" cy="50" r="40" fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="3 2" />
          <polygon points="50,20 18,38 82,38" fill="#1a56db" />
          <polygon points="50,24 24,38 76,38" fill="#f59e0b" opacity="0.3" />
          <rect x="26" y="44" width="8" height="28" rx="2" fill="#1a56db" />
          <rect x="46" y="44" width="8" height="28" rx="2" fill="#1a56db" />
          <rect x="66" y="44" width="8" height="28" rx="2" fill="#1a56db" />
          <rect x="20" y="72" width="60" height="6" rx="2" fill="#1a56db" />
          <circle cx="50" cy="32" r="3.5" fill="#f59e0b" />
        </svg>
      </div>
      <div className="brand-text">
        <span className="brand-name">CivicConnect</span>
        <span className="brand-label">Grievance Portal</span>
      </div>
    </div>
  );
}
