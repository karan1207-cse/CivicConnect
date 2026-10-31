import { useState } from 'react';
import axios from 'axios';
import CitizenDashboard from './components/CitizenDashboard';
import OfficerDashboard from './components/OfficerDashboard';
import AdminDashboard from './components/AdminDashboard';
import ProfileModal from './components/ProfileModal';

export default function App() {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('civic_user') || 'null'));
  const [isReg, setIsReg] = useState(false);
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '' });
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showProfile, setShowProfile] = useState(false);
  const [msg, setMsg] = useState('');

  const notify = (m) => { setMsg(m); setTimeout(() => setMsg(''), 4000); };

  const handleAuth = async (e) => {
    e.preventDefault();
    try {
      if (isReg) {
        await axios.post('/api/auth/register', authForm);
        notify('Registered successfully as Citizen! Please sign in.');
        setIsReg(false);
      } else {
        const { data } = await axios.post('/api/auth/login', authForm);
        setUser(data);
        localStorage.setItem('civic_user', JSON.stringify(data));
        notify(`Welcome back, ${data.name}!`);
      }
    } catch (err) {
      notify(err.response?.data?.message || 'Authentication failed');
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('civic_user');
    notify('Logged out successfully');
  };

  if (!user) {
    return (
      <div className="auth-wrapper">
        {msg && <div className="toast">{msg}</div>}
        <div className="auth-card">
          <div className="auth-logo">🏛️</div>
          <h2 className="auth-title">GIS CivicConnect</h2>
          <p className="auth-subtitle">{isReg ? 'Citizen Portal Registration' : 'Municipal Grievance Intelligence Portal'}</p>
          <form onSubmit={handleAuth}>
            {isReg && <input placeholder="Full Name" required value={authForm.name} onChange={e => setAuthForm({ ...authForm, name: e.target.value })} />}
            <input type="email" placeholder="Email Address" required value={authForm.email} onChange={e => setAuthForm({ ...authForm, email: e.target.value })} />
            <input type="password" placeholder="Password" required value={authForm.password} onChange={e => setAuthForm({ ...authForm, password: e.target.value })} />
            <button className="btn btn-primary" type="submit" style={{ padding: '12px' }}>{isReg ? 'Register as Citizen' : 'Sign In'}</button>
          </form>
          <div style={{ marginTop: 14, fontSize: '0.8rem', color: '#64748b' }}>
            Demo: <b>admin@civicconnect.gov</b> (Admin@123) | <b>officer@civicconnect.gov</b> (Officer@123)
          </div>
          <p className="auth-toggle" onClick={() => setIsReg(!isReg)}>
            {isReg ? 'Already have an account? Sign In' : "Don't have an account? Register as Citizen"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-layout">
      {msg && <div className="toast">{msg}</div>}

      {/* ── ROYAL BLUE GIS SIDEBAR ── */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-icon">🏛️</div>
          <span className="logo-text">GIS</span>
        </div>

        <ul className="nav-menu">
          <li>
            <button className={`nav-item-btn ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
              <span className="icon">⊞</span> Dashboard
            </button>
          </li>
          {user.role === 'ADMIN' && (
            <>
              <li>
                <button className={`nav-item-btn ${activeTab === 'complaints' ? 'active' : ''}`} onClick={() => setActiveTab('complaints')}>
                  <span className="icon">📋</span> Complaints
                </button>
              </li>
              <li>
                <button className={`nav-item-btn ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>
                  <span className="icon">👥</span> Users
                </button>
              </li>
              <li>
                <button className={`nav-item-btn ${activeTab === 'audit' ? 'active' : ''}`} onClick={() => setActiveTab('audit')}>
                  <span className="icon">📜</span> Audit Logs
                </button>
              </li>
            </>
          )}
          <li>
            <button className="nav-item-btn" onClick={() => setShowProfile(true)}>
              <span className="icon">⚙️</span> Settings
            </button>
          </li>
          <li>
            <button className="nav-item-btn nav-logout" onClick={logout}>
              <span className="icon">🚪</span> Logout
            </button>
          </li>
        </ul>
      </aside>

      {/* ── MAIN DASHBOARD VIEW ── */}
      <div className="main-wrapper">
        <header className="topbar">
          <div className="topbar-left">
            <span style={{ fontSize: '1.2rem', cursor: 'pointer', color: '#64748b' }}>☰</span>
            <span className="topbar-title">Overview</span>
          </div>

          <div className="topbar-right">
            <div className="notif-bell">
              🔔<span className="notif-badge">12</span>
            </div>
            <span style={{ fontSize: '1.1rem', cursor: 'pointer', color: '#64748b' }} onClick={() => setShowProfile(true)}>⚙️</span>
            <div className="user-profile" onClick={() => setShowProfile(true)}>
              <div className="user-avatar">{user.name.charAt(0).toUpperCase()}</div>
              <div className="user-info">
                <span className="user-name">{user.name}</span>
                <span className="user-role-tag">{user.role.toLowerCase()}</span>
              </div>
            </div>
          </div>
        </header>

        <main className="page-body">
          {user.role === 'ADMIN' && <AdminDashboard user={user} notify={notify} activeTab={activeTab} />}
          {user.role === 'OFFICER' && <OfficerDashboard user={user} notify={notify} />}
          {user.role === 'CITIZEN' && <CitizenDashboard user={user} notify={notify} />}
        </main>
      </div>

      {showProfile && <ProfileModal user={user} onClose={() => setShowProfile(false)} notify={notify} />}
    </div>
  );
}
