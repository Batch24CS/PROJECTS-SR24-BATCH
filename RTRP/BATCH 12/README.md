# 🎬 SkyCinema

## 🌌 Real-Time Multi-Theater Movie Ticket Booking Platform

### ⚡ Smart Seat Conflict Handling • 🎟 QR Tickets • 🛰 Live Synchronization

SkyCinema is a production-style real-time movie ticket booking platform inspired by modern cinematic ecosystems like BookMyShow, PVR, and IMAX digital booking infrastructures.

Designed using **Node.js, Express.js, Socket.io, MySQL, EJS, and QR-based validation**, the system focuses on delivering a realistic multiplex booking experience with high-speed real-time synchronization and intelligent seat conflict prevention.

---

# 🌟 Platform Highlights

* 🎞 Live movie ticket booking
* 🧠 Smart seat conflict detection
* ⚡ Real-time seat synchronization
* 🔐 OTP-based secure authentication
* 🏙 Multi-theater & multi-screen support
* 🎫 QR-powered digital tickets
* 📷 Theatre-side ticket scanner
* 📊 Advanced admin analytics
* 🔔 Intelligent notifications system
* 🎨 Cinematic responsive UI/UX
* 🚀 Production-style architecture

---

# 🛡 Authentication System

## 📨 OTP-Based Login

* 6-digit OTP verification
* 5-minute OTP expiration
* Session-based authentication
* Secure role authorization

### 👑 Admin Quick Access

Email:

```txt id="h4p1xk"
admin@skycinema.com
```

DEV OTP:

```txt id="r5a9yc"
000000
```

---

# 🧩 Role-Based Ecosystem

| Identity         | Permissions                                   |
| ---------------- | --------------------------------------------- |
| 🎟 Customer      | Browse movies, book tickets, manage bookings  |
| 🧑‍💼 Admin      | Platform analytics, movie control, monitoring |
| 🏢 Theatre Owner | Show management & QR validation               |

---

# 🎥 Entertainment Management System

## 🎬 Movie Infrastructure

* Dynamic movie listing engine
* Multi-date show scheduling
* Multi-theatre architecture
* GOLD & SILVER seat categories
* Theatre occupancy tracking

### 📅 Supported Show Dates

* Today
* Tomorrow

---

# ⚡ Smart Real-Time Seat Engine

## 🧠 Core Innovation of SkyCinema

SkyCinema solves real-time booking conflicts using a Socket.io-driven synchronization engine.

### 🔄 Seat Lock Workflow

1. 👤 User selects a seat
2. ⚡ Seat instantly locks
3. 🌐 All users receive live update
4. ⏳ Auto unlock after 2 minutes
5. ✅ Booking confirmation finalizes reservation

### 🎯 Advantages

* Prevents duplicate booking
* Eliminates stale seat data
* Supports concurrent users
* Simulates real multiplex booking

---

# 🎟 Digital Ticket Infrastructure

After successful booking:

* 🎫 Ticket generated instantly
* 🔳 Unique QR embedded
* 🗃 Booking stored in MySQL
* 📁 QR images saved automatically

Storage Path:

```txt id="v8k3we"
uploads/tickets/
```

---

# 📷 Theatre-Side Validation System

Theatre owners can validate tickets using:

```txt id="v4c7ms"
/theatre/scanner
```

### 🔍 Scanner Results

* ✅ VALID
* ❌ INVALID
* ⚠ ALREADY USED

---

# 📊 Monitoring Dashboards

## 🧑‍💼 Admin Control Center

* User management
* Revenue analytics
* Booking reports
* Review moderation
* Occupancy statistics
* Platform monitoring

## 🏢 Theatre Operations Dashboard

* Show scheduling
* Seat occupancy tracking
* QR ticket validation
* Theatre analytics

---

# 🧠 Technology Stack

## 🎨 Frontend Technologies

* HTML5
* CSS3
* Bootstrap 5
* Vanilla JavaScript
* EJS

## ⚙ Backend Technologies

* Node.js
* Express.js
* Socket.io

## 🗄 Database

* MySQL

## 🧰 Utilities & Services

* Nodemailer
* QRCode
* JWT Authentication

---

# ⚙ Environment Setup

Create a `.env` file:

```env id="f6w3zt"
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

---

# 🗃 Database Configuration

SkyCinema automatically:

* 🛠 Creates database
* 📑 Generates required tables
* 🌱 Seeds demo content

Reference Files:

```txt id="x7t4pe"
database/schema.sql
database/seed.sql
```

---

# 🚀 Run The Project

## 📦 Install Dependencies

```bash id="w3m8ds"
npm install
```

## ▶ Start Development Server

```bash id="t8v4ra"
npm run dev
```

Open:

```txt id="o5k7pl"
http://localhost:3000
```

---

# 🧪 OTP Login Testing

## 🔐 Login Flow

1. Open:

```txt id="z6r2ma"
/login
```

2. Enter email

3. OTP will:

* 📩 Send through mail
* 🧪 Return in dev response

### 👑 Admin Shortcut

```txt id="g2f8ln"
Email: admin@skycinema.com
OTP: 000000
```

---

# 🎟 Ticket Booking Flow

1. 🏠 Open homepage
2. 🎬 Select movie
3. 🏢 Choose theatre
4. ⏰ Pick show timing
5. 🔐 Login if required
6. 💺 Select seats
7. ⚡ Observe live locking
8. 🎫 Click:

```txt id="m8x2qy"
Get Ticket
```

9. ✅ QR ticket generated

---

# 📷 QR Validation Demo

1. 🎟 Book ticket
2. 🔳 Open ticket QR
3. 🏢 Login as theatre owner
4. 📷 Open:

```txt id="u6b3tk"
/theatre/scanner
```

5. 🔍 Scan QR
6. ✅ Validate ticket

---

# 🎬 Seeded Demo Universe

## 🎞 Movies

* RRR
* KGF
* Pushpa
* Interstellar

## 🏢 Theatres

* PVR Hyderabad
* INOX Bangalore
* Cinepolis Chennai
* AMB Hyderabad

## ⏰ Show Timings

* 10:00 AM
* 01:00 PM
* 04:00 PM
* 08:00 PM

## 💺 Seat Capacity

* 300 seats per show
* GOLD & SILVER zones

---

# 🔮 Future Enhancements

* 💳 Razorpay/Stripe integration
* 🤖 AI seat recommendations
* 📱 Android/iOS mobile apps
* 📈 Revenue prediction analytics
* 🌩 Cloud deployment
* 🔔 Push notifications
* 🎯 Dynamic pricing engine
* 🛰 Live theatre occupancy heatmaps

---

# 🛡 Important Notes

* 💳 Payment gateway intentionally removed
* ⚡ Booking confirms instantly on:

```txt id="s9e1vw"
Get Ticket
```

* 🧠 Smart seat conflict handling is the primary research innovation

---

# 👨‍💻 Academic Project

### 🎓 B.Tech RTRP / PBL Project

Department of Computer Science & Engineering (Cyber Security)
Sphoorthy Engineering College

---

# 🎞 SkyCinema

> 🌌 “Experience the Future of Real-Time Movie Booking.”
