export default function AdminOverview({ stats, complaints }) {
  return (
    <>
      {/* ── TOP STATS ROW (GIS THEME) ── */}
      <div className="stats-grid">
        <div className="stat-card stat-card-border-green">
          <div className="stat-icon-wrapper stat-icon-green">⏱️</div>
          <span className="stat-label">Pending (Last 7 days)</span>
          <div className="stat-value-row">
            <span className="stat-num">{stats.pending || 0}</span>
            <span className="pill-pct pill-red">+70%</span>
          </div>
        </div>

        <div className="stat-card stat-card-border-blue">
          <div className="stat-icon-wrapper stat-icon-blue">🔄</div>
          <span className="stat-label">In Progress (Last 7 days)</span>
          <div className="stat-value-row">
            <span className="stat-num">{(stats.inProgress || 0) + (stats.assigned || 0)}</span>
            <span className="pill-pct pill-green">+20%</span>
          </div>
        </div>

        <div className="stat-card stat-card-border-orange">
          <div className="stat-icon-wrapper stat-icon-orange">🧩</div>
          <span className="stat-label">Solved (Last 7 days)</span>
          <div className="stat-value-row">
            <span className="stat-num">{stats.resolved || 0}</span>
            <span className="pill-pct pill-green">+1%</span>
          </div>
        </div>

        <div className="circular-stat-card">
          <div className="circle-gauge">
            <svg viewBox="0 0 80 80">
              <circle className="circle-bg" cx="40" cy="40" r="32" />
              <circle className="circle-progress" cx="40" cy="40" r="32" />
            </svg>
            <div className="circle-center-text">
              <span style={{ fontSize: '0.6rem' }}>Service Level</span>
              <span className="circle-val">76.5%</span>
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a' }}>Resolution Rate</div>
            <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Target 75% (Met)</div>
          </div>
        </div>

        <div className="circular-stat-card">
          <div style={{ fontSize: '2.4rem' }}>😊</div>
          <div>
            <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Feedback Rating</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a' }}>4.6 <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>of 5</span></div>
            <div style={{ fontSize: '0.7rem', color: '#16a34a' }}>All time satisfaction</div>
          </div>
        </div>
      </div>

      {/* ── TOTAL COMPLAINTS CHART CARD ── */}
      <div className="chart-card">
        <div className="card-top-row">
          <span className="card-heading">Total Complaints</span>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <div className="chart-legend">
              <span><i className="legend-dot-pending"></i> Pending: <b>{stats.pending || 0}</b></span>
              <span><i className="legend-dot-progress"></i> In Progress: <b>{stats.inProgress || 0}</b></span>
            </div>
            <select style={{ width: 'auto', padding: '4px 10px', fontSize: '0.8rem' }} defaultValue="Feb 01 - Feb 14">
              <option>Feb 01 - Feb 14</option>
              <option>Last 30 Days</option>
            </select>
          </div>
        </div>
        <svg viewBox="0 0 800 160" style={{ width: '100%', height: '140px', overflow: 'visible' }}>
          <line x1="40" y1="30" x2="780" y2="30" stroke="#f1f5f9" strokeDasharray="3" />
          <line x1="40" y1="70" x2="780" y2="70" stroke="#f1f5f9" strokeDasharray="3" />
          <line x1="40" y1="110" x2="780" y2="110" stroke="#f1f5f9" strokeDasharray="3" />
          <path d="M 40 120 Q 150 90, 220 100 T 380 60 T 520 40 T 640 90 T 760 20" fill="none" stroke="#0047cc" strokeWidth="2.5" />
          <path d="M 40 135 Q 150 110, 220 120 T 380 80 T 520 70 T 640 110 T 760 45" fill="none" stroke="#38bdf8" strokeWidth="2" />
          <circle cx="640" cy="90" r="4" fill="#0047cc" stroke="#ffffff" strokeWidth="2" />
          <circle cx="640" cy="110" r="4" fill="#38bdf8" stroke="#ffffff" strokeWidth="2" />
          <text x="40" y="150" fill="#94a3b8" fontSize="10">Feb 01</text>
          <text x="160" y="150" fill="#94a3b8" fontSize="10">Feb 03</text>
          <text x="280" y="150" fill="#94a3b8" fontSize="10">Feb 05</text>
          <text x="400" y="150" fill="#94a3b8" fontSize="10">Feb 07</text>
          <text x="520" y="150" fill="#94a3b8" fontSize="10">Feb 09</text>
          <text x="640" y="150" fill="#94a3b8" fontSize="10">Feb 11</text>
          <text x="740" y="150" fill="#94a3b8" fontSize="10">Feb 13</text>
        </svg>
      </div>

      {/* ── BOTTOM ROW: RECENT COMPLAINTS & CATEGORIES ── */}
      <div className="bottom-grid">
        <div className="chart-card">
          <div className="card-top-row"><span className="card-heading">Recent Complaints</span><span>⋮</span></div>
          <div className="table-responsive">
            <table className="clean-table">
              <thead><tr><th>Date</th><th>Title / Citizen</th><th>Category</th><th>Status</th></tr></thead>
              <tbody>
                {complaints.slice(0, 5).map(c => (
                  <tr key={c.id}>
                    <td>{new Date(c.createdAt).toLocaleDateString([], { month: 'short', day: '2-digit' })}</td>
                    <td><b>{c.title}</b><br/><small style={{ color: '#94a3b8' }}>{c.citizenEmail}</small></td>
                    <td>{c.category}</td>
                    <td>
                      <span className={`status-pill ${c.status === 'RESOLVED' ? 'pill-closed' : c.status === 'IN_PROGRESS' ? 'pill-inprogress' : 'pill-open'}`}>
                        {c.status === 'RESOLVED' ? 'Closed' : c.status === 'IN_PROGRESS' ? 'In Progress' : 'Open'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="chart-card">
          <div className="card-top-row"><span className="card-heading">Complaints in Category</span><span>⋮</span></div>
          <div className="category-bars">
            <div>
              <div className="cat-item-header"><span>Roads & Transportation</span><span>82%</span></div>
              <div className="progress-track"><div className="progress-fill bar-blue" style={{ width: '82%' }}></div></div>
            </div>
            <div>
              <div className="cat-item-header"><span>Water Supply & Pipeline</span><span>45%</span></div>
              <div className="progress-track"><div className="progress-fill bar-orange" style={{ width: '45%' }}></div></div>
            </div>
            <div>
              <div className="cat-item-header"><span>Sanitation & Waste Disposal</span><span>32%</span></div>
              <div className="progress-track"><div className="progress-fill bar-green" style={{ width: '32%' }}></div></div>
            </div>
            <div>
              <div className="cat-item-header"><span>Electricity & Power Supply</span><span>28%</span></div>
              <div className="progress-track"><div className="progress-fill bar-cyan" style={{ width: '28%' }}></div></div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
