import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../lib/api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const navigate = useNavigate();

  const login = async (e) => {
    e.preventDefault();
    setErr('');
    try {
      const { data } = await api.post('/auth/login', { email, password });
      if (data.token) {
        localStorage.setItem('token', data.token);
      }
      navigate('/');
    } catch (e) {
      setErr(e.response?.data?.error || e.message);
    }
  };

  return (
    <div className="sb-auth">
      <h1>Sign in</h1>
      <form className="sb-form" onSubmit={login}>
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
        {err && <p className="sb-error">{err}</p>}
        <button className="sb-btn" type="submit" style={{ width: '100%' }}>
          Login
        </button>
      </form>
      <p style={{ textAlign: 'center', marginTop: '1rem' }}>
        <Link className="sb-link" to="/register">
          Create an account
        </Link>
      </p>
    </div>
  );
}
