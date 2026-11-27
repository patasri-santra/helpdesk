import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Tickets from './pages/Tickets';
import NewTicket from './pages/NewTicket';
import TicketDetail from './pages/TicketDetail';

function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <p className="center-note">Loading…</p>;
  return user ? <Layout>{children}</Layout> : <Navigate to="/login" replace />;
}

function PublicOnly({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <p className="center-note">Loading…</p>;
  return user ? <Navigate to="/" replace /> : children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<PublicOnly><Login /></PublicOnly>} />
      <Route path="/register" element={<PublicOnly><Register /></PublicOnly>} />
      <Route path="/" element={<Protected><Tickets /></Protected>} />
      <Route path="/tickets/new" element={<Protected><NewTicket /></Protected>} />
      <Route path="/tickets/:id" element={<Protected><TicketDetail /></Protected>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
