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
      notify(`AI Suggestion: ${data.category} (${data.priority} Priority)`);
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
      notify('Complaint submitted successfully!');
      loadComplaints();
    } catch { notify('Failed to submit complaint'); }
  };

  return (
    <div className="citizen-grid">
      <section className="card">
        <h3>Submit Civic Grievance</h3>
        <form onSubmit={submitComplaint}>
          <input placeholder="Issue Title (e.g. Broken road, Water leak)" required value={title} onChange={e => setTitle(e.target.value)} />
          <textarea placeholder="Describe the problem in detail..." required rows="4" value={desc} onChange={e => setDesc(e.target.value)} />
          <div className="ai-row">
            <button type="button" className="btn btn-secondary" onClick={getAiPreview} disabled={loading}>
              {loading ? 'Analyzing...' : '⚡ AI Smart Suggest'}
            </button>
            {aiPreview && (
              <div className="ai-tag">
                <span>Category: <b>{aiPreview.category}</b></span>
                <span className={`badge prio-${aiPreview.priority.toLowerCase()}`}>{aiPreview.priority}</span>
              </div>
            )}
          </div>
          <button className="btn btn-primary" type="submit">Submit Complaint</button>
        </form>
      </section>

      <section className="card">
        <h3>My Grievances ({complaints.length})</h3>
        <div className="list">
          {complaints.length === 0 ? <p className="empty">No complaints submitted yet.</p> : (
            complaints.map(c => (
              <div key={c.id} className="item">
                <div>
                  <h4>{c.title}</h4>
                  <p>{c.description}</p>
                  <small>Reported on: {new Date(c.createdAt).toLocaleDateString()}</small>
                  {c.resolutionNotes && (
                    <div className="resolution-box">
                      <b>Officer Resolution Note:</b> {c.resolutionNotes}
                    </div>
                  )}
                </div>
                <div className="tags">
                  <span className="badge category">{c.category}</span>
                  <span className={`badge prio-${c.priority.toLowerCase()}`}>{c.priority}</span>
                  <span className={`badge status-${c.status.toLowerCase()}`}>{c.status}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
