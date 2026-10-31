import { useState, useEffect } from 'react';
import axios from 'axios';

export default function OfficerDashboard({ user, notify }) {
  const [complaints, setComplaints] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [status, setStatus] = useState('IN_PROGRESS');
  const [notes, setNotes] = useState('');

  const authHeader = { headers: { Authorization: `Bearer ${user.token}` } };

  useEffect(() => { loadAssignedComplaints(); }, []);

  const loadAssignedComplaints = async () => {
    try {
      const { data } = await axios.get('/api/officer/complaints', authHeader);
      setComplaints(data);
    } catch { notify('Failed to load assigned complaints'); }
  };

  const handleUpdate = async (id) => {
    try {
      await axios.put(`/api/officer/complaints/${id}/status`, { status, resolutionNotes: notes }, authHeader);
      notify('Complaint updated successfully!');
      setEditingId(null);
      setNotes('');
      loadAssignedComplaints();
    } catch (err) {
      notify(err.response?.data?.message || 'Update failed');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div className="stats-grid">
        <div className="stat-card stat-card-border-green">
          <div className="stat-icon-wrapper stat-icon-green">📋</div>
          <span className="stat-label">Total Assigned</span>
          <div className="stat-num" style={{ marginTop: 8 }}>{complaints.length}</div>
        </div>
        <div className="stat-card stat-card-border-blue">
          <div className="stat-icon-wrapper stat-icon-blue">🔄</div>
          <span className="stat-label">In Progress</span>
          <div className="stat-num" style={{ marginTop: 8 }}>{complaints.filter(c => c.status === 'IN_PROGRESS' || c.status === 'ASSIGNED').length}</div>
        </div>
        <div className="stat-card stat-card-border-orange">
          <div className="stat-icon-wrapper stat-icon-orange">✅</div>
          <span className="stat-label">Resolved by You</span>
          <div className="stat-num" style={{ marginTop: 8 }}>{complaints.filter(c => c.status === 'RESOLVED').length}</div>
        </div>
      </div>

      <div className="chart-card">
        <div className="card-top-row"><span className="card-heading">Assigned Grievances ({complaints.length})</span></div>
        <table className="clean-table">
          <thead><tr><th>ID</th><th>Issue Details</th><th>Citizen</th><th>Status</th><th>Action</th></tr></thead>
          <tbody>
            {complaints.map(c => (
              <tr key={c.id}>
                <td>#{c.id}</td>
                <td>
                  <b>{c.title}</b>
                  <p style={{ fontSize: '0.8rem', color: '#64748b' }}>{c.description}</p>
                  {c.resolutionNotes && <div className="resolution-box" style={{ marginTop: 4, fontSize: '0.8rem' }}><b>Notes:</b> {c.resolutionNotes}</div>}
                  {editingId === c.id && (
                    <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <select value={status} onChange={e => setStatus(e.target.value)}>
                        <option value="IN_PROGRESS">IN_PROGRESS</option>
                        <option value="RESOLVED">RESOLVED</option>
                        <option value="REJECTED">REJECTED</option>
                      </select>
                      <textarea placeholder="Add resolution note..." rows="2" value={notes} onChange={e => setNotes(e.target.value)} />
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn btn-primary" onClick={() => handleUpdate(c.id)}>Save</button>
                        <button className="btn btn-outline" onClick={() => setEditingId(null)}>Cancel</button>
                      </div>
                    </div>
                  )}
                </td>
                <td>{c.citizenEmail}</td>
                <td>
                  <span className={`status-pill ${c.status === 'RESOLVED' ? 'pill-closed' : c.status === 'IN_PROGRESS' ? 'pill-inprogress' : 'pill-open'}`}>
                    {c.status}
                  </span>
                </td>
                <td>
                  {editingId !== c.id && (
                    <button className="btn btn-secondary" onClick={() => { setEditingId(c.id); setStatus(c.status); setNotes(c.resolutionNotes || ''); }}>
                      Update
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
