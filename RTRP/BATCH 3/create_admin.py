"""
create_admin.py — Run this ONCE to create the admin account.

Usage:
    python create_admin.py

This will prompt for username, email, and password, then insert
the admin into the database.
"""
from werkzeug.security import generate_password_hash
import MySQLdb

# ⚠️  EDIT: match your config.py values
DB_HOST     = 'localhost'
DB_USER     = 'root'
DB_PASSWORD = 'sai0926'  # <- EDIT
DB_NAME     = 'eayfilo_db'

def main():
    print("=== Eayfilo Admin Account Creator ===\n")
    username = input("Admin username: ").strip()
    email    = input("Admin email   : ").strip()
    password = input("Admin password: ").strip()

    if len(password) < 6:
        print("Error: Password must be at least 6 characters.")
        return

    pw_hash = generate_password_hash(password)

    try:
        conn = MySQLdb.connect(
            host=DB_HOST, user=DB_USER,
            passwd=DB_PASSWORD, db=DB_NAME,
            charset='utf8mb4'
        )
        cur = conn.cursor()
        cur.execute(
            "INSERT IGNORE INTO admins (username, email, password_hash) VALUES (%s,%s,%s)",
            (username, email, pw_hash)
        )
        conn.commit()
        if cur.rowcount:
            print(f"\nAdmin '{username}' created successfully!")
            print(f"Login at: http://localhost:5000/admin/login")
        else:
            print(f"\nAdmin '{username}' already exists.")
        cur.close(); conn.close()
    except Exception as e:
        print(f"Database error: {e}")

if __name__ == '__main__':
    main()
