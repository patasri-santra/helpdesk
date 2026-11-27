import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { errorMessage } from '../api';

export default function Register() {
  const { register } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError('');
    try { await register(form.name, form.email, form.password); }
    catch (err) { setError(errorMessage(err)); setBusy(false); }
  };

  return (
    <div className="auth-wrap">
      <form className="panel auth" onSubmit={submit}>
        <h1>Create account</h1>
        {error && <p className="alert" role="alert">{error}</p>}
        <label>Name<input required value={form.name} onChange={set('name')} /></label>
        <label>Email<input type="email" required value={form.email} onChange={set('email')} /></label>
        <label>Password
          <input type="password" required minLength={8} value={form.password} onChange={set('password')} />
          <small className="muted">At least 8 characters, with a letter and a number.</small>
        </label>
        <button className="btn primary" disabled={busy}>{busy ? 'Creating…' : 'Create account'}</button>
        <p className="muted">Already registered? <Link to="/login">Log in</Link></p>
      </form>
    </div>
  );
}
