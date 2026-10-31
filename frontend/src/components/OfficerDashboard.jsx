import { useState, useEffect } from 'react';
import axios from 'axios';

export default function OfficerDashboard({ user, notify }) {
  const [complaints, setComplaints] = useState([]);
  const [editId, setEditId] = useState(null);
  const [status, setStatus] = useState('IN_PROGRESS');
  const [notes, setNotes] = useState('');
  const h = { headers: { Authorization: `Bearer ${user.token}` } };

  useEffect(() => { load(); }, []);

  const load = async () => { try { const { data } = await axios.get('/api/officer/complaints', h); setComplaints(data); } catch { notify('Failed to load complaints'); } };

  const save = async (id) => {
    try { await axios.put(`/api/officer/complaints/${id}/status`, { status, resolutionNotes: notes }, h); notify('Updated!'); setEditId(null); setNotes(''); load(); }
    catch (e) { notify(e.response?.data?.message || 'Update failed'); }
  };

  const active = complaints.filter(c => c.status === 'IN_PROGRESS' || c.status === 'ASSIGNED').length;
  const done = complaints.filter(c => c.status === 'RESOLVED').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div className="stats-row">
        <div className="stat-tile accent-blue">
          <div className="tile-icon bg-blue">📋</div>
          <span className="tile-label">Total Assigned</span>
          <span className="tile-value">{complaints.length}</span>
        </div>
        <div className="stat-tile accent-amber">
          <div className="tile-icon bg-amber">🔄</div>
          <span className="tile-label">Active Cases</span>
          <span className="tile-value">{active}</span>
        </div>
        <div className="stat-tile accent-green">
          <div className="tile-icon bg-green">✅</div>
          <span className="tile-label">Resolved</span>
          <span className="tile-value">{done}</span>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head"><span className="panel-title">Assigned Grievances ({complaints.length})</span></div>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead><tr><th>ID</th><th>Issue Details</th><th>Citizen</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>
              {complaints.map(c => (
                <tr key={c.id}>
                  <td style={{ fontWeight: 700, color: '#64748b' }}>#{c.id}</td>
                  <td>
                    <b>{c.title}</b>
                    <div style={{ fontSize: '.78rem', color: '#64748b', marginTop: 2 }}>{c.description}</div>
                    {c.resolutionNotes && <div className="note-box"><b>Notes:</b> {c.resolutionNotes}</div>}
                    {editId === c.id && (
                      <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <select value={status} onChange={e => setStatus(e.target.value)}>
                          <option value="IN_PROGRESS">IN_PROGRESS</option>
                          <option value="RESOLVED">RESOLVED</option>
                          <option value="REJECTED">REJECTED</option>
                        </select>
                        <textarea placeholder="Add resolution note..." rows="2" value={notes} onChange={e => setNotes(e.target.value)} />
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button className="btn btn-primary btn-sm" onClick={() => save(c.id)}>Save</button>
                          <button className="btn btn-outline btn-sm" onClick={() => setEditId(null)}>Cancel</button>
                        </div>
                      </div>
                    )}
                  </td>
                  <td style={{ fontSize: '.82rem' }}>{c.citizenEmail}</td>
                  <td><span className={`pill ${c.status === 'RESOLVED' ? 'pill-closed' : c.status === 'REJECTED' ? 'pill-rejected' : c.status === 'IN_PROGRESS' ? 'pill-progress' : 'pill-open'}`}>{c.status}</span></td>
                  <td>{editId !== c.id && <button className="btn btn-secondary btn-sm" onClick={() => { setEditId(c.id); setStatus(c.status); setNotes(c.resolutionNotes || ''); }}>Update</button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
