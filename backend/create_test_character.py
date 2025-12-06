"""Create a test character for spell testing"""
import sqlite3
import json

conn = sqlite3.connect('rollscape_dev.db')
cursor = conn.cursor()

char_id = '00000000-0000-0000-0000-000000000001'
user_id = '00000000-0000-0000-0000-000000000001'
campaign_id = '00000000-0000-0000-0000-000000000002'

# Check if character exists
cursor.execute('SELECT id, name FROM characters WHERE id = ?', (char_id,))
exists = cursor.fetchone()

if exists:
    print(f'✅ Character already exists: {exists[1]} (ID: {char_id})')
else:
    # Create test wizard with minimal required fields
    cursor.execute('''
        INSERT INTO characters (
            id, name, user_id, campaign_id, character_type, character_class, level, race,
            ability_scores, max_hp, current_hp, armor_class,
            proficiency_bonus, spell_slots, spellcasting_ability,
            created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    ''', (
        char_id,
        'Test Wizard',
        user_id,
        campaign_id,
        'pc',
        'Wizard',
        5,
        'Human',
        json.dumps({"STR": 10, "DEX": 14, "CON": 13, "INT": 16, "WIS": 12, "CHA": 10}),
        28,
        28,
        12,
        3,
        json.dumps({"1": 4, "2": 3, "3": 2}),
        'INT'
    ))
    conn.commit()
    print(f'✅ Test wizard character created with ID: {char_id}')
    print(f'   Name: Test Wizard')
    print(f'   Class: Wizard (Level 5)')
    print(f'   Spell Slots: 1st(4), 2nd(3), 3rd(2)')

conn.close()
