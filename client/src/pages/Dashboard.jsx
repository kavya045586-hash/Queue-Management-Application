import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import api, { errMsg } from '../api';

const Stat = ({ title, value }) => (
  <div className="stat bg-base-100 rounded-lg shadow">
    <div className="stat-title">{title}</div>
    <div className="stat-value text-2xl">{value}</div>
  </div>
);

const hour = (t) => new Date(t).toLocaleTimeString([], { hour: 'numeric' });

export default function Dashboard() {
  const { id } = useParams();
  const [a, setA] = useState(null);

  useEffect(() => {
    const load = () => api.get(`/queues/${id}/analytics`).then((r) => setA(r.data)).catch((e) => toast.error(errMsg(e)));
    load();
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
  }, [id]);

  if (!a) return <span className="loading loading-spinner" />;
  const trend = a.trend.map((p) => ({ hour: hour(p.time), length: p.length }));
  const perHour = a.perHour.map((p) => ({ hour: hour(p.time), served: p.served }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Link to={`/queues/${id}`} className="btn btn-sm btn-outline">← Back to queue</Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat title="Avg wait" value={`${a.avgWait} min`} />
        <Stat title="Longest wait" value={`${a.longestWait} min`} />
        <Stat title="Longest waiting now" value={`${a.longestCurrentWait} min`} />
        <Stat title="Total tokens" value={a.total} />
        <Stat title="Waiting" value={a.waiting} />
        <Stat title="Serving" value={a.serving} />
        <Stat title="Completed" value={a.completed} />
        <Stat title="Cancelled" value={a.cancelled} />
      </div>

      <div className="card bg-base-100 shadow">
        <div className="card-body p-4">
          <h2 className="font-semibold">Queue length (last 12 hours)</h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" /><YAxis allowDecimals={false} /><Tooltip />
              <Line type="monotone" dataKey="length" name="Waiting" stroke="#570df8" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card bg-base-100 shadow">
        <div className="card-body p-4">
          <h2 className="font-semibold">Tokens served per hour</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={perHour}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" /><YAxis allowDecimals={false} /><Tooltip />
              <Bar dataKey="served" name="Served" fill="#36d399" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
