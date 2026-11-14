import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, Queue, Token } from './models.js';

const app = express();
app.use(cors());
app.use(express.json());
app.get('/', (req, res) => res.send('Queue Management API is running'));

const wrap = (fn) => (req, res, next) => fn(req, res, next).catch(next);
const sign = (u) => jwt.sign({ id: u._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
const bad = (res, message, code = 400) => res.status(code).json({ message });

function auth(req, res, next) {
  try {
    req.userId = jwt.verify((req.headers.authorization || '').replace('Bearer ', ''), process.env.JWT_SECRET).id;
    next();
  } catch { bad(res, 'Please login again', 401); }
}

// Ownership checks: a manager can only touch their own queues/tokens
const ownQueue = (req) => mongoose.isValidObjectId(req.params.id)
  ? Queue.findOne({ _id: req.params.id, managerId: req.userId }) : null;
const ownToken = (req) => mongoose.isValidObjectId(req.params.id)
  ? Token.findOne({ _id: req.params.id, managerId: req.userId }) : null;

/* ---------- Auth ---------- */
app.post('/api/auth/register', wrap(async (req, res) => {
  const { name, email, password } = req.body;
  if (!name?.trim() || !email?.trim() || !password || password.length < 6)
    return bad(res, 'Name, email and a password of 6+ characters are required');
  if (await User.findOne({ email: email.toLowerCase() })) return bad(res, 'Email already registered', 409);
  const u = await User.create({ name: name.trim(), email, password: await bcrypt.hash(password, 10) });
  res.status(201).json({ token: sign(u), user: { name: u.name, email: u.email } });
}));

app.post('/api/auth/login', wrap(async (req, res) => {
  const { email, password } = req.body;
  const u = email && (await User.findOne({ email: email.toLowerCase() }));
  if (!u || !password || !(await bcrypt.compare(password, u.password))) return bad(res, 'Invalid email or password', 401);
  res.json({ token: sign(u), user: { name: u.name, email: u.email } });
}));

/* ---------- Queues ---------- */
app.post('/api/queues', auth, wrap(async (req, res) => {
  if (!req.body.name?.trim()) return bad(res, 'Queue name is required');
  res.status(201).json(await Queue.create({ name: req.body.name, managerId: req.userId }));
}));

app.get('/api/queues', auth, wrap(async (req, res) => {
  const queues = await Queue.find({ managerId: req.userId }).sort({ createdAt: -1 }).lean();
  const out = await Promise.all(queues.map(async (q) => ({
    ...q, waiting: await Token.countDocuments({ queueId: q._id, status: 'waiting' }),
  })));
  res.json(out);
}));

app.get('/api/queues/:id', auth, wrap(async (req, res) => {
  const queue = await ownQueue(req);
  if (!queue) return bad(res, 'Queue not found', 404);
  const [waiting, serving] = await Promise.all([
    Token.find({ queueId: queue._id, status: 'waiting' }).sort({ position: 1 }),
    Token.find({ queueId: queue._id, status: 'serving' }).sort({ servedAt: 1 }),
  ]);
  res.json({ queue, waiting, serving });
}));

/* ---------- Tokens ---------- */
app.post('/api/queues/:id/tokens', auth, wrap(async (req, res) => {
  const queue = await ownQueue(req);
  if (!queue) return bad(res, 'Queue not found', 404);
  if (!req.body.personName?.trim()) return bad(res, 'Person name is required');
  // atomic increment so two quick clicks never get the same number
  const q = await Queue.findByIdAndUpdate(queue._id, { $inc: { counter: 1 } }, { new: true });
  const token = await Token.create({
    queueId: queue._id, managerId: req.userId, personName: req.body.personName,
    tokenNumber: q.counter, position: q.counter,
  });
  res.status(201).json(token);
}));

// Move = swap `position` with the neighbouring waiting token
app.patch('/api/tokens/:id/move', auth, wrap(async (req, res) => {
  const { direction } = req.body;
  if (!['up', 'down'].includes(direction)) return bad(res, 'direction must be up or down');
  const t = await ownToken(req);
  if (!t) return bad(res, 'Token not found', 404);
  if (t.status !== 'waiting') return bad(res, 'Only waiting tokens can be moved');
  const up = direction === 'up';
  const nb = await Token.findOne({
    queueId: t.queueId, status: 'waiting', position: up ? { $lt: t.position } : { $gt: t.position },
  }).sort({ position: up ? -1 : 1 });
  if (!nb) return res.json({ message: up ? 'Already at the top' : 'Already at the bottom' });
  [t.position, nb.position] = [nb.position, t.position];
  await Promise.all([t.save(), nb.save()]);
  res.json({ message: 'Token moved' });
}));

// Atomic find + update so the same token can't be served twice
app.post('/api/queues/:id/serve-next', auth, wrap(async (req, res) => {
  const queue = await ownQueue(req);
  if (!queue) return bad(res, 'Queue not found', 404);
  const next = await Token.findOneAndUpdate(
    { queueId: queue._id, status: 'waiting' },
    { status: 'serving', servedAt: new Date() },
    { sort: { position: 1 }, new: true });
  if (!next) return bad(res, 'The queue is empty');
  res.json({ message: `Now serving #${next.tokenNumber} ${next.personName}`, token: next });
}));

const transition = (from, to, field, msg) => wrap(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return bad(res, 'Token not found', 404);
  const t = await Token.findOneAndUpdate(
    { _id: req.params.id, managerId: req.userId, status: from },
    { status: to, [field]: new Date() }, { new: true });
  if (!t) return bad(res, `Token not found or is not ${from}`, 404);
  res.json({ message: msg, token: t });
});
app.patch('/api/tokens/:id/complete', auth, transition('serving', 'completed', 'completedAt', 'Service completed'));
app.patch('/api/tokens/:id/cancel', auth, transition('waiting', 'cancelled', 'cancelledAt', 'Token cancelled'));

/* ---------- Analytics (all derived from token timestamps) ---------- */
app.get('/api/queues/:id/analytics', auth, wrap(async (req, res) => {
  const queue = await ownQueue(req);
  if (!queue) return bad(res, 'Queue not found', 404);
  const toks = await Token.find({ queueId: queue._id });
  const now = Date.now(), HOUR = 36e5, min = (ms) => +(ms / 60000).toFixed(1);
  const waits = toks.filter((t) => t.servedAt).map((t) => t.servedAt - t.createdAt);
  const waiting = toks.filter((t) => t.status === 'waiting');

  const trend = [], perHour = [];
  for (let i = 11; i >= 0; i--) {
    const end = now - i * HOUR, start = end - HOUR;
    const left = (t) => (t.servedAt && +t.servedAt <= end) || (t.cancelledAt && +t.cancelledAt <= end);
    trend.push({ time: new Date(end), length: toks.filter((t) => +t.createdAt <= end && !left(t)).length });
    perHour.push({ time: new Date(end), served: toks.filter((t) => t.servedAt && +t.servedAt > start && +t.servedAt <= end).length });
  }
  res.json({
    total: toks.length, waiting: waiting.length,
    serving: toks.filter((t) => t.status === 'serving').length,
    completed: toks.filter((t) => t.status === 'completed').length,
    cancelled: toks.filter((t) => t.status === 'cancelled').length,
    avgWait: waits.length ? min(waits.reduce((a, b) => a + b, 0) / waits.length) : 0,
    longestWait: waits.length ? min(Math.max(...waits)) : 0,
    longestCurrentWait: waiting.length ? min(Math.max(...waiting.map((t) => now - t.createdAt))) : 0,
    trend, perHour,
  });
}));

app.use((err, req, res, next) => { console.error(err); bad(res, 'Server error', 500); });

mongoose.connect(process.env.MONGO_URI).then(() => {
  app.listen(process.env.PORT || 5000, () => console.log('API running'));
}).catch((e) => { console.error('DB connection failed', e.message); process.exit(1); });
