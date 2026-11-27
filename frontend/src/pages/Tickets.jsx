import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errorMessage } from '../api';
import { useAuth } from '../AuthContext';
import { CATEGORIES, PRIORITIES, STATUSES, PriorityBadge, StatusBadge, fmt, label } from '../components/Badges';

export default function Tickets() {
  const { user } = useAuth();
  const isAdmin = user.role === 'ADMIN';
  const [filters, setFilters] = useState({ status: '', priority: '', category: '', search: '', sort: '-createdAt' });
  const [page, setPage] = useState(1);
  const [result, setResult] = useState({ data: [], pagination: { page: 1, pages: 1, total: 0 } });
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const [debounced, setDebounced] = useState(filters.search);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(filters.search), 300);
    return () => clearTimeout(t);
  }, [filters.search]);

  useEffect(() => {
    setLoading(true);
    const params = { ...filters, search: debounced, page, limit: 10 };
    Object.keys(params).forEach((k) => params[k] === '' && delete params[k]);
    api.get('/tickets', { params })
      .then((res) => { setResult(res.data); setError(''); })
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setLoading(false));
  }, [filters.status, filters.priority, filters.category, filters.sort, debounced, page]);

  useEffect(() => {
    if (isAdmin) api.get('/admin/stats').then((res) => setStats(res.data.data)).catch(() => {});
  }, [isAdmin]);

  const setFilter = (k, v) => { setFilters((f) => ({ ...f, [k]: v })); setPage(1); };
  const { pagination } = result;
  const anyFilter = filters.status || filters.priority || filters.category || filters.search;

  return (
    <>
      <div className="page-head">
        <h1>{isAdmin ? 'All tickets' : 'My tickets'}</h1>
      </div>

      {stats && (
        <section className="stats" aria-label="Ticket statistics">
          <button className={`stat ${filters.status === '' ? 'active' : ''}`} onClick={() => setFilter('status', '')}>
            <strong>{stats.total}</strong><span>All</span>
          </button>
          {STATUSES.map((s) => (
            <button key={s} className={`stat ${filters.status === s ? 'active' : ''}`} onClick={() => setFilter('status', s)}>
              <strong>{stats.byStatus[s]}</strong><span>{label(s)}</span>
            </button>
          ))}
          <div className="stat static"><strong>{stats.createdLast7Days}</strong><span>New this week</span></div>
          <div className="stat static"><strong>{stats.resolvedLast7Days}</strong><span>Resolved this week</span></div>
        </section>
      )}

      <div className="filters">
        <input placeholder="Search title or description" value={filters.search} onChange={(e) => setFilter('search', e.target.value)} aria-label="Search" />
        <select value={filters.status} onChange={(e) => setFilter('status', e.target.value)} aria-label="Status">
          <option value="">Any status</option>{STATUSES.map((s) => <option key={s} value={s}>{label(s)}</option>)}
        </select>
        <select value={filters.priority} onChange={(e) => setFilter('priority', e.target.value)} aria-label="Priority">
          <option value="">Any priority</option>{PRIORITIES.map((s) => <option key={s} value={s}>{label(s)}</option>)}
        </select>
        <select value={filters.category} onChange={(e) => setFilter('category', e.target.value)} aria-label="Category">
          <option value="">Any category</option>{CATEGORIES.map((s) => <option key={s} value={s}>{label(s)}</option>)}
        </select>
        <select value={filters.sort} onChange={(e) => setFilter('sort', e.target.value)} aria-label="Sort">
          <option value="-createdAt">Newest first</option>
          <option value="createdAt">Oldest first</option>
          <option value="-updatedAt">Recently updated</option>
        </select>
      </div>

      {error && <p className="alert" role="alert">{error}</p>}

      <div className="panel table-wrap">
        <table>
          <thead>
            <tr><th>Title</th><th>Status</th><th>Priority</th><th>Category</th>{isAdmin && <th>Raised by</th>}<th>Created</th></tr>
          </thead>
          <tbody>
            {result.data.map((t) => (
              <tr key={t._id}>
                <td><Link to={`/tickets/${t._id}`}>{t.title}</Link></td>
                <td><StatusBadge value={t.status} /></td>
                <td><PriorityBadge value={t.priority} /></td>
                <td>{label(t.category)}</td>
                {isAdmin && <td>{t.createdBy?.name}</td>}
                <td>{fmt(t.createdAt)}</td>
              </tr>
            ))}
            {!loading && result.data.length === 0 && (
              <tr><td colSpan={isAdmin ? 6 : 5} className="empty">
                {anyFilter ? 'No tickets match these filters. Clear a filter to see more.'
                  : isAdmin ? 'No tickets yet. New tickets will appear here.'
                  : <>You haven't raised a ticket yet. <Link to="/tickets/new">Create your first ticket</Link>.</>}
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="pager">
        <button className="btn ghost" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
        <span className="muted">Page {pagination.page} of {pagination.pages} ({pagination.total} tickets)</span>
        <button className="btn ghost" disabled={page >= pagination.pages} onClick={() => setPage(page + 1)}>Next</button>
      </div>
    </>
  );
}
