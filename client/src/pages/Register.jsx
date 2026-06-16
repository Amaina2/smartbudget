import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../lib/api';

export default function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [err, setErr] = useState('');
  const navigate = useNavigate();

  const register = async (e) => {
    e.preventDefault();
    setErr('');
    try {
      await api.post('/auth/register', {
        username,
        email,
        password,
        phone: phone || undefined,
      });
      navigate('/login');
    } catch (e) {
      setErr(e.response?.data?.error || e.message);
    }
  };

  return (
    <div className="sb-auth">
      <h1>Register</h1>
      <form className="sb-form" onSubmit={register}>
        <div>
          <label className="sb-label">Username</label>
          <input className="sb-input" value={username} onChange={(e) => setUsername(e.target.value)} required />
        </div>
        <div>
          <label className="sb-label">Email</label>
          <input className="sb-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <label className="sb-label">Password</label>
          <input
            className="sb-input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="sb-label">Phone (optional, for M-Pesa match)</label>
          <input
            className="sb-input"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="2547XXXXXXXX"
          />
        </div>
        {err && <p className="sb-error">{err}</p>}
        <button className="sb-btn" type="submit" style={{ width: '100%' }}>
          Create account
        </button>
      </form>
      <p style={{ textAlign: 'center', marginTop: '1rem' }}>
        <Link className="sb-link" to="/login">
          Already have an account?
        </Link>
      </p>
    </div>
  );
}
