import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { fmt } from './Badges';

export default function NotificationBell() {
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  const load = useCallback(() => {
    api.get('/notifications').then((res) => { setItems(res.data.data); setUnread(res.data.unread); }).catch(() => {});
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, [load]);

  useEffect(() => {
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const openItem = async (n) => {
    if (!n.read) await api.patch(`/notifications/${n._id}/read`).catch(() => {});
    setOpen(false);
    load();
    navigate(`/tickets/${n.ticket}`);
  };

  const markAll = async () => { await api.patch('/notifications/read-all'); load(); };

  return (
    <div className="bell" ref={ref}>
      <button className="btn ghost" onClick={() => { setOpen(!open); if (!open) load(); }} aria-expanded={open}>
        Notifications{unread > 0 && <span className="count">{unread}</span>}
      </button>
      {open && (
        <div className="bell-menu">
          <div className="bell-head">
            <strong>Notifications</strong>
            {unread > 0 && <button className="link" onClick={markAll}>Mark all read</button>}
          </div>
          {items.length === 0 && <p className="muted pad">You're all caught up.</p>}
          {items.map((n) => (
            <button key={n._id} className={`bell-item ${n.read ? '' : 'unread'}`} onClick={() => openItem(n)}>
              <span>{n.message}</span>
              <small className="muted">{fmt(n.createdAt)}</small>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
