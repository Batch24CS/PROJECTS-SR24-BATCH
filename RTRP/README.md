# EduReach Smart College Portal

Modernized Sphoorthy Engineering College portal with the existing website preserved and upgraded with an AI assistant, student dashboard, admin dashboard, complaints, notices, placements, and MongoDB-ready backend schemas.

## Folder Structure

```text
edureach-agentic-colleage-chatbot/
  client/edureach-platform/      React + Vite frontend
    src/components/              Navbar, footer, chatbot, portal sections
    src/pages/                   Home, login, signup, student/admin dashboards
    src/services/                API, auth, chat, portal services
  server/                        Node.js + Express backend
    src/config/mongo.js          Optional MongoDB connection
    src/models/index.js          MongoDB schemas
    src/lib/                     Chatbot data and JSON fallback store
    src/index.js                 Auth, chat, admin, student APIs
    data/db.json                 Local fallback database
```

## Environment Setup

Create `server/.env`:

```env
PORT=5000
JWT_SECRET=change-this-secret
CLIENT_ORIGIN=http://localhost:5173
MONGODB_URI=mongodb://127.0.0.1:27017/edureach_college_portal
MONGODB_DB=edureach_college_portal
OPENAI_API_KEY=your_openai_key
OPENAI_MODEL=gpt-4.1-mini
ADMIN_EMAIL=admin@sphoorthy.edu
ADMIN_PASSWORD=Admin@12345
```

Create `client/edureach-platform/.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

## Run Locally

```bash
cd server
npm install
npm run dev
```

```bash
cd client/edureach-platform
npm install
npm run dev
```

Open `http://localhost:5173`.

## Features

- Sticky responsive navbar, dark mode toggle, modern footer-ready layout, smart portal cards.
- Floating chatbot on every page with chat history, typing state, quick suggestions, voice input, and English/Telugu language toggle.
- JWT login with bcrypt password hashing and role-aware student/admin access.
- Student dashboard for attendance, internal marks, results, fee status, notifications, timetable, and complaints.
- Admin dashboard for notices, placement circulars, chatbot FAQs, complaints, chat logs, and PDF knowledge-base uploads.
- AI assistant uses official local data, admin FAQs, uploaded PDF chunks, and OpenAI when `OPENAI_API_KEY` is configured.
- Security middleware includes Helmet, rate limiting, validation, secure admin route checks, and environment variables.
- MongoDB schemas are provided for students, faculty, attendance, placements, notices, complaints, chatbot logs, events, and PDFs. The local JSON fallback keeps deployment simple when MongoDB is not configured.

## Default Admin

Use the environment values or the fallback:

- Email: `admin@sphoorthy.edu`
- Password: `Admin@12345`

Change these before production.

## Deployment

1. Deploy the server to Render, Railway, VPS, or any Node host.
2. Set all server environment variables, especially `JWT_SECRET`, `MONGODB_URI`, and `OPENAI_API_KEY`.
3. Deploy the frontend build from `client/edureach-platform/dist`.
4. Set `VITE_API_URL` to the deployed backend `/api` URL.
5. Configure CORS with `CLIENT_ORIGIN`.

## Verification

```bash
cd client/edureach-platform
npm run build
```

```bash
cd server
node --check src/index.js
```
