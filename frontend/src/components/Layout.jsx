import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import NotificationBell from './NotificationBell';

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <>
      <header className="topbar">
        <Link to="/" className="brand">Helpdesk</Link>
        <nav>
          {user.role === 'USER' && <Link to="/tickets/new" className="btn primary">New ticket</Link>}
          <NotificationBell />
          <span className="who">{user.name}{user.role === 'ADMIN' && <em> (admin)</em>}</span>
          <button className="btn ghost" onClick={() => { logout(); navigate('/login'); }}>Log out</button>
        </nav>
      </header>
      <main className="container">{children}</main>
    </>
  );
}
