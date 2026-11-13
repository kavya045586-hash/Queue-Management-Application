# Queue Management Application

A full stack web app where a queue manager can log in, create queues, add people to a queue, and serve them one by one. It also has a dashboard that shows wait times and queue length trends.

I built this for the Rugas assignment using the MERN stack.

## Live Demo

- App: https://your-app.vercel.app
- Demo login: `demo@gmail.com` / `123456`

> The backend is on a free plan, so the first load may take around a minute.

## Features

- Manager register and login (JWT authentication)
- Create queues, each with a name
- Add a person to a queue. A token number is created automatically
- See all the people waiting in the queue
- Move a token up or down in the queue
- Serve the token at the top with one button click, then mark it complete
- Cancel a token from the queue
- Dashboard with average wait time, longest wait, token counts, queue length trend and tokens served per hour

## Tech Stack

| Part | Technology |
|---|---|
| Frontend | React (Vite), Tailwind CSS, DaisyUI, Recharts |
| Backend | Node.js, Express |
| Database | MongoDB with Mongoose |
| Auth | JWT and bcrypt |

## Project Structure

```
client/     React frontend
  src/pages/    Login, Queues, QueueDetail, Dashboard
  src/api.js    axios setup with the JWT token
server/     Express backend
  src/models.js   User, Queue and Token schemas
  src/index.js    all routes and logic
```

## How to Run Locally

You need Node.js and a MongoDB database (local or MongoDB Atlas).

### Step 1: Clone the repo

```
git clone https://github.com/kavya045586-hash/Queue-Management-Application.git
cd Queue-Management-Application
```

### Step 2: Set up the backend

```
cd server
npm install
```

Create a file named `.env` inside the `server` folder with this content (you can copy `.env.example`):

```
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=any_random_secret
```

Start the backend:

```
npm run dev
```

You should see `API running` in the terminal.

### Step 3: Set up the frontend

Open a new terminal and run:

```
cd client
npm install
npm run dev
```

### Step 4: Open the app

Go to http://localhost:5173 in your browser, register a manager account and create your first queue.

## How to Use

1. Register and log in as a manager.
2. Create a queue by entering a name.
3. Open the queue and add people. Each person gets a token number.
4. Use the up and down buttons to change the order.
5. Click **Serve next** to serve the person at the top, then click **Complete** when done.
6. Use the cancel button to remove someone from the queue.
7. Click **Dashboard** to see the analytics.

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
| PATCH | `/api/tokens/:id/complete` | Complete a token being served |
| PATCH | `/api/tokens/:id/cancel` | Cancel a waiting token |
| GET | `/api/queues/:id/analytics` | Dashboard data |

All routes except register and login need the JWT token.

## How It Works

- **Tokens:** each token has a status: `waiting`, `serving`, `completed` or `cancelled`. It also stores timestamps for when it joined, was served, completed or cancelled.
- **Token numbers:** each queue keeps a counter. It is increased in one database step, so two people never get the same number.
- **Move up/down:** every waiting token has a `position`. Moving a token swaps its position with the token above or below it.
- **Serve next:** finds the waiting token with the smallest position and marks it as serving in one step, so the same token can't be served twice.
- **Cancel:** I don't delete the token. I only change its status to `cancelled`, so the analytics still count it.
- **Analytics:** wait time is `servedAt - createdAt`. Queue length at any hour is the number of tokens that had joined by then and had not yet been served or cancelled.
- **Security:** a manager can only see and change their own queues and tokens.

## Screenshots

Add your screenshots here after you take them.

## Author

Kavya
GitHub: [kavya045586-hash](https://github.com/kavya045586-hash)
