import { useState, useEffect } from 'react';
import axios from 'axios';

export default function AdminDashboard({ user, notify }) {
  const [tab, setTab] = useState('complaints'); // complaints, users, audit
  const [stats, setStats] = useState({});
  const [complaints, setComplaints] = useState([]);
  const [officers, setOfficers] = useState([]);
  const [users, setUsers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [filter, setFilter] = useState('ALL');
  const [userSearch, setUserSearch] = useState('');
  const [newOfficer, setNewOfficer] = useState({ name: '', email: '', password: '' });

  const authHeader = { headers: { Authorization: `Bearer ${user.token}` } };

  useEffect(() => {
    loadStats();
    loadComplaints();
    loadOfficers();
  }, []);

  useEffect(() => {
    if (tab === 'users') loadUsers();
    if (tab === 'audit') loadAuditLogs();
  }, [tab]);

  const loadStats = async () => {
    try { const { data } = await axios.get('/api/admin/stats', authHeader); setStats(data); } catch {}
  };

  const loadComplaints = async () => {
    try { const { data } = await axios.get('/api/admin/complaints', authHeader); setComplaints(data); } catch {}
  };

  const loadOfficers = async () => {
    try { const { data } = await axios.get('/api/admin/officers', authHeader); setOfficers(data); } catch {}
  };

  const loadUsers = async () => {
    try {
      const { data } = await axios.get(`/api/admin/users?search=${encodeURIComponent(userSearch)}`, authHeader);
      setUsers(data);
    } catch {}
  };

  const loadAuditLogs = async () => {
    try { const { data } = await axios.get('/api/admin/audit-logs', authHeader); setAuditLogs(data); } catch {}
  };

  const assignOfficer = async (complaintId, officerId) => {
    try {
      await axios.put(`/api/admin/complaints/${complaintId}/assign`, { officerId }, authHeader);
      notify('Officer assigned successfully!');
      loadComplaints();
      loadStats();
    } catch { notify('Failed to assign officer'); }
  };

  const updateStatus = async (id, status) => {
    try {
      await axios.put(`/api/admin/complaints/${id}/status`, { status }, authHeader);
      notify('Status updated');
      loadComplaints();
      loadStats();
    } catch { notify('Status update failed'); }
  };

  const toggleUserStatus = async (uId, currentActive) => {
    try {
      await axios.put(`/api/admin/users/${uId}/status`, { active: !currentActive }, authHeader);
      notify('User account status updated');
      loadUsers();
    } catch (err) { notify(err.response?.data?.message || 'Update failed'); }
  };

  const handleCreateOfficer = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/admin/users', { ...newOfficer, role: 'OFFICER' }, authHeader);
      notify('Officer account created successfully!');
      setNewOfficer({ name: '', email: '', password: '' });
      loadUsers();
      loadOfficers();
    } catch (err) { notify(err.response?.data?.message || 'Creation failed'); }
  };

  const filtered = complaints.filter(c => filter === 'ALL' || c.status === filter);

  return (
    <section className="card admin-card">
      <div className="admin-header">
        <div>
          <h3>Municipal Administrator Portal</h3>
          <div className="admin-nav-tabs">
            <button className={`nav-tab-btn ${tab === 'complaints' ? 'active' : ''}`} onClick={() => setTab('complaints')}>All Complaints</button>
            <button className={`nav-tab-btn ${tab === 'users' ? 'active' : ''}`} onClick={() => setTab('users')}>User Management</button>
            <button className={`nav-tab-btn ${tab === 'audit' ? 'active' : ''}`} onClick={() => setTab('audit')}>Audit Trail</button>
          </div>
        </div>
        <div className="stats-row">
          <span className="stat">Total: {stats.totalComplaints || 0}</span>
          <span className="stat stat-pend">Pending: {stats.pending || 0}</span>
          <span className="stat stat-res">Resolved: {stats.resolved || 0}</span>
          <span className="stat">Officers: {stats.activeOfficers || 0}</span>
        </div>
      </div>

      {tab === 'complaints' && (
        <>
          <div className="filter-bar">
            {['ALL', 'PENDING', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'REJECTED'].map(s => (
              <button key={s} className={`filter-btn ${filter === s ? 'active' : ''}`} onClick={() => setFilter(s)}>{s}</button>
            ))}
          </div>
          <div className="list">
            {filtered.map(c => (
              <div key={c.id} className="item admin-item">
                <div style={{ flex: 1 }}>
                  <h4>{c.title}</h4>
                  <p>{c.description}</p>
                  <small>Citizen: {c.citizenEmail} | Date: {new Date(c.createdAt).toLocaleDateString()}</small>
                  <div className="tags" style={{ marginTop: 6 }}>
                    <span className="badge category">{c.category}</span>
                    <span className={`badge prio-${c.priority.toLowerCase()}`}>{c.priority}</span>
                    <span className={`badge status-${c.status.toLowerCase()}`}>{c.status}</span>
                  </div>
                  {c.resolutionNotes && <p style={{ fontSize: '0.85rem', marginTop: 4, color: '#38bdf8' }}><b>Notes:</b> {c.resolutionNotes}</p>}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 160 }}>
                  <select value={c.assignedOfficerId || ''} onChange={e => assignOfficer(c.id, e.target.value)} className="select-status">
                    <option value="">-- Assign Officer --</option>
                    {officers.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                  </select>
                  <select value={c.status} onChange={e => updateStatus(c.id, e.target.value)} className={`select-status status-${c.status.toLowerCase()}`}>
                    {['PENDING', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'REJECTED'].map(st => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === 'users' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
            <div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <input placeholder="Search users by name or email..." value={userSearch} onChange={e => setUserSearch(e.target.value)} />
                <button className="btn btn-secondary" onClick={loadUsers}>Search</button>
              </div>
              <div className="list">
                {users.map(u => (
                  <div key={u.id} className="item" style={{ alignItems: 'center' }}>
                    <div>
                      <h4>{u.name}</h4>
                      <small>{u.email} | Role: <b>{u.role}</b></small>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span className={`badge ${u.active ? 'badge-active' : 'badge-inactive'}`}>
                        {u.active ? 'ACTIVE' : 'DEACTIVATED'}
                      </span>
                      {u.email !== user.email && (
                        <button className="btn btn-outline" style={{ fontSize: '0.75rem', padding: '4px 8px' }} onClick={() => toggleUserStatus(u.id, u.active)}>
                          {u.active ? 'Deactivate' : 'Activate'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="card" style={{ background: '#0b1120', height: 'fit-content' }}>
              <h4>Register New Officer</h4>
              <form onSubmit={handleCreateOfficer} style={{ marginTop: 10 }}>
                <input placeholder="Officer Name" required value={newOfficer.name} onChange={e => setNewOfficer({ ...newOfficer, name: e.target.value })} />
                <input type="email" placeholder="Official Email" required value={newOfficer.email} onChange={e => setNewOfficer({ ...newOfficer, email: e.target.value })} />
                <input type="password" placeholder="Temporary Password" required value={newOfficer.password} onChange={e => setNewOfficer({ ...newOfficer, password: e.target.value })} />
                <button className="btn btn-primary" type="submit">Create Officer</button>
              </form>
            </div>
          </div>
        </div>
      )}

      {tab === 'audit' && (
        <div className="list">
          {auditLogs.map(l => (
            <div key={l.id} className="item">
              <div>
                <h4><span className="badge role">{l.action}</span> by <b>{l.performedBy}</b></h4>
                <p style={{ margin: '4px 0' }}>{l.details}</p>
                <small>Timestamp: {new Date(l.createdAt).toLocaleString()} | Target: #{l.targetId}</small>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
