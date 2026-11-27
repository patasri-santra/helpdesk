import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api, { errorMessage } from '../api';
import { useAuth } from '../AuthContext';
import { CATEGORIES, PRIORITIES, STATUSES, PriorityBadge, StatusBadge, fmt, label } from '../components/Badges';
import BackLink from '../components/BackLink';

export default function TicketDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user.role === 'ADMIN';

  const [ticket, setTicket] = useState(null);
  const [comments, setComments] = useState([]);
  const [activity, setActivity] = useState([]);
  const [comment, setComment] = useState('');
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({});
  const [error, setError] = useState('');
  const [notFound, setNotFound] = useState(false);

  const loadSide = useCallback(async () => {
    const [c, a] = await Promise.all([api.get(`/tickets/${id}/comments`), api.get(`/tickets/${id}/activity`)]);
    setComments(c.data.data);
    setActivity(a.data.data);
  }, [id]);

  const loadAll = useCallback(async () => {
    try {
      const t = await api.get(`/tickets/${id}`);
      setTicket(t.data.data);
      await loadSide();
    } catch (err) {
      if (err.response?.status === 404) setNotFound(true); else setError(errorMessage(err));
    }
  }, [id, loadSide]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const refreshActivitySoon = () => setTimeout(() => loadSide().catch(() => {}), 600);

  const patch = async (body) => {
    setError('');
    try {
      const res = await api.patch(`/tickets/${id}`, body);
      setTicket((t) => ({ ...t, ...res.data.data, createdBy: t.createdBy }));
      refreshActivitySoon();
      return true;
    } catch (err) { setError(errorMessage(err)); return false; }
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    if (await patch(draft)) setEditing(false);
  };

  const remove = async () => {
    if (!window.confirm('Delete this ticket? This cannot be undone.')) return;
    try { await api.delete(`/tickets/${id}`); navigate('/'); }
    catch (err) { setError(errorMessage(err)); }
  };

  const addComment = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await api.post(`/tickets/${id}/comments`, { body: comment });
      setComments((c) => [...c, res.data.data]);
      setComment('');
      refreshActivitySoon();
    } catch (err) { setError(errorMessage(err)); }
  };

  if (notFound) return <><BackLink /><p className="panel pad">This ticket doesn't exist, or you don't have access to it.</p></>;
  if (!ticket) return <p className="center-note">{error || 'Loading…'}</p>;

  const isOwner = ticket.createdBy?._id === user._id || ticket.createdBy === user._id;
  const canEdit = isOwner && ticket.status === 'OPEN';
  const canDelete = isAdmin || canEdit;
  const canComment = isAdmin || ticket.status !== 'CLOSED';
  const set = (k) => (e) => setDraft({ ...draft, [k]: e.target.value });

  return (
    <div className="detail">
      <BackLink />
      <section className="panel pad">
        {error && <p className="alert" role="alert">{error}</p>}

        {!editing ? (
          <>
            <div className="page-head">
              <h1>{ticket.title}</h1>
              <div className="actions">
                {canEdit && <button className="btn ghost" onClick={() => { setDraft({ title: ticket.title, description: ticket.description, category: ticket.category, priority: ticket.priority }); setEditing(true); }}>Edit</button>}
                {canDelete && <button className="btn danger" onClick={remove}>Delete</button>}
              </div>
            </div>
            <p className="meta">
              <StatusBadge value={ticket.status} /> <PriorityBadge value={ticket.priority} />
              <span className="muted">{label(ticket.category)} · Raised by {ticket.createdBy?.name} on {fmt(ticket.createdAt)}</span>
            </p>
            <p className="desc">{ticket.description}</p>
            {isOwner && !canEdit && !isAdmin && <p className="muted">This ticket can't be edited once an admin has picked it up.</p>}
          </>
        ) : (
          <form onSubmit={saveEdit}>
            <label>Title<input required minLength={3} value={draft.title} onChange={set('title')} /></label>
            <label>Description<textarea required minLength={10} rows={5} value={draft.description} onChange={set('description')} /></label>
            <div className="row">
              <label>Category<select value={draft.category} onChange={set('category')}>{CATEGORIES.map((c) => <option key={c} value={c}>{label(c)}</option>)}</select></label>
              <label>Priority<select value={draft.priority} onChange={set('priority')}>{PRIORITIES.map((c) => <option key={c} value={c}>{label(c)}</option>)}</select></label>
            </div>
            <div className="actions"><button className="btn primary">Save changes</button><button type="button" className="btn ghost" onClick={() => setEditing(false)}>Cancel</button></div>
          </form>
        )}

        {isAdmin && !editing && (
          <div className="admin-box">
            <label>Status
              <select value={ticket.status} onChange={(e) => patch({ status: e.target.value })}>{STATUSES.map((s) => <option key={s} value={s}>{label(s)}</option>)}</select>
            </label>
            <label>Priority
              <select value={ticket.priority} onChange={(e) => patch({ priority: e.target.value })}>{PRIORITIES.map((s) => <option key={s} value={s}>{label(s)}</option>)}</select>
            </label>
          </div>
        )}
      </section>

      <section className="panel pad">
        <h2>Comments</h2>
        {comments.length === 0 && <p className="muted">No comments yet.</p>}
        <ul className="comments">
          {comments.map((c) => (
            <li key={c._id} className={c.authorRole === 'ADMIN' ? 'by-admin' : ''}>
              <div><strong>{c.author?.name}</strong>{c.authorRole === 'ADMIN' && <span className="badge staff">Support</span>} <small className="muted">{fmt(c.createdAt)}</small></div>
              <p>{c.body}</p>
            </li>
          ))}
        </ul>
        {canComment ? (
          <form onSubmit={addComment}>
            <label>Add a comment<textarea required rows={3} maxLength={2000} value={comment} onChange={(e) => setComment(e.target.value)} /></label>
            <button className="btn primary">Post comment</button>
          </form>
        ) : <p className="muted">This ticket is closed. Create a new ticket to continue.</p>}
      </section>

      <section className="panel pad">
        <h2>Activity</h2>
        {activity.length === 0 && <p className="muted">No activity recorded yet.</p>}
        <ul className="timeline">
          {activity.map((a) => <li key={a._id}>{a.message}<small className="muted">{fmt(a.createdAt)}</small></li>)}
        </ul>
      </section>
    </div>
  );
}
