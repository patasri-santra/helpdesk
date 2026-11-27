import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { errorMessage } from '../api';
import { CATEGORIES, PRIORITIES, label } from '../components/Badges';
import BackLink from '../components/BackLink';

export default function NewTicket() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: '', description: '', category: 'GENERAL', priority: 'MEDIUM' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      const res = await api.post('/tickets', form);
      navigate(`/tickets/${res.data.data._id}`);
    } catch (err) { setError(errorMessage(err)); setBusy(false); }
  };

  return (
    <>
    <BackLink />
    <form className="panel form-narrow" onSubmit={submit}>
      <h1>New ticket</h1>
      {error && <p className="alert" role="alert">{error}</p>}
      <label>Title<input required minLength={3} maxLength={150} value={form.title} onChange={set('title')} /></label>
      <label>Description
        <textarea required minLength={10} rows={6} value={form.description} onChange={set('description')} />
        <small className="muted">What happened, and what did you expect?</small>
      </label>
      <div className="row">
        <label>Category<select value={form.category} onChange={set('category')}>{CATEGORIES.map((c) => <option key={c} value={c}>{label(c)}</option>)}</select></label>
        <label>Priority<select value={form.priority} onChange={set('priority')}>{PRIORITIES.map((c) => <option key={c} value={c}>{label(c)}</option>)}</select></label>
      </div>
      <div className="actions">
        <button className="btn primary" disabled={busy}>{busy ? 'Creating…' : 'Create ticket'}</button>
        <button type="button" className="btn ghost" onClick={() => navigate('/')}>Cancel</button>
      </div>
    </form>
    </>
  );
}
