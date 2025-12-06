"""Check characters table schema"""
import sqlite3

conn = sqlite3.connect('rollscape_dev.db')
cursor = conn.cursor()

cursor.execute('PRAGMA table_info(characters)')
columns = cursor.fetchall()

print('Characters table columns:')
for col in columns:
    print(f'  {col[1]} ({col[2]})')

conn.close()
