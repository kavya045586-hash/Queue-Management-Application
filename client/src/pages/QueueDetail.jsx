import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api, { errMsg } from '../api';

const since = (d) => {
  const m = Math.floor((Date.now() - new Date(d)) / 60000);
  return m < 1 ? 'just now' : `${m} min`;
};

export default function QueueDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try { setData((await api.get(`/queues/${id}`)).data); }
    catch (e) { e.response?.status === 404 ? setNotFound(true) : toast.error(errMsg(e)); }
  }, [id]);

  useEffect(() => {
    load();
    const t = setInterval(load, 10000); // keep the list fresh
    return () => clearInterval(t);
  }, [load]);

  // run an action, show a toast, then refetch the list
  const act = async (req, okMsg) => {
    setBusy(true);
    try { const { data: r } = await req(); toast.success(okMsg || r.message); return true; }
    catch (e) { toast.error(errMsg(e)); return false; }
    finally { await load(); setBusy(false); }
  };

  const add = async (e) => {
    e.preventDefault();
    if (!name.trim()) return toast.error('Enter a person name');
    if (await act(() => api.post(`/queues/${id}/tokens`, { personName: name }), 'Token created')) setName('');
  };

  if (notFound) return <p>Queue not found. <Link className="link" to="/">Go back</Link></p>;
  if (!data) return <span className="loading loading-spinner" />;
  const { queue, waiting, serving } = data;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{queue.name}</h1>
        <Link to={`/queues/${id}/dashboard`} className="btn btn-sm btn-outline">📊 Dashboard</Link>
      </div>

      <form onSubmit={add} className="card bg-base-100 shadow p-4 flex-row gap-2">
        <input className="input input-bordered flex-1" placeholder="Person name" value={name} onChange={(e) => setName(e.target.value)} />
        <button className="btn btn-primary" disabled={busy}>Add to queue</button>
      </form>

      <div className="card bg-base-100 shadow">
        <div className="card-body p-4">
          <h2 className="font-semibold">Now serving</h2>
          {serving.length === 0 && <p className="text-sm opacity-70">Nobody is being served.</p>}
          {serving.map((t) => (
            <div key={t._id} className="flex items-center justify-between p-3 rounded-lg bg-success/10">
              <div className="flex items-center gap-3">
                <span className="badge badge-success badge-lg">#{t.tokenNumber}</span>
                <span className="font-medium">{t.personName}</span>
              </div>
              <button className="btn btn-sm btn-success" disabled={busy} onClick={() => act(() => api.patch(`/tokens/${t._id}/complete`))}>Complete</button>
            </div>
          ))}
        </div>
      </div>

      <div className="card bg-base-100 shadow">
        <div className="card-body p-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Waiting ({waiting.length})</h2>
            <button className="btn btn-primary" disabled={busy || waiting.length === 0} onClick={() => act(() => api.post(`/queues/${id}/serve-next`))}>
              Serve next ▶
            </button>
          </div>
          {waiting.length === 0 && <p className="text-sm opacity-70">The queue is empty.</p>}
          {waiting.map((t, i) => (
            <div key={t._id} className="flex items-center justify-between p-3 rounded-lg border border-base-300">
              <div className="flex items-center gap-3">
                <span className="badge badge-primary badge-lg">#{t.tokenNumber}</span>
                <div>
                  <div className="font-medium">{t.personName}</div>
                  <div className="text-xs opacity-60">waiting {since(t.createdAt)}</div>
                </div>
              </div>
              <div className="flex gap-1">
                <button className="btn btn-sm" title="Move up" disabled={busy || i === 0} onClick={() => act(() => api.patch(`/tokens/${t._id}/move`, { direction: 'up' }), 'Moved up')}>↑</button>
                <button className="btn btn-sm" title="Move down" disabled={busy || i === waiting.length - 1} onClick={() => act(() => api.patch(`/tokens/${t._id}/move`, { direction: 'down' }), 'Moved down')}>↓</button>
                <button className="btn btn-sm btn-error" title="Cancel token" disabled={busy} onClick={() => act(() => api.patch(`/tokens/${t._id}/cancel`))}>✕</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
