import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api, { errMsg } from '../api';

export default function Queues() {
  const [queues, setQueues] = useState(null);
  const [name, setName] = useState('');

  const load = () => api.get('/queues').then((r) => setQueues(r.data)).catch((e) => toast.error(errMsg(e)));
  useEffect(() => { load(); }, []);

  const create = async (e) => {
    e.preventDefault();
    if (!name.trim()) return toast.error('Enter a queue name');
    try {
      await api.post('/queues', { name });
      toast.success('Queue created');
      setName('');
      load();
    } catch (err) { toast.error(errMsg(err)); }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={create} className="card bg-base-100 shadow p-4 flex-row gap-2">
        <input className="input input-bordered flex-1" placeholder="New queue name (e.g. Billing Counter)" value={name} onChange={(e) => setName(e.target.value)} />
        <button className="btn btn-primary">Create</button>
      </form>

      <h2 className="text-lg font-semibold">Your queues</h2>
      {queues === null && <span className="loading loading-spinner" />}
      {queues?.length === 0 && <p className="opacity-70">No queues yet. Create your first one above.</p>}
      <div className="grid gap-3 sm:grid-cols-2">
        {queues?.map((q) => (
          <div key={q._id} className="card bg-base-100 shadow">
            <div className="card-body p-4">
              <h3 className="card-title">{q.name}</h3>
              <p className="text-sm opacity-70">{q.waiting} waiting</p>
              <div className="card-actions justify-end">
                <Link to={`/queues/${q._id}/dashboard`} className="btn btn-sm btn-outline">Dashboard</Link>
                <Link to={`/queues/${q._id}`} className="btn btn-sm btn-primary">Open</Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
