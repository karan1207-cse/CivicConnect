import { useState } from 'react';
import axios from 'axios';
import CivicLogo from './components/CivicLogo';
import CitizenDashboard from './components/CitizenDashboard';
import OfficerDashboard from './components/OfficerDashboard';
import AdminDashboard from './components/AdminDashboard';
import ProfileModal from './components/ProfileModal';

export default function App() {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('civic_user') || 'null'));
  const [isReg, setIsReg] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [tab, setTab] = useState('dashboard');
  const [showProfile, setShowProfile] = useState(false);
  const [msg, setMsg] = useState('');

  const notify = (m) => { setMsg(m); setTimeout(() => setMsg(''), 4000); };
  const set = (k, v) => setForm({ ...form, [k]: v });

  const handleAuth = async (e) => {
    e.preventDefault();
    try {
      if (isReg) {
        await axios.post('/api/auth/register', form);
        notify('Registration successful! Please sign in.');
        setIsReg(false);
      } else {
        const { data } = await axios.post('/api/auth/login', form);
        setUser(data); localStorage.setItem('civic_user', JSON.stringify(data));
        notify(`Welcome, ${data.name}!`);
      }
    } catch (err) { notify(err.response?.data?.message || 'Authentication failed'); }
  };

  const logout = () => { setUser(null); localStorage.removeItem('civic_user'); setTab('dashboard'); };

  // ── AUTH SCREEN ──
  if (!user) return (
    <div className="auth-page">
      {msg && <div className="toast">{msg}</div>}
      <div className="auth-card">
        <CivicLogo size={52} />
        <h2 style={{ marginTop: 16 }}>CivicConnect</h2>
        <p className="subtitle">{isReg ? 'Create your citizen account' : 'Municipal Grievance Intelligence Portal'}</p>
        <form onSubmit={handleAuth}>
          {isReg && <input placeholder="Full Name" required value={form.name} onChange={e => set('name', e.target.value)} />}
          <input type="email" placeholder="Email Address" required value={form.email} onChange={e => set('email', e.target.value)} />
          <input type="password" placeholder="Password" required value={form.password} onChange={e => set('password', e.target.value)} />
          <button className="btn btn-primary" type="submit" style={{ width: '100%', padding: 13 }}>{isReg ? 'Register' : 'Sign In'}</button>
        </form>
        
        <div className="toggle-link" onClick={() => setIsReg(!isReg)}>
          {isReg ? '← Back to Sign In' : "Don't have an account? Register"}
        </div>
      </div>
    </div>
  );

  // ── NAV CONFIG ──
  const navItems = [
    { id: 'dashboard', icon: '📊', label: 'Dashboard' },
    ...(user.role === 'ADMIN' ? [
      { id: 'complaints', icon: '📋', label: 'Complaints' },
      { id: 'users', icon: '👥', label: 'Users' },
      { id: 'audit', icon: '📜', label: 'Audit Logs' },
    ] : []),
  ];

  const tabLabels = { dashboard: 'Dashboard', complaints: 'Complaint Management', users: 'User Management', audit: 'Audit Trail' };

  return (
    <div className="app-shell">
      {msg && <div className="toast">{msg}</div>}

      {/* ── SIDEBAR ── */}
      <aside className="sidebar">
        <div className="sidebar-brand"><CivicLogo size={42} /></div>
        <ul className="sidebar-nav">
          {navItems.map(n => (
            <li key={n.id}>
              <button className={`nav-btn ${tab === n.id ? 'active' : ''}`} onClick={() => setTab(n.id)}>
                <span className="nav-icon">{n.icon}</span>{n.label}
              </button>
            </li>
          ))}
        </ul>
        <div className="sidebar-bottom">
          <button className="nav-btn" onClick={() => setShowProfile(true)}><span className="nav-icon">⚙️</span>Settings</button>
          <button className="nav-btn btn-logout" onClick={logout}><span className="nav-icon">🚪</span>Logout</button>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <div className="main-area">
        <header className="header-bar">
          <div className="header-left">
            <span className="header-title">{tabLabels[tab] || 'Dashboard'}</span>
          </div>
          <div className="header-right">
            <button className="icon-btn" title="Notifications">🔔<span className="badge-dot"></span></button>
            <div className="profile-chip" onClick={() => setShowProfile(true)}>
              <div className="avatar">{user.name.charAt(0).toUpperCase()}</div>
              <div className="profile-meta">
                <span className="profile-name">{user.name}</span>
                <span className="profile-role">{user.role.toLowerCase()}</span>
              </div>
            </div>
          </div>
        </header>

        <main className="content">
          {user.role === 'ADMIN' && <AdminDashboard user={user} notify={notify} activeTab={tab} />}
          {user.role === 'OFFICER' && <OfficerDashboard user={user} notify={notify} />}
          {user.role === 'CITIZEN' && <CitizenDashboard user={user} notify={notify} />}
        </main>
      </div>

      {showProfile && <ProfileModal user={user} onClose={() => setShowProfile(false)} notify={notify} />}
    </div>
  );
}
