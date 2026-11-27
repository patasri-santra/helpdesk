import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { errorMessage } from '../api';

export default function Login() {
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError('');
    try { await login(form.email, form.password); }
    catch (err) { setError(errorMessage(err)); setBusy(false); }
  };

  return (
    <div className="auth-wrap">
      <form className="panel auth" onSubmit={submit}>
        <h1>Log in</h1>
        {error && <p className="alert" role="alert">{error}</p>}
        <label>Email<input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
        <label>Password<input type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></label>
        <button className="btn primary" disabled={busy}>{busy ? 'Logging in…' : 'Log in'}</button>
        <p className="muted">New here? <Link to="/register">Create an account</Link></p>
      </form>
    </div>
  );
}
