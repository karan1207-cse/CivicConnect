import { useState, useEffect } from 'react';
import axios from 'axios';

export default function CitizenDashboard({ user, notify }) {
  const [complaints, setComplaints] = useState([]);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [aiPreview, setAiPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  const authHeader = { headers: { Authorization: `Bearer ${user.token}` } };

  useEffect(() => { loadComplaints(); }, []);

  const loadComplaints = async () => {
    try {
      const { data } = await axios.get('/api/complaints/my', authHeader);
      setComplaints(data);
    } catch { notify('Failed to load your complaints'); }
  };

  const getAiPreview = async () => {
    if (!title && !desc) return notify('Please enter a title or description first');
    setLoading(true);
    try {
      const { data } = await axios.post('/api/complaints/ai-preview', { title, description: desc });
      setAiPreview(data);
      notify(`AI Prediction: ${data.category} (${data.priority})`);
    } catch { notify('AI suggestion failed'); }
    setLoading(false);
  };

  const submitComplaint = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/complaints', {
        title, description: desc,
        category: aiPreview?.category, priority: aiPreview?.priority
      }, authHeader);
      setTitle(''); setDesc(''); setAiPreview(null);
      notify('Complaint registered successfully!');
      loadComplaints();
    } catch { notify('Failed to submit complaint'); }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1.4fr', gap: 24 }}>
      <div className="chart-card">
        <div className="card-top-row"><span className="card-heading">File New Grievance</span></div>
        <form onSubmit={submitComplaint}>
          <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Issue Title</label>
          <input placeholder="e.g. Water pipeline breakage on 4th cross" required value={title} onChange={e => setTitle(e.target.value)} />
          <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Description</label>
          <textarea placeholder="Describe the location and problem..." required rows="4" value={desc} onChange={e => setDesc(e.target.value)} />
          <div className="ai-row" style={{ background: '#f0f7ff', border: '1px dashed #0284c7', padding: '10px 14px', borderRadius: 8 }}>
            <button type="button" className="btn btn-secondary" onClick={getAiPreview} disabled={loading}>
              {loading ? 'Analyzing...' : '⚡ AI Smart Suggest'}
            </button>
            {aiPreview && (
              <span style={{ fontSize: '0.85rem', color: '#0369a1', fontWeight: 600 }}>
                Category: <b>{aiPreview.category}</b> | Priority: <b>{aiPreview.priority}</b>
              </span>
            )}
          </div>
          <button className="btn btn-primary" type="submit" style={{ padding: '12px' }}>Submit Complaint</button>
        </form>
      </div>

      <div className="chart-card">
        <div className="card-top-row"><span className="card-heading">My Submitted Complaints ({complaints.length})</span></div>
        <div className="table-responsive">
          <table className="clean-table">
            <thead><tr><th>Date</th><th>Issue</th><th>Category</th><th>Status</th></tr></thead>
            <tbody>
              {complaints.length === 0 ? <tr><td colSpan="4" style={{ textAlign: 'center', color: '#94a3b8' }}>No complaints filed yet.</td></tr> : (
                complaints.map(c => (
                  <tr key={c.id}>
                    <td>{new Date(c.createdAt).toLocaleDateString([], { month: 'short', day: '2-digit' })}</td>
                    <td>
                      <b>{c.title}</b>
                      {c.resolutionNotes && <div className="resolution-box" style={{ marginTop: 4, fontSize: '0.8rem' }}><b>Officer Note:</b> {c.resolutionNotes}</div>}
                    </td>
                    <td><span className="badge category">{c.category}</span></td>
                    <td>
                      <span className={`status-pill ${c.status === 'RESOLVED' ? 'pill-closed' : c.status === 'IN_PROGRESS' ? 'pill-inprogress' : 'pill-open'}`}>
                        {c.status === 'RESOLVED' ? 'Closed' : c.status === 'IN_PROGRESS' ? 'In Progress' : 'Open'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
