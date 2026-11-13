import { BrowserRouter, Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Login from './pages/Login';
import Queues from './pages/Queues';
import QueueDetail from './pages/QueueDetail';
import Dashboard from './pages/Dashboard';

function Navbar() {
  const nav = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const logout = () => { localStorage.clear(); nav('/login'); };
  return (
    <div className="navbar bg-base-100 shadow sticky top-0 z-10">
      <div className="flex-1"><Link to="/" className="btn btn-ghost text-xl">🎟️ QueueFlow</Link></div>
      <span className="mr-3 hidden sm:inline text-sm">Hi, {user.name}</span>
      <button className="btn btn-sm btn-outline" onClick={logout}>Logout</button>
    </div>
  );
}

// Protected layout: redirects to /login if there is no token
function Page({ children }) {
  if (!localStorage.getItem('token')) return <Navigate to="/login" replace />;
  return (
    <>
      <Navbar />
      <main className="max-w-4xl mx-auto p-4">{children}</main>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-base-200">
        <Toaster position="top-right" />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Page><Queues /></Page>} />
          <Route path="/queues/:id" element={<Page><QueueDetail /></Page>} />
          <Route path="/queues/:id/dashboard" element={<Page><Dashboard /></Page>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
