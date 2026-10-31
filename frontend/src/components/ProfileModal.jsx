import { useState } from 'react';
import axios from 'axios';

export default function ProfileModal({ user, onClose, notify }) {
  const [name, setName] = useState(user.name);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.put('/api/profile', { name, password: password || undefined }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      notify('Profile updated!');
      onClose();
    } catch (err) { notify(err.response?.data?.message || 'Update failed'); }
    setLoading(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <h3>My Profile</h3>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        <div className="profile-info">
          <p><b>Email:</b> {user.email}</p>
          <p><b>Role:</b> <span className="pill pill-cat">{user.role}</span></p>
        </div>
        <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div><label>Full Name</label><input value={name} onChange={e => setName(e.target.value)} required /></div>
          <div><label>New Password</label><input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Leave blank to keep current" /></div>
          <div className="modal-actions">
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Saving...' : 'Save Changes'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
