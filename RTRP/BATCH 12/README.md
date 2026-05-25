# SkyCinema

SkyCinema is a production-style demo movie booking system built with Node.js, Express, EJS, Socket.io, MySQL, Nodemailer OTP login, and QR ticket generation.

## Features

- OTP-only login with 6-digit code and 5-minute expiry
- Default admin: `admin@skycinema.com` with DEV OTP bypass `000000`
- Three protected roles: user, admin, theatre owner
- Exactly 4 seeded movies on the home page
- Date-wise shows for today and tomorrow
- 300 seats per show with GOLD and SILVER pricing
- Real-time seat locking with Socket.io and 2-minute auto unlock
- Booking flow without payment gateway
- QR ticket generation and theatre-side QR scanner validation
- Admin and theatre dashboards with booking and occupancy stats

## Tech Stack

- Frontend: HTML, CSS, Bootstrap 5, Vanilla JavaScript, EJS
- Backend: Node.js, Express.js, Socket.io
- Database: MySQL
- Other: Nodemailer, `qrcode`

## Environment

Create or update `.env` with:

```env
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PORT=3307
DB_PASSWORD=root123
DB_NAME=skycinema_db
JWT_SECRET=skycinema_super_secret_key
JWT_EXPIRES_IN=2d
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
APP_URL=http://localhost:3000
```

## MySQL Setup

1. Make sure MySQL is running and the credentials in `.env` are correct.
2. The app auto-creates `skycinema_db` if it does not exist.
3. The app auto-creates all required tables at startup.
4. `database/schema.sql` and `database/seed.sql` are included for reference.

## Install and Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## OTP Test

1. Open `/login`
2. Enter any email to receive OTP
3. In demo/dev mode the API response also returns the OTP to the browser flow
4. Admin shortcut: login with `admin@skycinema.com` and OTP `000000`

## Booking Test

1. Open the home page
2. Select a movie
3. Choose a future show
4. Login as a user if needed
5. Lock seats on the seat map
6. Click `Get Ticket`
7. Seats become booked and the ticket page opens

## QR Test

1. Book a ticket
2. Open the ticket page and confirm the QR is visible
3. Login as a theatre owner, open `/theatre/scanner`
4. Scan the QR and verify it returns `VALID`

## Seeded Demo Data

- Movies: `RRR`, `KGF`, `Pushpa`, `Interstellar`
- Theatres: `PVR Hyderabad`, `INOX Bangalore`, `Cinepolis Chennai`, `AMB Hyderabad`
- Each theatre starts with `Screen 1`
- Show times: `10:00`, `13:00`, `16:00`, `20:00`
- Shows are generated for today and tomorrow

## Notes

- Payment integration is intentionally removed.
- Booking completes immediately on `Get Ticket`.
- QR images are written to `uploads/tickets`.
