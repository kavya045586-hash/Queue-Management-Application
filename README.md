# Queue Management System (MERN)

Managers log in, create queues, add people (a token is created), reorder, serve the top token, cancel, and view analytics.

**Stack:** React (Vite) + Tailwind + DaisyUI + Recharts | Node + Express | MongoDB (Mongoose) | JWT + bcrypt

## Run locally
```bash
# 1. backend
cd server && cp .env.example .env   # fill MONGO_URI and JWT_SECRET
npm install && npm run dev          # http://localhost:5000

# 2. frontend (new terminal)
cd client && npm install && npm run dev   # http://localhost:5173
```
For deployment set `VITE_API_URL=https://<your-backend>/api` on the frontend host.

## Features
Login/register, create queues, add person (token auto-numbered), move up/down, serve next, complete, cancel (kept as status for analytics), dashboard (avg/longest wait, counts, queue length trend, served per hour).

## API
`POST /api/auth/register|login` · `GET|POST /api/queues` · `GET /api/queues/:id` · `POST /api/queues/:id/tokens` · `POST /api/queues/:id/serve-next` · `GET /api/queues/:id/analytics` · `PATCH /api/tokens/:id/move|complete|cancel`
