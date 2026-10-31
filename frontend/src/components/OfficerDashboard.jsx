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
      await axios.put(`/api/officer/complaints/${id}/status`, {
        status, resolutionNotes: notes
      }, authHeader);
      notify('Complaint updated successfully!');
      setEditingId(null);
      setNotes('');
      loadAssignedComplaints();
    } catch (err) {
      notify(err.response?.data?.message || 'Failed to update complaint');
    }
  };

  return (
    <section className="card">
      <div className="admin-header">
        <h3>Field Officer Dashboard</h3>
        <div className="stats-row">
          <span className="stat">Assigned: {complaints.length}</span>
          <span className="stat stat-pend">In Progress: {complaints.filter(c => c.status === 'IN_PROGRESS' || c.status === 'ASSIGNED').length}</span>
          <span className="stat stat-res">Resolved: {complaints.filter(c => c.status === 'RESOLVED').length}</span>
        </div>
      </div>

      <div className="list">
        {complaints.length === 0 ? <p className="empty">No complaints currently assigned to you.</p> : (
          complaints.map(c => (
            <div key={c.id} className="item admin-item">
              <div style={{ flex: 1 }}>
                <h4>{c.title}</h4>
                <p>{c.description}</p>
                <small>Citizen: {c.citizenEmail} | Date: {new Date(c.createdAt).toLocaleDateString()}</small>
                <div className="tags" style={{ marginTop: 8 }}>
                  <span className="badge category">{c.category}</span>
                  <span className={`badge prio-${c.priority.toLowerCase()}`}>{c.priority}</span>
                  <span className={`badge status-${c.status.toLowerCase()}`}>{c.status}</span>
                </div>
                {c.resolutionNotes && (
                  <div className="resolution-box" style={{ marginTop: 8 }}>
                    <b>Current Notes:</b> {c.resolutionNotes}
                  </div>
                )}
                {editingId === c.id && (
                  <div className="edit-box" style={{ marginTop: 12 }}>
                    <select value={status} onChange={e => setStatus(e.target.value)}>
                      <option value="IN_PROGRESS">IN_PROGRESS</option>
                      <option value="RESOLVED">RESOLVED</option>
                      <option value="REJECTED">REJECTED</option>
                    </select>
                    <textarea rows="2" placeholder="Add resolution details / action taken..." value={notes} onChange={e => setNotes(e.target.value)} />
                    <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                      <button className="btn btn-primary" onClick={() => handleUpdate(c.id)}>Submit Update</button>
                      <button className="btn btn-outline" onClick={() => setEditingId(null)}>Cancel</button>
                    </div>
                  </div>
                )}
              </div>
              {editingId !== c.id && (
                <button className="btn btn-secondary" onClick={() => { setEditingId(c.id); setStatus(c.status); setNotes(c.resolutionNotes || ''); }}>
                  Update
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </section>
  );
}
