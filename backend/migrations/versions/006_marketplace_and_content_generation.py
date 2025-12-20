"""
006_marketplace_and_content_generation

Add tables for:
- AI-generated content (NPCs, monsters, items, locations, quests, lore)
- Lore management system
- World marketplace
- Dice texture marketplace

Revision ID: 006_marketplace_and_content_generation
Revises: 005_spell_library
Create Date: 2025-12-06
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID
import uuid


# revision identifiers, used by Alembic.
revision = '006_marketplace_and_content_generation'
down_revision = '005_spell_library'
branch_labels = None
depends_on = None


def upgrade():
    """Create marketplace and content generation tables"""
    
    # ==================== WORLDS MARKETPLACE ====================
    
    op.create_table(
        'worlds',
        sa.Column('id', sa.String(36), primary_key=True, default=lambda: str(uuid.uuid4())),
        sa.Column('name', sa.String(255), nullable=False, index=True),
        sa.Column('description', sa.Text),
        sa.Column('tagline', sa.String(500)),
        sa.Column('setting', sa.Text),
        sa.Column('lore', sa.Text),
        sa.Column('rules', sa.Text),
        sa.Column('created_by_user_id', sa.String(36), sa.ForeignKey('users.id'), nullable=False, index=True),
        sa.Column('visibility', sa.String(20), nullable=False, index=True, default='private'),
        sa.Column('is_featured', sa.Boolean, default=False),
        sa.Column('tags', sa.Text),
        sa.Column('game_system', sa.String(100), default='dnd5e'),
        sa.Column('themes', sa.Text),
        sa.Column('npc_count', sa.Integer, default=0),
        sa.Column('location_count', sa.Integer, default=0),
        sa.Column('quest_count', sa.Integer, default=0),
        sa.Column('monster_count', sa.Integer, default=0),
        sa.Column('item_count', sa.Integer, default=0),
        sa.Column('likes_count', sa.Integer, default=0),
        sa.Column('shares_count', sa.Integer, default=0),
        sa.Column('uses_count', sa.Integer, default=0),
        sa.Column('rating_avg', sa.Float, default=0.0),
        sa.Column('rating_count', sa.Integer, default=0),
        sa.Column('cover_image_url', sa.Text),
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime, server_default=sa.func.now(), onupdate=sa.func.now()),
        sa.Column('published_at', sa.DateTime),
    )
    
    op.create_table(
        'world_likes',
        sa.Column('id', sa.String(36), primary_key=True, default=lambda: str(uuid.uuid4())),
        sa.Column('user_id', sa.String(36), sa.ForeignKey('users.id'), nullable=False, index=True),
        sa.Column('world_id', sa.String(36), sa.ForeignKey('worlds.id'), nullable=False, index=True),
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now()),
    )
    
    # Add world_id to campaigns table
    op.add_column('campaigns', sa.Column('world_id', sa.String(36), sa.ForeignKey('worlds.id'), nullable=True, index=True))
    
    # ==================== DICE TEXTURE MARKETPLACE ====================
    
    op.create_table(
        'dice_textures',
        sa.Column('id', sa.String(36), primary_key=True, default=lambda: str(uuid.uuid4())),
        sa.Column('name', sa.String(255), nullable=False, index=True),
        sa.Column('description', sa.Text),
        sa.Column('preview_image_url', sa.Text, nullable=False),
        sa.Column('d4_texture_url', sa.Text),
        sa.Column('d6_texture_url', sa.Text),
        sa.Column('d8_texture_url', sa.Text),
        sa.Column('d10_texture_url', sa.Text),
        sa.Column('d12_texture_url', sa.Text),
        sa.Column('d20_texture_url', sa.Text),
        sa.Column('d100_texture_url', sa.Text),
        sa.Column('d4_model_url', sa.Text),
        sa.Column('d6_model_url', sa.Text),
        sa.Column('d8_model_url', sa.Text),
        sa.Column('d10_model_url', sa.Text),
        sa.Column('d12_model_url', sa.Text),
        sa.Column('d20_model_url', sa.Text),
        sa.Column('d100_model_url', sa.Text),
        sa.Column('created_by_user_id', sa.String(36), sa.ForeignKey('users.id'), nullable=False, index=True),
        sa.Column('is_free', sa.Boolean, default=True),
        sa.Column('price_cents', sa.Integer, default=0),
        sa.Column('tags', sa.Text),
        sa.Column('style', sa.String(100)),
        sa.Column('visibility', sa.String(20), nullable=False, index=True, default='public'),
        sa.Column('is_featured', sa.Boolean, default=False),
        sa.Column('is_official', sa.Boolean, default=False),
        sa.Column('likes_count', sa.Integer, default=0),
        sa.Column('downloads_count', sa.Integer, default=0),
        sa.Column('purchases_count', sa.Integer, default=0),
        sa.Column('rating_avg', sa.Float, default=0.0),
        sa.Column('rating_count', sa.Integer, default=0),
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime, server_default=sa.func.now(), onupdate=sa.func.now()),
    )
    
    op.create_table(
        'dice_texture_purchases',
        sa.Column('id', sa.String(36), primary_key=True, default=lambda: str(uuid.uuid4())),
        sa.Column('user_id', sa.String(36), sa.ForeignKey('users.id'), nullable=False, index=True),
        sa.Column('texture_id', sa.String(36), sa.ForeignKey('dice_textures.id'), nullable=False, index=True),
        sa.Column('price_paid_cents', sa.Integer, nullable=False),
        sa.Column('stripe_payment_intent_id', sa.String(255)),
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now()),
    )
    
    op.create_table(
        'dice_texture_likes',
        sa.Column('id', sa.String(36), primary_key=True, default=lambda: str(uuid.uuid4())),
        sa.Column('user_id', sa.String(36), sa.ForeignKey('users.id'), nullable=False, index=True),
        sa.Column('texture_id', sa.String(36), sa.ForeignKey('dice_textures.id'), nullable=False, index=True),
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now()),
    )
    
    # ==================== GENERATED CONTENT ====================
    
    op.create_table(
        'generated_content',
        sa.Column('id', sa.String(36), primary_key=True, default=lambda: str(uuid.uuid4())),
        sa.Column('content_type', sa.String(50), nullable=False, index=True),
        sa.Column('name', sa.String(255), nullable=False, index=True),
        sa.Column('description', sa.Text),
        sa.Column('content_data', sa.Text, nullable=False),
        sa.Column('created_by_user_id', sa.String(36), sa.ForeignKey('users.id'), nullable=False, index=True),
        sa.Column('campaign_id', sa.String(36), sa.ForeignKey('campaigns.id'), nullable=True, index=True),
        sa.Column('world_id', sa.String(36), nullable=True, index=True),
        sa.Column('visibility', sa.String(20), nullable=False, index=True, default='private'),
        sa.Column('prompt', sa.Text),
        sa.Column('model_used', sa.String(100)),
        sa.Column('generation_tokens', sa.Integer),
        sa.Column('tags', sa.Text),
        sa.Column('challenge_rating', sa.String(20)),
        sa.Column('rarity', sa.String(50)),
        sa.Column('item_type', sa.String(100)),
        sa.Column('is_featured', sa.Boolean, default=False),
        sa.Column('is_public', sa.Boolean, default=False),
        sa.Column('likes_count', sa.Integer, default=0),
        sa.Column('uses_count', sa.Integer, default=0),
        sa.Column('image_url', sa.Text),
        sa.Column('image_prompt', sa.Text),
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime, server_default=sa.func.now(), onupdate=sa.func.now()),
    )
    
    op.create_table(
        'content_likes',
        sa.Column('id', sa.String(36), primary_key=True, default=lambda: str(uuid.uuid4())),
        sa.Column('user_id', sa.String(36), sa.ForeignKey('users.id'), nullable=False, index=True),
        sa.Column('content_id', sa.String(36), sa.ForeignKey('generated_content.id'), nullable=False, index=True),
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now()),
    )
    
    # ==================== LORE MANAGEMENT ====================
    
    op.create_table(
        'lore_entries',
        sa.Column('id', sa.String(36), primary_key=True, default=lambda: str(uuid.uuid4())),
        sa.Column('title', sa.String(255), nullable=False, index=True),
        sa.Column('content', sa.Text, nullable=False),
        sa.Column('summary', sa.Text),
        sa.Column('category', sa.String(50), nullable=False, index=True),
        sa.Column('tags', sa.Text),
        sa.Column('campaign_id', sa.String(36), sa.ForeignKey('campaigns.id'), nullable=False, index=True),
        sa.Column('created_by_user_id', sa.String(36), sa.ForeignKey('users.id'), nullable=False, index=True),
        sa.Column('importance', sa.Integer, default=5),
        sa.Column('is_secret', sa.Boolean, default=False),
        sa.Column('reveal_condition', sa.Text),
        sa.Column('related_npcs', sa.Text),
        sa.Column('related_locations', sa.Text),
        sa.Column('related_events', sa.Text),
        sa.Column('embedding', sa.Text),
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime, server_default=sa.func.now(), onupdate=sa.func.now()),
        sa.Column('last_referenced', sa.DateTime),
    )
    
    print("✅ Created marketplace and content generation tables")


def downgrade():
    """Drop marketplace and content generation tables"""
    
    op.drop_table('lore_entries')
    op.drop_table('content_likes')
    op.drop_table('generated_content')
    op.drop_table('dice_texture_likes')
    op.drop_table('dice_texture_purchases')
    op.drop_table('dice_textures')
    op.drop_table('world_likes')
    op.drop_column('campaigns', 'world_id')
    op.drop_table('worlds')
    
    print("✅ Dropped marketplace and content generation tables")
