import { useState, useEffect } from 'react';
import axios from 'axios';

export default function CitizenDashboard({ user, notify }) {
  const [complaints, setComplaints] = useState([]);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [aiPreview, setAiPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const h = { headers: { Authorization: `Bearer ${user.token}` } };

  useEffect(() => { loadComplaints(); }, []);

  const loadComplaints = async () => { try { const { data } = await axios.get('/api/complaints/my', h); setComplaints(data); } catch { notify('Failed to load complaints'); } };

  const getAiPreview = async () => {
    if (!title && !desc) return notify('Enter a title or description first');
    setLoading(true);
    try { const { data } = await axios.post('/api/complaints/ai-preview', { title, description: desc }); setAiPreview(data); notify(`AI: ${data.category} (${data.priority})`); } catch { notify('AI suggestion failed'); }
    setLoading(false);
  };

  const submit = async (e) => {
    e.preventDefault();
    try { await axios.post('/api/complaints', { title, description: desc, category: aiPreview?.category, priority: aiPreview?.priority }, h); setTitle(''); setDesc(''); setAiPreview(null); notify('Complaint submitted!'); loadComplaints(); } catch { notify('Submission failed'); }
  };

  const pending = complaints.filter(c => c.status === 'PENDING').length;
  const active = complaints.filter(c => c.status === 'IN_PROGRESS' || c.status === 'ASSIGNED').length;
  const done = complaints.filter(c => c.status === 'RESOLVED').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Mini Stats */}
      <div className="stats-row">
        <div className="stat-tile accent-amber">
          <div className="tile-icon bg-amber">📝</div>
          <span className="tile-label">Total Filed</span>
          <span className="tile-value">{complaints.length}</span>
        </div>
        <div className="stat-tile accent-blue">
          <div className="tile-icon bg-blue">⏳</div>
          <span className="tile-label">Pending</span>
          <span className="tile-value">{pending}</span>
        </div>
        <div className="stat-tile accent-green">
          <div className="tile-icon bg-green">🔄</div>
          <span className="tile-label">In Progress</span>
          <span className="tile-value">{active}</span>
        </div>
        <div className="stat-tile accent-green">
          <div className="tile-icon bg-green">✅</div>
          <span className="tile-label">Resolved</span>
          <span className="tile-value">{done}</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 24 }} className="form-grid">
        {/* File Complaint */}
        <div className="panel">
          <div className="panel-head"><span className="panel-title">File New Grievance</span></div>
          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div><label>Issue Title</label><input placeholder="e.g. Water pipeline breakage on 4th cross" required value={title} onChange={e => setTitle(e.target.value)} /></div>
            <div><label>Description</label><textarea placeholder="Describe the location and problem in detail..." required rows="4" value={desc} onChange={e => setDesc(e.target.value)} /></div>
            <div className="ai-box">
              <button type="button" className="btn btn-secondary btn-sm" onClick={getAiPreview} disabled={loading}>
                {loading ? '⏳ Analyzing...' : '⚡ AI Smart Suggest'}
              </button>
              {aiPreview && <span className="ai-result">Category: <b>{aiPreview.category}</b> &nbsp;|&nbsp; Priority: <b>{aiPreview.priority}</b></span>}
            </div>
            <button className="btn btn-primary" type="submit" style={{ padding: 13 }}>Submit Complaint</button>
          </form>
        </div>

        {/* My Complaints */}
        <div className="panel">
          <div className="panel-head"><span className="panel-title">My Complaints ({complaints.length})</span></div>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead><tr><th>Date</th><th>Issue</th><th>Category</th><th>Status</th></tr></thead>
              <tbody>
                {complaints.length === 0 ? <tr><td colSpan="4" style={{ textAlign: 'center', color: '#94a3b8', padding: 24 }}>No complaints filed yet</td></tr> :
                  complaints.map(c => (
                    <tr key={c.id}>
                      <td style={{ whiteSpace: 'nowrap', fontSize: '.8rem', color: '#64748b' }}>{new Date(c.createdAt).toLocaleDateString([], { month: 'short', day: '2-digit' })}</td>
                      <td>
                        <b>{c.title}</b>
                        {c.resolutionNotes && <div className="note-box"><b>Officer:</b> {c.resolutionNotes}</div>}
                      </td>
                      <td><span className="pill pill-cat">{c.category}</span></td>
                      <td><span className={`pill ${c.status === 'RESOLVED' ? 'pill-closed' : c.status === 'IN_PROGRESS' ? 'pill-progress' : 'pill-open'}`}>
                        {c.status === 'RESOLVED' ? 'Closed' : c.status === 'IN_PROGRESS' ? 'In Progress' : 'Open'}
                      </span></td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
