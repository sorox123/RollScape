"""
Apply migration 006 - Marketplace and Content Generation
"""

import sys
sys.path.append('.')

from database import engine, Base
from models import (
    User, Campaign, Character, GameSession, CampaignMember,
    CharacterEffect, SessionLog, GeneratedImage, GeneratedMap,
    Spell, CharacterSpell,
    GeneratedContent, ContentLike,
    LoreEntry,
    World, WorldLike,
    DiceTexture, DiceTexturePurchase, DiceTextureLike
)

print("Creating all tables...")
Base.metadata.create_all(bind=engine)
print("✅ All tables created successfully!")

# Verify tables
from sqlalchemy import inspect
inspector = inspect(engine)
tables = inspector.get_table_names()

print(f"\n📊 Total tables: {len(tables)}")
print("\nNew tables created:")
new_tables = ['worlds', 'world_likes', 'dice_textures', 'dice_texture_purchases', 
              'dice_texture_likes', 'generated_content', 'content_likes', 'lore_entries']
for table in new_tables:
    if table in tables:
        print(f"  ✅ {table}")
    else:
        print(f"  ❌ {table} (MISSING)")
