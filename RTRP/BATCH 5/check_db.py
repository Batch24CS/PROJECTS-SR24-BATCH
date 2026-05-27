#!/usr/bin/env python
import sqlite3

conn = sqlite3.connect('eayfilo.db')
conn.row_factory = sqlite3.Row
cur = conn.cursor()

# Check templates table
print("Templates in database:")
cur.execute("SELECT * FROM templates")
for row in cur.fetchall():
    print(f"  - {dict(row)}")

# Check if tables exist
cur.execute("SELECT name FROM sqlite_master WHERE type='table'")
print("\nAll tables:")
for row in cur.fetchall():
    print(f"  - {row[0]}")

conn.close()
