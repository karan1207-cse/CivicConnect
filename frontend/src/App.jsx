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
  const [showProfile, setShowProfile] = useState(false);
  const [msg, setMsg] = useState('');

  const notify = (m) => { setMsg(m); setTimeout(() => setMsg(''), 4000); };

  const handleAuth = async (e) => {
    e.preventDefault();
    try {
      if (isReg) {
        await axios.post('/api/auth/register', authForm);
        notify('Registered successfully as Citizen! Please login.');
        setIsReg(false);
      } else {
        const { data } = await axios.post('/api/auth/login', authForm);
        setUser(data);
        localStorage.setItem('civic_user', JSON.stringify(data));
        notify(`Welcome back, ${data.name}! (${data.role})`);
      }
    } catch (err) {
      notify(err.response?.data?.message || 'Authentication error');
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('civic_user');
    notify('Logged out successfully');
  };

  return (
    <div className="app">
      <header className="navbar">
        <h1 className="logo">Civic<span>Connect</span> 🏛️</h1>
        {user ? (
          <div className="nav-user">
            <span style={{ fontSize: '0.9rem' }}>
              {user.name} <span className="badge role">{user.role}</span>
            </span>
            <button className="btn btn-outline" onClick={() => setShowProfile(true)}>Profile</button>
            <button className="btn btn-outline" onClick={logout}>Logout</button>
          </div>
        ) : (
          <div className="demo-credentials">
            <small>Demo Accounts: admin@civicconnect.gov (Admin@123) | officer@civicconnect.gov (Officer@123)</small>
          </div>
        )}
      </header>

      {msg && <div className="toast">{msg}</div>}

      {!user ? (
        <div className="auth-box">
          <h2>{isReg ? 'Citizen Registration' : 'CivicConnect Portal'}</h2>
          <form onSubmit={handleAuth}>
            {isReg && (
              <input placeholder="Full Name" required value={authForm.name} onChange={e => setAuthForm({ ...authForm, name: e.target.value })} />
            )}
            <input type="email" placeholder="Email Address" required value={authForm.email} onChange={e => setAuthForm({ ...authForm, email: e.target.value })} />
            <input type="password" placeholder="Password" required value={authForm.password} onChange={e => setAuthForm({ ...authForm, password: e.target.value })} />
            <button className="btn btn-primary" type="submit">{isReg ? 'Register as Citizen' : 'Sign In'}</button>
          </form>
          <p onClick={() => setIsReg(!isReg)} className="toggle-auth">
            {isReg ? 'Already have an account? Sign in' : "New citizen? Register for a free account"}
          </p>
        </div>
      ) : (
        <main className="main-content">
          {user.role === 'CITIZEN' && <CitizenDashboard user={user} notify={notify} />}
          {user.role === 'OFFICER' && <OfficerDashboard user={user} notify={notify} />}
          {user.role === 'ADMIN' && <AdminDashboard user={user} notify={notify} />}
        </main>
      )}

      {showProfile && user && (
        <ProfileModal user={user} onClose={() => setShowProfile(false)} notify={notify} />
      )}
    </div>
  );
}
