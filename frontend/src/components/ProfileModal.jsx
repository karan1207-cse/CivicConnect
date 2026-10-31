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
      notify('Profile updated successfully!');
      onClose();
    } catch (err) {
      notify(err.response?.data?.message || 'Failed to update profile');
    }
    setLoading(false);
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content card">
        <div className="modal-header">
          <h3>My Profile</h3>
          <button className="btn-close" onClick={onClose}>&times;</button>
        </div>
        <div className="profile-info">
          <p><b>Email:</b> {user.email}</p>
          <p><b>Role:</b> <span className="badge role">{user.role}</span></p>
        </div>
        <form onSubmit={handleUpdate}>
          <label>Full Name</label>
          <input value={name} onChange={e => setName(e.target.value)} required />
          <label>New Password (leave blank to keep current)</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
          <div className="modal-actions">
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
