# Student Portfolio Generator

A full-stack web application where students build a **project-first portfolio website**, choose from 3 stunning designs, and **download it as a ready-to-deploy ZIP** — no backend required after download.

---

## ⚠️ Where to Edit Before Running

| File | What to Edit |
|---|---|
| `config.py` line 13 | `MYSQL_PASSWORD = 'YOUR_MYSQL_PASSWORD_HERE'` ← set your MySQL password |
| `config.py` line 10 | `SECRET_KEY` ← change to any random string |
| `config.py` line 8 | `MYSQL_USER` ← change if not using `root` |

---

## Features

### Core
- **Register / Login / Logout** with password hashing
- **Dashboard** with portfolio overview
- **Portfolio Info Form**: display name, title/role, bio, location, availability, contact email, social links (GitHub, LinkedIn, Twitter, website), tech stack, stats, quote
- **Profile photo upload**
- **Projects**: full CRUD — add, edit, delete; multiple images per project; tech tags; live URL; GitHub URL; year; featured flag
- **Template selection**: 3 unique designs
- **Live iframe preview** with template switching
- **Download as ZIP**: fully static website (HTML + CSS + JS + images) — open locally or deploy to GitHub Pages / Netlify
- **My Portfolios**: view, edit, duplicate, delete all portfolios
- **Duplicate portfolio** (clone with projects)

### 3 Portfolio Designs
| # | Name | Description |
|---|---|---|
| 1 | Minimal Elegant | White space, serif typography, scroll reveals, custom cursor |
| 2 | Bento Dark | Dark grid, glowing cards, gradient text, hover animations |
| 3 | Bento Sage Green | Sage palette, organic bento grid, mouse-tracking glow |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML5, CSS3, Bootstrap 5, JavaScript |
| Backend | Python Flask 3.0 |
| Database | MySQL 8.0+ |
| Template Engine | Jinja2 |
| Portfolio Designs | Tailwind CSS CDN (embedded in portfolio templates) |
| ZIP Generation | Python `zipfile` + `io.BytesIO` |

---

## Folder Structure

```
student-portfolio-generator/
│
├── app.py                          # Flask app factory + entry point
├── config.py                       # ⚠️ EDIT: MySQL password here
├── requirements.txt
├── README.md
│
├── database/
│   └── schema.sql                  # MySQL schema — run this first
│
├── static/
│   ├── css/
│   │   ├── main.css                # Admin UI styles (minimalist)
│   │   └── portfolio.css           # Included in downloaded ZIP
│   ├── js/
│   │   └── main.js                 # UI helpers
│   ├── images/                     # Static images
│   └── uploads/
│       ├── profiles/               # Profile photo uploads (auto-created)
│       └── projects/               # Project image uploads (auto-created)
│
├── templates/
│   ├── base.html                   # Shared layout (nav, flash, footer)
│   ├── index.html                  # Landing page
│   ├── login.html
│   ├── register.html
│   ├── dashboard.html
│   ├── create_portfolio.html       # Step 1: title
│   ├── edit_info.html              # Step 2: branding, bio, links, tech
│   ├── manage_projects.html        # Step 3: add/list/delete projects
│   ├── edit_project.html           # Edit a single project + images
│   ├── template_selection.html     # Step 4: choose design
│   ├── preview_portfolio.html      # Step 5: iframe preview + download
│   ├── my_portfolios.html          # All portfolios list
│   ├── 404.html
│   ├── 500.html
│   └── portfolio_templates/
│       ├── template1.html          # Design 1: Minimal Elegant
│       ├── template2.html          # Design 2: Bento Dark
│       └── template3.html          # Design 3: Bento Sage Green
│
├── routes/
│   ├── __init__.py
│   ├── auth_routes.py              # /register /login /logout
│   ├── dashboard_routes.py         # /dashboard + login_required
│   └── portfolio_routes.py         # Portfolio CRUD + projects + ZIP download
│
├── models/
│   ├── __init__.py
│   ├── db.py                       # MySQL connection
│   ├── user_model.py
│   ├── portfolio_model.py          # Portfolio + Projects + Images CRUD
│   └── template_model.py
│
└── utils/
    ├── __init__.py
    ├── password_utils.py
    ├── validators.py
    ├── file_handler.py             # Upload + delete helpers
    └── zip_generator.py            # ← Builds the static ZIP download
```

---

## Prerequisites

- **Python** 3.10+
- **MySQL** 8.0+
- **pip** (latest)
- Virtual environment (recommended)

---

## Setup Instructions

### 1. Clone / Download

```bash
git clone https://github.com/yourname/student-portfolio-generator.git
cd student-portfolio-generator
```

### 2. Create Virtual Environment

```bash
python -m venv venv

# Windows
venv\Scripts\activate

# macOS / Linux
source venv/bin/activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

**If `mysqlclient` fails on Windows:**
```bash
pip install --only-binary :all: mysqlclient
```

**On Ubuntu/Debian:**
```bash
sudo apt-get install python3-dev default-libmysqlclient-dev build-essential
pip install mysqlclient
```

**On macOS (Homebrew):**
```bash
brew install mysql-client pkg-config
pip install mysqlclient
```

### 4. Create MySQL Database and Import Schema

```bash
mysql -u root -p < database/schema.sql
```

Or inside MySQL console:
```sql
SOURCE /full/path/to/student-portfolio-generator/database/schema.sql;
```

### 5. ⚠️ Configure config.py

Open `config.py` and set your MySQL password:

```python
MYSQL_PASSWORD = 'your_actual_mysql_password'  # ← Change this
SECRET_KEY     = 'any-random-secret-string'     # ← Change this
```

### 6. Run the App

```bash
python app.py
```

Open browser: **http://localhost:5000**

---

## User Flow (Step by Step)

1. **Register** → create account
2. **Create Portfolio** → enter a title
3. **Edit Info** → fill display name, title/role, bio, location, contact, social links, tech stack
4. **Upload profile photo**
5. **Add Projects** → title, description, tech tags, live URL, GitHub URL, year, multiple images
6. **Choose Template** → select one of 3 designs
7. **Preview** → see live iframe; switch templates instantly
8. **Download ZIP** → click Download ZIP button
9. Open the downloaded `portfolio/index.html` in any browser — it works offline!
10. Or deploy: push to GitHub Pages, or drag-and-drop on Netlify

---

## ZIP Contents

```
portfolio/
├── index.html        ← fully rendered, no {{ }} remaining
├── css/
│   ├── main.css
│   └── portfolio.css
├── js/
│   └── main.js
├── images/
│   ├── profile.jpg   ← profile photo
│   ├── abc123.jpg    ← project images
│   └── ...
└── README.md         ← deployment instructions for the user
```

---

## MVP Limitations

- No public share links (only ZIP download, by design)
- No AI features
- No admin panel
- No analytics
- Tailwind CSS is loaded via CDN in portfolio templates (requires internet for first open; works offline if cached)
- Photo paths in ZIP use filenames — do not rename the `images/` folder

---

## Future Scope

- More templates (5–10 designs)
- Custom domain / subdomain
- Password-protected portfolio links
- Contact form with email integration
- Real-time drag-and-drop section reordering
- Dark/light mode toggle in admin UI
- Mobile app
- Portfolio analytics (views, clicks)
# protfolio-generator
# protfolio-generator
