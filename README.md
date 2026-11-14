
# Queue Management Application

A full stack web app for managing queues. A manager can log in, create queues, add people (each gets a token), reorder them, serve the person at the top, cancel tokens, and see analytics on wait times and queue length.

I built this for the Rugas assignment using React, Node.js, Express and MongoDB.

## Live Demo

| | Link |
|---|---|
| Application | https://queue-management-application-flax.vercel.app |
| Backend API | https://queue-management-application-pbpe.onrender.com |
| Source code | https://github.com/kavya045586-hash/Queue-Management-Application |



## Features

1. Manager register and login using JWT
2. Create queues, each with a name
3. Add a person to a queue. A token number is created automatically
4. The queue page lists everyone who is waiting
5. Move a token up or down
6. Serve the token at the top with one button click, then mark it complete
7. Cancel a token from the queue
8. Dashboard with:
   - average wait time, longest wait and longest current wait
   - counts of total, waiting, serving, completed and cancelled tokens
   - queue length trend for the last 12 hours (line chart)
   - tokens served per hour (bar chart)

## Tech Stack

| Part | Technology |
|---|---|
| Frontend | React (Vite), Tailwind CSS, DaisyUI, Recharts, Axios, React Router |
| Backend | Node.js, Express |
| Database | MongoDB Atlas with Mongoose |
| Auth | JWT and bcrypt |
| Hosting | Vercel (frontend), Render (backend) |

## Project Structure

```
client/                  React frontend
  src/pages/             Login, Queues, QueueDetail, Dashboard
  src/api.js             Axios setup that adds the JWT to every request
server/                  Express backend
  src/models.js          User, Queue and Token schemas
  src/index.js           Routes and logic
```

## How It Works

**Token statuses.** Every token is `waiting`, `serving`, `completed` or `cancelled`. It also stores timestamps (`createdAt`, `servedAt`, `completedAt`, `cancelledAt`). The whole dashboard is calculated from these timestamps.

**Token numbers.** Each queue keeps a counter that goes up by one inside a single database update, so two people can never get the same number, even if two requests come at the same time.

**Moving up and down.** Every waiting token has a `position` value. Moving a token swaps its position with the token above or below it. Moving the first token up or the last token down does nothing.

**Serve next.** The server finds the waiting token with the smallest position and marks it as serving in one atomic update, so the same token can't be served twice.

**Cancel.** I don't delete the token. I only change its status to `cancelled`, so the analytics can still count it.

**Analytics.**
- Wait time = `servedAt - createdAt`
- Queue length at a given hour = tokens that had joined by then and had not yet been served or cancelled

**Security.** Every route except register and login needs a valid JWT. A manager can only see and change their own queues and tokens, so opening another manager's queue link shows "Queue not found".

## Edge Cases Handled

- Serving from an empty queue gives a message and the button is disabled
- The first token can't move up and the last can't move down (buttons are disabled)
- Blank queue names and blank person names are rejected
- A token that is already served, completed or cancelled can't be cancelled or moved again
- The dashboard shows zeros instead of errors when there is no data
- The user stays logged in after a page refresh

## API Endpoints

| Method | Route | What it does |
|---|---|---|
| POST | `/api/auth/register` | Register a manager |
| POST | `/api/auth/login` | Login |
| GET / POST | `/api/queues` | List or create queues |
| GET | `/api/queues/:id` | Get a queue with waiting and serving tokens |
| POST | `/api/queues/:id/tokens` | Add a person (creates a token) |
| PATCH | `/api/tokens/:id/move` | Move a token up or down |
| POST | `/api/queues/:id/serve-next` | Serve the top token |
| PATCH | `/api/tokens/:id/complete` | Complete a token that is being served |
| PATCH | `/api/tokens/:id/cancel` | Cancel a waiting token |
| GET | `/api/queues/:id/analytics` | Dashboard data |

## Run Locally

You need Node.js and a MongoDB database (local or Atlas).

**1. Clone the repo**
```
git clone https://github.com/kavya045586-hash/Queue-Management-Application.git
cd Queue-Management-Application
```

**2. Start the backend**
```
cd server
npm install
```
Create a `.env` file inside `server` (see `.env.example`):
```
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=any_random_secret
```
Then run:
```
npm run dev
```

**3. Start the frontend** (in a new terminal)
```
cd client
npm install
npm run dev
```


## Future Improvements

- Let people see their own token status without logging in
- Auto-refresh with WebSockets instead of polling
- Multiple service counters with separate "now serving" boards
- Export analytics as CSV

## Author

**Kavya**
GitHub: [kavya045586-hash](https://github.com/kavya045586-hash)
