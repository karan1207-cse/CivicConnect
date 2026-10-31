import { useState, useEffect } from 'react';
import axios from 'axios';
import AdminOverview from './AdminOverview';

export default function AdminDashboard({ user, notify, activeTab }) {
  const [stats, setStats] = useState({});
  const [complaints, setComplaints] = useState([]);
  const [officers, setOfficers] = useState([]);
  const [users, setUsers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [filter, setFilter] = useState('ALL');
  const [userSearch, setUserSearch] = useState('');
  const [newOfficer, setNewOfficer] = useState({ name: '', email: '', password: '' });

  const authHeader = { headers: { Authorization: `Bearer ${user.token}` } };

  useEffect(() => { loadStats(); loadComplaints(); loadOfficers(); }, []);
  useEffect(() => {
    if (activeTab === 'users') loadUsers();
    if (activeTab === 'audit') loadAuditLogs();
  }, [activeTab]);

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
    try { const { data } = await axios.get(`/api/admin/users?search=${encodeURIComponent(userSearch)}`, authHeader); setUsers(data); } catch {}
  };
  const loadAuditLogs = async () => {
    try { const { data } = await axios.get('/api/admin/audit-logs', authHeader); setAuditLogs(data); } catch {}
  };

  const assignOfficer = async (complaintId, officerId) => {
    try {
      await axios.put(`/api/admin/complaints/${complaintId}/assign`, { officerId }, authHeader);
      notify('Officer assigned successfully!');
      loadComplaints(); loadStats();
    } catch { notify('Failed to assign officer'); }
  };

  const updateStatus = async (id, status) => {
    try {
      await axios.put(`/api/admin/complaints/${id}/status`, { status }, authHeader);
      notify('Status updated');
      loadComplaints(); loadStats();
    } catch { notify('Status update failed'); }
  };

  const toggleUserStatus = async (uId, currentActive) => {
    try {
      await axios.put(`/api/admin/users/${uId}/status`, { active: !currentActive }, authHeader);
      notify('User status updated');
      loadUsers();
    } catch (err) { notify(err.response?.data?.message || 'Update failed'); }
  };

  const handleCreateOfficer = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/admin/users', { ...newOfficer, role: 'OFFICER' }, authHeader);
      notify('Officer registered!');
      setNewOfficer({ name: '', email: '', password: '' });
      loadUsers(); loadOfficers();
    } catch (err) { notify(err.response?.data?.message || 'Creation failed'); }
  };

  const filtered = complaints.filter(c => filter === 'ALL' || c.status === filter);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {activeTab === 'dashboard' && <AdminOverview stats={stats} complaints={complaints} />}

      {activeTab === 'complaints' && (
        <div className="chart-card">
          <div className="card-top-row">
            <span className="card-heading">Manage All Complaints ({complaints.length})</span>
            <div style={{ display: 'flex', gap: 6 }}>
              {['ALL', 'PENDING', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED'].map(st => (
                <button key={st} className={`btn ${filter === st ? 'btn-primary' : 'btn-outline'}`} onClick={() => setFilter(st)}>{st}</button>
              ))}
            </div>
          </div>
          <div className="table-responsive">
            <table className="clean-table">
              <thead><tr><th>ID</th><th>Issue</th><th>Citizen</th><th>Category</th><th>Assign Officer</th><th>Status Action</th></tr></thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c.id}>
                    <td>#{c.id}</td>
                    <td><b>{c.title}</b><p style={{ fontSize: '0.8rem', color: '#64748b' }}>{c.description}</p></td>
                    <td>{c.citizenEmail}</td>
                    <td><span className="badge category">{c.category}</span></td>
                    <td>
                      <select style={{ width: 'auto', fontSize: '0.8rem' }} value={c.assignedOfficerId || ''} onChange={e => assignOfficer(c.id, e.target.value)}>
                        <option value="">-- Unassigned --</option>
                        {officers.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                      </select>
                    </td>
                    <td>
                      <select style={{ width: 'auto', fontSize: '0.8rem' }} value={c.status} onChange={e => updateStatus(c.id, e.target.value)}>
                        {['PENDING', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'REJECTED'].map(st => <option key={st} value={st}>{st}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
          <div className="chart-card">
            <div className="card-top-row">
              <span className="card-heading">User Management</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <input placeholder="Search users..." value={userSearch} onChange={e => setUserSearch(e.target.value)} />
                <button className="btn btn-secondary" onClick={loadUsers}>Filter</button>
              </div>
            </div>
            <table className="clean-table">
              <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Action</th></tr></thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td><b>{u.name}</b></td>
                    <td>{u.email}</td>
                    <td><span className="badge role">{u.role}</span></td>
                    <td><span className={`status-pill ${u.active ? 'pill-closed' : 'pill-open'}`}>{u.active ? 'ACTIVE' : 'INACTIVE'}</span></td>
                    <td>
                      {u.email !== user.email && (
                        <button className="btn btn-outline" style={{ fontSize: '0.75rem', padding: '4px 8px' }} onClick={() => toggleUserStatus(u.id, u.active)}>
                          {u.active ? 'Deactivate' : 'Activate'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="chart-card" style={{ height: 'fit-content' }}>
            <span className="card-heading">Register Field Officer</span>
            <form onSubmit={handleCreateOfficer} style={{ marginTop: 14 }}>
              <input placeholder="Officer Name" required value={newOfficer.name} onChange={e => setNewOfficer({ ...newOfficer, name: e.target.value })} />
              <input type="email" placeholder="Officer Email" required value={newOfficer.email} onChange={e => setNewOfficer({ ...newOfficer, email: e.target.value })} />
              <input type="password" placeholder="Password" required value={newOfficer.password} onChange={e => setNewOfficer({ ...newOfficer, password: e.target.value })} />
              <button className="btn btn-primary" type="submit">Create Officer</button>
            </form>
          </div>
        </div>
      )}

      {activeTab === 'audit' && (
        <div className="chart-card">
          <div className="card-top-row"><span className="card-heading">System Audit Trail</span></div>
          <table className="clean-table">
            <thead><tr><th>Action</th><th>Performed By</th><th>Details</th><th>Date & Time</th></tr></thead>
            <tbody>
              {auditLogs.map(l => (
                <tr key={l.id}>
                  <td><span className="badge category">{l.action}</span></td>
                  <td><b>{l.performedBy}</b></td>
                  <td>{l.details}</td>
                  <td>{new Date(l.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
