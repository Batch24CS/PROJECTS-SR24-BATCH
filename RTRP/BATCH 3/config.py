# ============================================================
# config.py — Application Configuration
# ⚠️  EDIT the lines marked with  <- EDIT THIS
# ============================================================

import os

class Config:
    # ── Secret Key ─────────────────────────────────────────
    SECRET_KEY = os.environ.get('SECRET_KEY', 'eayfilo-secret-2024')

    # ── MySQL ───────────────────────────────────────────────
    # ⚠️  EDIT: your MySQL password
    MYSQL_HOST     = os.environ.get('MYSQL_HOST',     'localhost')
    MYSQL_USER     = os.environ.get('MYSQL_USER',     'root')
    MYSQL_PASSWORD = os.environ.get('MYSQL_PASSWORD', 'sai0926')  # <- EDIT
    MYSQL_DB       = os.environ.get('MYSQL_DB',       'eayfilo_db')
    MYSQL_PORT     = int(os.environ.get('MYSQL_PORT', 3306))

    # ── File Uploads ────────────────────────────────────────
    UPLOAD_FOLDER      = os.path.join(os.path.dirname(__file__), 'static', 'uploads')
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
    MAX_CONTENT_LENGTH = 10 * 1024 * 1024  # 10 MB

    # ── Gmail SMTP (for password reset) ─────────────────────
    # ⚠️  EDIT these 2 lines:
    #
    # MAIL_USERNAME → your Gmail address
    # MAIL_PASSWORD → 16-digit App Password from Google
    #   How to get App Password:
    #   1. myaccount.google.com
    #   2. Security → 2-Step Verification (enable it)
    #   3. Search "App passwords" at the top
    #   4. Create one → copy the 16-digit code
    #   5. Paste below (spaces are fine e.g. 'abcd efgh ijkl mnop')
    #
    MAIL_USERNAME = os.environ.get('MAIL_USERNAME', 'saipraneeth0426@gmail.com')        # <- EDIT
    MAIL_PASSWORD = os.environ.get('MAIL_PASSWORD', 'uezu vllu vhxu feim')         # <- EDIT

    # ── Password Reset Expiry ───────────────────────────────
    RESET_TOKEN_EXPIRY_MINUTES = 30

    # ── Debug ───────────────────────────────────────────────
    DEBUG = os.environ.get('DEBUG', 'True') == 'True'