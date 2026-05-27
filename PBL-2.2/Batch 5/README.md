# Sphoorthy Engineering College ERP

Sphoorthy Engineering College ERP is a full-stack college management app for students, faculty, HODs, and administrators. It combines authentication, dashboards, attendance, academic resources, notices, events, chat, notifications, campus presence, and a campus map in one MySQL-backed system.

## Features

- Role-based login and dashboards for students, faculty, HODs, and admins
- Student signup, faculty signup, and registration request management
- Attendance workflows with campus location checks and geofencing
- Academic document uploads and downloads
- Events, notices, profile management, and password reset
- Real-time notifications, chat, and Socket.io campus presence
- Sphoorthy Engineering College map with campus zones and test coordinates
- Single production server that serves both `/api/*` routes and the built React app

## Tech Stack

- Frontend: React 18, Vite, Tailwind CSS, Axios, Leaflet, React Leaflet, Framer Motion, Lucide React
- Backend: Node.js, Express, Socket.io, MySQL2, JWT, bcryptjs, Multer, Nodemailer
- Database: MySQL

## Project Structure

.
|-- client/              # React + Vite frontend
|-- server/              # Express API, Socket.io, MySQL config, routes, controllers
|-- uploads/             # Root-level uploaded assets, if used locally
|-- app.js               # Root entrypoint that imports server/app.js
|-- package.json         # Root scripts for install, build, seed, start, and dev
`-- README.md
```

## Prerequisites

- Node.js 18 or newer
- npm
- MySQL Server
- MySQL Workbench or another MySQL client

## Setup

1. Install dependencies:


npm run install-all
```

2. Create the MySQL database:


CREATE DATABASE sweety_smart_students;
```

3. Import the schema from:


server/database.sql
```

4. Create `server/.env` from `server/.env.example`:


DB_HOST=127.0.0.1
DB_PORT=3307
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=folder_name
JWT_SECRET=folder_key
PORT=5000
CLIENT_URL=http://localhost:5000


5. Seed demo data:

npm run seed


6. Build and start the app:

npm start

Open the app at:

http://localhost:5000

The Express server in `server/app.js` serves API routes under `/api/*`, uploaded files under `/uploads`, and the built React app from `client/dist`.

## Development

Run the frontend and backend together in development mode:


npm run dev


Run only the backend:


npm run start:server

Build the frontend:


npm run build

## Available Scripts

| Command | Description |
| --- | --- |
| `npm run install-all` | Install backend and frontend dependencies |
| `npm run build` | Install frontend dependencies and build `client/dist` |
| `npm run seed` | Seed the MySQL database with demo data |
| `npm run reset-admin` | Reset the seeded admin account password |
| `npm start` | Build the frontend and start the production Express server |
| `npm run start:server` | Start only the Express server |
| `npm run dev` | Run server and client development servers together |

## Demo Accounts

Admin:

- Email: `adminn@gmail.com`
- Password: `admin@123`

Student:

- Roll number: `CSE21001`
- Password: `student123`

Faculty:

- ID or email: `FAC001` or `faculty@sphoorthy.edu`
- Password: `faculty123`

Cyber Security student:

- Roll number: `CS21001`
- Password: `student123`

Cyber Security faculty:

- ID or email: `CS001` or `csfaculty@sphoorthy.edu`
- Password: `faculty123`

If the admin login fails after using an older database setup, reset the password:

npm run reset-admin

## Campus Testing

The app treats Sphoorthy Engineering College as the testing campus.

Latitude: 17.32140259443128
Longitude: 78.55025140223047
Radius: 180m


Campus zones include SV Block, Gate, Ground floor, floor rooms, MV Block, Main Gate, and Canteen.

## Environment Notes

- `CLIENT_URL` should match the frontend origin allowed by CORS.
- For the production-style root server, keep `CLIENT_URL=http://localhost:5000`.
- For local Vite development, set the frontend API base with `VITE_API_URL` if the client runs on a different origin.
- Uploaded files are served from `/uploads`.

## Troubleshooting

- Database connection errors usually mean `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, or `DB_NAME` in `server/.env` does not match your MySQL setup.
- If signup fails, check the backend console. During development it logs `Signup payload: ...` and `Signup error: ...`.
- The frontend displays backend validation messages such as duplicate email, duplicate roll number, missing fields, and database errors.
- If pages load but API calls fail in development, confirm the server is running and the frontend API URL points to the backend.


