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
  const h = { headers: { Authorization: `Bearer ${user.token}` } };

  useEffect(() => { loadStats(); loadComplaints(); loadOfficers(); }, []);
  useEffect(() => { if (activeTab === 'users') loadUsers(); if (activeTab === 'audit') loadAuditLogs(); }, [activeTab]);

  const loadStats = async () => { try { const { data } = await axios.get('/api/admin/stats', h); setStats(data); } catch {} };
  const loadComplaints = async () => { try { const { data } = await axios.get('/api/admin/complaints', h); setComplaints(data); } catch {} };
  const loadOfficers = async () => { try { const { data } = await axios.get('/api/admin/officers', h); setOfficers(data); } catch {} };
  const loadUsers = async () => { try { const { data } = await axios.get(`/api/admin/users?search=${encodeURIComponent(userSearch)}`, h); setUsers(data); } catch {} };
  const loadAuditLogs = async () => { try { const { data } = await axios.get('/api/admin/audit-logs', h); setAuditLogs(data); } catch {} };

  const assignOfficer = async (cid, oid) => { try { await axios.put(`/api/admin/complaints/${cid}/assign`, { officerId: oid }, h); notify('Officer assigned!'); loadComplaints(); loadStats(); } catch { notify('Assignment failed'); } };
  const updateStatus = async (id, st) => { try { await axios.put(`/api/admin/complaints/${id}/status`, { status: st }, h); notify('Status updated'); loadComplaints(); loadStats(); } catch { notify('Update failed'); } };
  const toggleUser = async (uid, active) => { try { await axios.put(`/api/admin/users/${uid}/status`, { active: !active }, h); notify('User status changed'); loadUsers(); } catch (e) { notify(e.response?.data?.message || 'Failed'); } };
  const createOfficer = async (e) => { e.preventDefault(); try { await axios.post('/api/admin/users', { ...newOfficer, role: 'OFFICER' }, h); notify('Officer enrolled!'); setNewOfficer({ name: '', email: '', password: '' }); loadUsers(); loadOfficers(); } catch (e) { notify(e.response?.data?.message || 'Failed'); } };

  const filtered = complaints.filter(c => filter === 'ALL' || c.status === filter);
  const statuses = ['ALL', 'PENDING', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED'];
  const statusOpts = ['PENDING', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'REJECTED'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {activeTab === 'dashboard' && <AdminOverview stats={stats} complaints={complaints} />}

      {activeTab === 'complaints' && (
        <div className="panel">
          <div className="panel-head">
            <span className="panel-title">Manage Grievances ({complaints.length})</span>
            <div style={{ display: 'flex', gap: 6 }}>
              {statuses.map(st => <button key={st} className={`btn btn-sm ${filter === st ? 'btn-primary' : 'btn-outline'}`} onClick={() => setFilter(st)}>{st.replace('_', ' ')}</button>)}
            </div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead><tr><th>ID</th><th>Citizen & Issue</th><th>Category</th><th>Assign Officer</th><th>Status</th></tr></thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 700, color: '#64748b' }}>#{c.id}</td>
                    <td><b>{c.title}</b><div style={{ fontSize: '.78rem', color: '#64748b', marginTop: 2 }}>{c.description}</div><div style={{ fontSize: '.72rem', color: '#94a3b8' }}>{c.citizenEmail}</div></td>
                    <td><span className="pill pill-cat">{c.category}</span></td>
                    <td><select style={{ width: 'auto', fontSize: '.8rem' }} value={c.assignedOfficerId || ''} onChange={e => assignOfficer(c.id, e.target.value)}><option value="">-- Select --</option>{officers.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}</select></td>
                    <td><select style={{ width: 'auto', fontSize: '.8rem' }} value={c.status} onChange={e => updateStatus(c.id, e.target.value)}>{statusOpts.map(st => <option key={st} value={st}>{st}</option>)}</select></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.2fr', gap: 24 }} className="form-grid">
          <div className="panel">
            <div className="panel-head">
              <span className="panel-title">All Users</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <input placeholder="Search user..." value={userSearch} onChange={e => setUserSearch(e.target.value)} style={{ width: 180 }} />
                <button className="btn btn-secondary btn-sm" onClick={loadUsers}>Search</button>
              </div>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Action</th></tr></thead>
                <tbody>{users.map(u => (
                  <tr key={u.id}>
                    <td><b>{u.name}</b></td><td>{u.email}</td>
                    <td><span className="pill pill-cat">{u.role}</span></td>
                    <td><span className={`pill ${u.active ? 'pill-closed' : 'pill-rejected'}`}>{u.active ? 'Active' : 'Inactive'}</span></td>
                    <td>{u.email !== user.email && <button className={`btn btn-sm ${u.active ? 'btn-danger' : 'btn-primary'}`} onClick={() => toggleUser(u.id, u.active)}>{u.active ? 'Deactivate' : 'Activate'}</button>}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </div>
          <div className="panel" style={{ height: 'fit-content' }}>
            <span className="panel-title">Enroll New Officer</span>
            <form onSubmit={createOfficer} style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input placeholder="Officer Full Name" required value={newOfficer.name} onChange={e => setNewOfficer({ ...newOfficer, name: e.target.value })} />
              <input type="email" placeholder="Official Email" required value={newOfficer.email} onChange={e => setNewOfficer({ ...newOfficer, email: e.target.value })} />
              <input type="password" placeholder="Temporary Password" required value={newOfficer.password} onChange={e => setNewOfficer({ ...newOfficer, password: e.target.value })} />
              <button className="btn btn-primary" type="submit" style={{ padding: 12 }}>Enroll Officer</button>
            </form>
          </div>
        </div>
      )}

      {activeTab === 'audit' && (
        <div className="panel">
          <div className="panel-head"><span className="panel-title">System Audit Trail</span></div>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead><tr><th>Action</th><th>Performed By</th><th>Details</th><th>Timestamp</th></tr></thead>
              <tbody>{auditLogs.map(l => (
                <tr key={l.id}>
                  <td><span className="pill pill-open">{l.action}</span></td>
                  <td><b>{l.performedBy}</b></td>
                  <td style={{ maxWidth: 300 }}>{l.details}</td>
                  <td style={{ color: '#64748b', whiteSpace: 'nowrap', fontSize: '.8rem' }}>{new Date(l.createdAt).toLocaleString()}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
