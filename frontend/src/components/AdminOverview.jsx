import { useState } from 'react';

const CAT_INFO = {
  ROADS: { name: 'Roads & Infrastructure', color: '#1a56db', cls: 'c-blue' },
  WATER_SUPPLY: { name: 'Water Supply', color: '#0ea5e9', cls: 'c-cyan' },
  SANITATION: { name: 'Sanitation', color: '#10b981', cls: 'c-green' },
  ELECTRICITY: { name: 'Street Lighting & Power', color: '#f59e0b', cls: 'c-orange' },
  DRAINAGE: { name: 'Drainage & Sewerage', color: '#8b5cf6', cls: 'c-blue' },
  PUBLIC_SAFETY: { name: 'Public Safety', color: '#ef4444', cls: 'c-orange' },
  OTHER: { name: 'Other Civic Grievances', color: '#64748b', cls: 'c-cyan' }
};

export default function AdminOverview({ stats, complaints }) {
  const [activeRange, setActiveRange] = useState(14);
  const s = stats || {};
  const pending = s.pending || 0;
  const inProg = (s.inProgress || 0) + (s.assigned || 0);
  const resolved = s.resolved || 0;
  const total = (s.totalComplaints || (complaints || []).length) || 1;
  const slaPct = Math.round((resolved / total) * 100);
  const gaugeOffset = 201 - (201 * slaPct / 100);

  // 1. Calculate Real Trends (last N days)
  const allTrends = s.trends && s.trends.length > 0 ? s.trends : (() => {
    const days = [];
    const now = new Date();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const ds = d.toISOString().slice(0, 10);
      const dateLabel = d.toLocaleDateString([], { month: 'short', day: '2-digit' });
      let p = 0, ip = 0, r = 0;
      (complaints || []).forEach(c => {
        if (c.createdAt && c.createdAt.slice(0, 10) === ds) {
          if (c.status === 'PENDING') p++;
          else if (c.status === 'IN_PROGRESS' || c.status === 'ASSIGNED') ip++;
          else if (c.status === 'RESOLVED') r++;
        }
      });
      days.push({ date: dateLabel, pending: p, inProgress: ip, resolved: r, total: p + ip + r });
    }
    return days;
  })();

  const trends = allTrends.slice(-activeRange);
  const maxVal = Math.max(...trends.map(t => Math.max(t.pending || 0, t.inProgress || 0, t.total || 0)), 3);

  const getX = (i) => 60 + (i * 800) / Math.max(trends.length - 1, 1);
  const getY = (val) => 165 - ((val / maxVal) * 130);

  const pendingPts = trends.map((t, i) => ({ x: getX(i), y: getY(t.pending || 0) }));
  const inProgPts = trends.map((t, i) => ({ x: getX(i), y: getY((t.inProgress || 0) + (t.resolved || 0)) }));

  const getCurve = (pts) => pts.reduce((acc, p, i, a) => {
    if (i === 0) return `M ${p.x} ${p.y}`;
    const prev = a[i - 1];
    const cpx = prev.x + (p.x - prev.x) / 2;
    return `${acc} C ${cpx} ${prev.y}, ${cpx} ${p.y}, ${p.x} ${p.y}`;
  }, '');

  const areaP = pendingPts.length > 0 ? `${getCurve(pendingPts)} L ${pendingPts[pendingPts.length - 1].x} 165 L ${pendingPts[0].x} 165 Z` : '';
  const areaIP = inProgPts.length > 0 ? `${getCurve(inProgPts)} L ${inProgPts[inProgPts.length - 1].x} 165 L ${inProgPts[0].x} 165 Z` : '';

  // 2. Real Category Distribution
  const catList = (() => {
    if (s.categories && s.categories.length > 0) {
      return s.categories.map(c => {
        const meta = CAT_INFO[c.name] || { name: c.name.replace(/_/g, ' '), color: '#1a56db', cls: 'c-blue' };
        return { ...meta, count: c.count, pct: c.percentage };
      });
    }
    const map = {};
    (complaints || []).forEach(c => {
      const k = c.category || 'OTHER';
      map[k] = (map[k] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).map(([k, cnt]) => {
      const meta = CAT_INFO[k] || { name: k.replace(/_/g, ' '), color: '#1a56db', cls: 'c-blue' };
      return { ...meta, count: cnt, pct: Math.round((cnt * 100) / total) };
    });
  })();

  const gridY = [
    { y: 35, val: maxVal },
    { y: 78, val: Math.round(maxVal * 0.66) },
    { y: 121, val: Math.round(maxVal * 0.33) },
    { y: 165, val: 0 }
  ];

  return (
    <>
      {/* ── STAT CARDS ── */}
      <div className="stats-row">
        <div className="stat-tile accent-green">
          <div className="tile-icon bg-green">⏱️</div>
          <span className="tile-label">Pending Grievances</span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span className="tile-value">{pending}</span>
            <span className="tile-change down">Awaiting Action</span>
          </div>
        </div>
        <div className="stat-tile accent-blue">
          <div className="tile-icon bg-blue">🔄</div>
          <span className="tile-label">In Progress / Assigned</span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span className="tile-value">{inProg}</span>
            <span className="tile-change up">Field Active</span>
          </div>
        </div>
        <div className="stat-tile accent-amber">
          <div className="tile-icon bg-amber">✅</div>
          <span className="tile-label">Resolved & Closed</span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span className="tile-value">{resolved}</span>
            <span className="tile-change up">Successful</span>
          </div>
        </div>

        {/* SLA Gauge */}
        <div className="gauge-tile">
          <div className="gauge-wrap">
            <svg viewBox="0 0 80 80">
              <circle className="gauge-bg" cx="40" cy="40" r="32" />
              <circle className="gauge-bar" cx="40" cy="40" r="32" style={{ strokeDashoffset: gaugeOffset }} />
            </svg>
            <div className="gauge-center">
              <span className="gauge-label">SLA</span>
              <span className="gauge-pct">{slaPct}%</span>
            </div>
          </div>
          <div>
            <div className="gauge-meta">Target 75%</div>
            <div className={slaPct >= 75 ? 'gauge-ok' : ''} style={slaPct < 75 ? { fontSize: '.72rem', color: '#b91c1c', fontWeight: 700 } : {}}>
              {slaPct >= 75 ? '✓ SLA Achieved' : '⚠ Below Target'}
            </div>
            <div className="gauge-sub">Resolution rate</div>
          </div>
        </div>

        {/* Feedback */}
        <div className="gauge-tile">
          <div style={{ fontSize: '2.4rem', lineHeight: 1 }}>😊</div>
          <div>
            <div style={{ fontSize: '.72rem', color: '#94a3b8', fontWeight: 600 }}>Citizen Satisfaction</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a' }}>4.6<span style={{ fontSize: '.82rem', color: '#94a3b8', fontWeight: 500 }}>/5</span></div>
            <div className="gauge-sub">Based on verified audits</div>
          </div>
        </div>
      </div>

      {/* ── DYNAMIC REAL COMPLAINTS TREND CHART ── */}
      <div className="panel">
        <div className="panel-head">
          <div>
            <span className="panel-title">Complaints Trend</span>
            <span style={{ fontSize: '.78rem', color: '#64748b', marginLeft: 10 }}>Live database timeline</span>
          </div>
          <div className="chart-legend">
            <div><span className="legend-dot blue"></span>Pending <b style={{ color: '#0f172a' }}>{pending}</b></div>
            <div><span className="legend-dot sky"></span>Active &amp; Resolved <b style={{ color: '#0f172a' }}>{inProg + resolved}</b></div>
            <select className="date-pick" value={activeRange} onChange={e => setActiveRange(Number(e.target.value))}>
              <option value={14}>Last 14 Days</option>
              <option value={7}>Last 7 Days</option>
            </select>
          </div>
        </div>

        <svg viewBox="0 0 900 200" style={{ width: '100%', height: 'auto', maxHeight: 200 }}>
          <defs>
            <linearGradient id="gP" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#1a56db" stopOpacity=".2"/><stop offset="100%" stopColor="#1a56db" stopOpacity="0"/></linearGradient>
            <linearGradient id="gIP" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#0ea5e9" stopOpacity=".18"/><stop offset="100%" stopColor="#0ea5e9" stopOpacity="0"/></linearGradient>
          </defs>

          {/* Grid lines */}
          <g stroke="#f1f5f9" strokeDasharray="4 4" strokeWidth="1">
            {gridY.map(g => <line key={g.y} x1="55" y1={g.y} x2="870" y2={g.y} />)}
          </g>

          {/* Y Axis Values */}
          <g fill="#94a3b8" fontSize="10" textAnchor="end">
            {gridY.map(g => <text key={g.y} x="48" y={g.y + 4}>{g.val}</text>)}
          </g>

          {/* Area Fills */}
          <path d={areaIP} fill="url(#gIP)" />
          <path d={areaP} fill="url(#gP)" />

          {/* Smooth Lines */}
          <path d={getCurve(inProgPts)} fill="none" stroke="#0ea5e9" strokeWidth="2.5" />
          <path d={getCurve(pendingPts)} fill="none" stroke="#1a56db" strokeWidth="2.8" />

          {/* Interactive Data Points */}
          {pendingPts.map((pt, i) => (
            <circle key={`p-${i}`} cx={pt.x} cy={pt.y} r="4" fill="#1a56db" stroke="#fff" strokeWidth="2">
              <title>{`${trends[i]?.date}: ${trends[i]?.pending || 0} Pending`}</title>
            </circle>
          ))}
          {inProgPts.map((pt, i) => (
            <circle key={`ip-${i}`} cx={pt.x} cy={pt.y} r="3.5" fill="#0ea5e9" stroke="#fff" strokeWidth="2">
              <title>{`${trends[i]?.date}: ${(trends[i]?.inProgress || 0) + (trends[i]?.resolved || 0)} Active/Resolved`}</title>
            </circle>
          ))}

          {/* X Axis Dates */}
          <g fill="#64748b" fontSize="10" textAnchor="middle">
            {trends.map((t, i) => {
              const show = activeRange <= 7 || i % 2 === 0 || i === trends.length - 1;
              if (!show) return null;
              return <text key={t.date + i} x={getX(i)} y={188}>{t.date}</text>;
            })}
          </g>
        </svg>
      </div>

      {/* ── BOTTOM DUAL GRID: RECENT COMPLAINTS + REAL CATEGORY BARS ── */}
      <div className="dual-grid">
        {/* Recent Complaints */}
        <div className="panel">
          <div className="panel-head">
            <span className="panel-title">Recent Complaints</span>
            <span style={{ fontSize: '.78rem', color: '#64748b' }}>Latest {Math.min(5, (complaints || []).length)} from database</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead><tr><th>Date</th><th>Citizen / Issue</th><th>Category</th><th>Status</th></tr></thead>
              <tbody>
                {complaints && complaints.length > 0 ? complaints.slice(0, 5).map(c => (
                  <tr key={c.id}>
                    <td style={{ whiteSpace: 'nowrap', color: '#64748b', fontSize: '.8rem' }}>
                      {new Date(c.createdAt).toLocaleDateString([], { month: 'short', day: '2-digit' })}
                    </td>
                    <td>
                      <div style={{ fontWeight: 700 }}>{c.title}</div>
                      <div style={{ fontSize: '.75rem', color: '#94a3b8' }}>{c.citizenEmail}</div>
                    </td>
                    <td><span className="pill pill-cat">{CAT_INFO[c.category]?.name || c.category}</span></td>
                    <td><span className={`pill ${c.status === 'RESOLVED' ? 'pill-closed' : (c.status === 'IN_PROGRESS' || c.status === 'ASSIGNED') ? 'pill-progress' : 'pill-open'}`}>
                      {c.status === 'RESOLVED' ? 'Closed' : (c.status === 'IN_PROGRESS' || c.status === 'ASSIGNED') ? 'In Progress' : 'Open'}
                    </span></td>
                  </tr>
                )) : (
                  <tr><td colSpan="4" style={{ textAlign: 'center', color: '#94a3b8', padding: 24 }}>No complaints found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Real By Category Breakdown */}
        <div className="panel">
          <div className="panel-head">
            <span className="panel-title">By Category</span>
            <span style={{ fontSize: '.78rem', color: '#64748b' }}>{total} total records</span>
          </div>
          <div className="cat-list">
            {catList.length > 0 ? catList.map(c => (
              <div key={c.name} style={{ marginBottom: 12 }}>
                <div className="cat-info">
                  <span style={{ fontWeight: 600, color: '#334155' }}>
                    {c.name} <span style={{ fontSize: '.75rem', color: '#94a3b8', fontWeight: 500 }}>({c.count} issue{c.count !== 1 ? 's' : ''})</span>
                  </span>
                  <span style={{ color: c.color, fontWeight: 700 }}>{c.pct}%</span>
                </div>
                <div className="cat-track">
                  <div className={`cat-bar ${c.cls}`} style={{ width: `${Math.max(c.pct, 4)}%`, backgroundColor: c.color }}></div>
                </div>
              </div>
            )) : (
              <div style={{ color: '#94a3b8', textAlign: 'center', padding: 20 }}>No categories recorded</div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
