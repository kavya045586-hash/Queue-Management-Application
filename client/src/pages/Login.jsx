import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api, { errMsg } from '../api';

export default function Login() {
  const nav = useNavigate();
  const [register, setRegister] = useState(false);
  const [f, setF] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  if (localStorage.getItem('token')) return <Navigate to="/" replace />;

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post(register ? '/auth/register' : '/auth/login', f);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      nav('/');
    } catch (err) { toast.error(errMsg(err)); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <form onSubmit={submit} className="card bg-base-100 shadow-xl w-full max-w-sm">
        <div className="card-body gap-3">
          <h1 className="text-2xl font-bold text-center">🎟️ QueueFlow</h1>
          <p className="text-center text-sm opacity-70">{register ? 'Create a manager account' : 'Manager login'}</p>
          {register && <input className="input input-bordered w-full" placeholder="Name" value={f.name} onChange={set('name')} />}
          <input className="input input-bordered w-full" type="email" placeholder="Email" value={f.email} onChange={set('email')} />
          <input className="input input-bordered w-full" type="password" placeholder="Password (min 6)" value={f.password} onChange={set('password')} />
          <button className="btn btn-primary" disabled={loading}>
            {loading && <span className="loading loading-spinner loading-sm" />}
            {register ? 'Register' : 'Login'}
          </button>
          <button type="button" className="link text-sm" onClick={() => setRegister(!register)}>
            {register ? 'Already have an account? Login' : 'New manager? Register'}
          </button>
        </div>
      </form>
    </div>
  );
}
