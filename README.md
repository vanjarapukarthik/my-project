# Telehealth Platform – Full-Stack Web Application

A full-stack telehealth platform with video consultations, appointments, and analytics.

## Tech Stack

| Layer    | Technology        |
|----------|-------------------|
| Frontend | React.js, Vite, Tailwind CSS |
| Backend  | Node.js, Express  |
| Database | MongoDB (Mongoose)|

---

## Project Structure

### Root

```
telehealth_platform_full_production/
├── backend/                 # Node.js + Express API
├── frontend/                # React + Vite + Tailwind
├── README.md
└── .gitignore               # (recommended)
```

### Backend Structure

```
backend/
├── config/
│   ├── db.js                # MongoDB connection
│   └── env.js                # Environment variables
├── controllers/
│   ├── authController.js     # Register, login, getMe
│   ├── appointmentController.js
│   └── userController.js
├── middleware/
│   ├── auth.js               # JWT protect & role
│   └── errorHandler.js       # notFound, errorHandler
├── models/
│   ├── User.js
│   ├── Patient.js
│   └── Appointment.js
├── routes/
│   ├── index.js              # Mounts all routes under /api
│   ├── authRoutes.js         # /api/auth
│   ├── appointmentRoutes.js  # /api/appointments
│   ├── userRoutes.js         # /api/users
│   └── livekitRoutes.js      # /token, /audit (video)
├── .env.example
├── .env                      # Create from .env.example (not committed)
├── package.json
└── server.js                 # App entry, CORS, DB connect
```

### Frontend Structure

```
frontend/
├── api/
│   ├── client.js             # Base API client (fetch + auth header)
│   └── services.js           # auth, appointment, user services
├── components/
│   ├── Navbar.jsx
│   ├── Dashboard.jsx
│   ├── Appointments.jsx
│   ├── DoctorDashboard.jsx
│   ├── VideoConsultation.jsx
│   └── Analytics.jsx
├── .env.example
├── .env                      # Optional (not committed)
├── index.html
├── main.jsx
├── App.jsx
├── index.css                 # Tailwind + custom styles
├── vite.config.js            # Proxy to backend
├── tailwind.config.js
├── postcss.config.js
└── package.json
```

---

## Prerequisites

- **Node.js** 18+ and npm
- **MongoDB** (local or [MongoDB Atlas](https://www.mongodb.com/cloud/atlas))

---

## Installation

### 1. Clone / open project

```bash
cd telehealth_platform_full_production
```

### 2. Backend setup

```bash
cd backend
npm install
```

Create environment file:

```bash
cp .env.example .env
```

Edit `.env` and set at least:

- `MONGODB_URI` – e.g. `mongodb://localhost:27017/telehealth` or your Atlas connection string
- Optionally: `JWT_SECRET`, `LIVEKIT_*`, `PORT`, `CORS_ORIGIN`

### 3. Frontend setup

```bash
cd ../frontend
npm install
```

Optional: copy `.env.example` to `.env` and set `VITE_API_URL` only if the API is on another host/port (for dev, the Vite proxy is enough).

### 4. Run MongoDB

- **Local:** start MongoDB service (e.g. `mongod`).
- **Atlas:** use the connection string in `MONGODB_URI`.

---

## Running the Application

### Backend (port 5000)

```bash
cd backend
npm run dev
```

- With `MONGODB_URI` set: connects to MongoDB and starts server.
- Without `MONGODB_URI`: server still starts; auth/appointments/users will not persist.

### Frontend (port 5173)

```bash
cd frontend
npm run dev
```

Open: **http://localhost:5173**

---

## REST APIs

Base URL: `http://localhost:5000/api` (or same origin via proxy: `/api`).

### Auth (`/api/auth`)

| Method | Endpoint       | Description     |
|--------|----------------|-----------------|
| POST   | /api/auth/register | Register (email, password, name, role?) |
| POST   | /api/auth/login    | Login (email, password) → token + user |
| GET    | /api/auth/me       | Current user (Header: `Authorization: Bearer <token>`) |

### Appointments (`/api/appointments`)

| Method | Endpoint            | Description        |
|--------|---------------------|--------------------|
| GET    | /api/appointments   | List (query: patientId, doctorId, status, from, to) |
| GET    | /api/appointments/:id | Get one           |
| POST   | /api/appointments   | Create (patientId, doctorId, date, time, type?, notes?) |
| PUT    | /api/appointments/:id | Update            |
| DELETE | /api/appointments/:id | Delete            |

### Users (`/api/users`)

| Method | Endpoint    | Description   |
|--------|-------------|---------------|
| GET    | /api/users  | List (query: role?) |
| GET    | /api/users/:id | Get one   |

### Video (LiveKit)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET    | /token   | Query: name, room, role → JWT + url |
| POST   | /audit   | Log audit event (body) |

### Health

| Method | Endpoint | Description   |
|--------|----------|---------------|
| GET    | /health  | API status   |

---

## Environment Configuration

### Backend (`.env`)

| Variable       | Description                    | Example                    |
|----------------|--------------------------------|----------------------------|
| NODE_ENV       | development / production       | development                 |
| PORT           | Server port                    | 5000                       |
| MONGODB_URI    | MongoDB connection string      | mongodb://localhost:27017/telehealth |
| JWT_SECRET     | Secret for JWT signing         | long-random-string         |
| LIVEKIT_API_KEY| LiveKit API key                | (from LiveKit cloud)       |
| LIVEKIT_SECRET | LiveKit secret                 | (from LiveKit cloud)       |
| LIVEKIT_URL    | LiveKit WebSocket URL          | wss://….livekit.cloud      |
| CORS_ORIGIN    | Allowed frontend origin        | http://localhost:5173      |

### Frontend (optional `.env`)

| Variable      | Description              | Example                    |
|---------------|--------------------------|----------------------------|
| VITE_API_URL  | Backend API base URL     | (empty = use proxy /api)   |

---

## Build for Production

**Backend**

```bash
cd backend
npm start
```

**Frontend**

```bash
cd frontend
npm run build
npm run preview   # optional: preview build
```

Serve the `frontend/dist` folder with your preferred static host and point it to the same backend URL (or set `VITE_API_URL` at build time).

---

## Quick Start (TL;DR)

```bash
# Terminal 1 – backend
cd backend && npm install && cp .env.example .env
# Edit .env: set MONGODB_URI
npm run dev

# Terminal 2 – frontend
cd frontend && npm install && npm run dev
# Open http://localhost:5173
```
