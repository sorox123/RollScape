"""Enhanced character sheets with full D&D 5e fields

Revision ID: 004_enhanced_character_sheets
Revises: 003_absentee_votes
Create Date: 2025-11-24

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB


# revision identifiers, used by Alembic.
revision = '004_enhanced_character_sheets'
down_revision = 'd23913ad4e9f'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Add enhanced D&D 5e character fields"""
    
    # Add additional ability score tracking
    op.add_column('characters', sa.Column('ability_score_improvements', JSONB, server_default='{}'))
    op.add_column('characters', sa.Column('proficiency_bonus', sa.Integer, server_default='2'))
    
    # Add death saves
    op.add_column('characters', sa.Column('death_save_successes', sa.Integer, server_default='0'))
    op.add_column('characters', sa.Column('death_save_failures', sa.Integer, server_default='0'))
    
    # Add hit dice
    op.add_column('characters', sa.Column('hit_dice_total', sa.Integer, server_default='1'))
    op.add_column('characters', sa.Column('hit_dice_remaining', sa.Integer, server_default='1'))
    op.add_column('characters', sa.Column('hit_die_type', sa.String(10), server_default='d8'))
    
    # Add resources and spell slots
    op.add_column('characters', sa.Column('spell_slots', JSONB, server_default='{}'))
    op.add_column('characters', sa.Column('spell_slots_used', JSONB, server_default='{}'))
    op.add_column('characters', sa.Column('spellcasting_ability', sa.String(3), nullable=True))  # INT, WIS, CHA
    op.add_column('characters', sa.Column('spell_save_dc', sa.Integer, nullable=True))
    op.add_column('characters', sa.Column('spell_attack_bonus', sa.Integer, nullable=True))
    
    # Add class resources (Ki, Rage, Sorcery Points, etc.)
    op.add_column('characters', sa.Column('class_resources', JSONB, server_default='{}'))
    
    # Add currency
    op.add_column('characters', sa.Column('currency', JSONB, server_default='{"cp": 0, "sp": 0, "ep": 0, "gp": 0, "pp": 0}'))
    
    # Add inspiration
    op.add_column('characters', sa.Column('inspiration', sa.Boolean, server_default='false'))
    
    # Add exhaustion levels
    op.add_column('characters', sa.Column('exhaustion_level', sa.Integer, server_default='0'))
    
    # Add conditions (poisoned, paralyzed, etc.)
    op.add_column('characters', sa.Column('conditions', JSONB, server_default='[]'))
    
    # Add detailed equipment tracking
    op.add_column('characters', sa.Column('weapons', JSONB, server_default='[]'))
    op.add_column('characters', sa.Column('armor', JSONB, server_default='{}'))
    op.add_column('characters', sa.Column('inventory', JSONB, server_default='[]'))
    op.add_column('characters', sa.Column('attunement_slots_used', sa.Integer, server_default='0'))
    
    # Add passive scores
    op.add_column('characters', sa.Column('passive_perception', sa.Integer, server_default='10'))
    op.add_column('characters', sa.Column('passive_investigation', sa.Integer, server_default='10'))
    op.add_column('characters', sa.Column('passive_insight', sa.Integer, server_default='10'))
    
    # Add class and subclass
    op.add_column('characters', sa.Column('subclass', sa.String(100), nullable=True))
    op.add_column('characters', sa.Column('multiclass', JSONB, server_default='[]'))  # [{class: "Fighter", level: 3}]
    
    # Add appearance details
    op.add_column('characters', sa.Column('age', sa.Integer, nullable=True))
    op.add_column('characters', sa.Column('height', sa.String(20), nullable=True))
    op.add_column('characters', sa.Column('weight', sa.String(20), nullable=True))
    op.add_column('characters', sa.Column('eyes', sa.String(50), nullable=True))
    op.add_column('characters', sa.Column('skin', sa.String(50), nullable=True))
    op.add_column('characters', sa.Column('hair', sa.String(50), nullable=True))


def downgrade() -> None:
    """Remove enhanced character fields"""
    
    # Remove appearance
    op.drop_column('characters', 'hair')
    op.drop_column('characters', 'skin')
    op.drop_column('characters', 'eyes')
    op.drop_column('characters', 'weight')
    op.drop_column('characters', 'height')
    op.drop_column('characters', 'age')
    
    # Remove class details
    op.drop_column('characters', 'multiclass')
    op.drop_column('characters', 'subclass')
    
    # Remove passive scores
    op.drop_column('characters', 'passive_insight')
    op.drop_column('characters', 'passive_investigation')
    op.drop_column('characters', 'passive_perception')
    
    # Remove equipment
    op.drop_column('characters', 'attunement_slots_used')
    op.drop_column('characters', 'inventory')
    op.drop_column('characters', 'armor')
    op.drop_column('characters', 'weapons')
    
    # Remove conditions and exhaustion
    op.drop_column('characters', 'conditions')
    op.drop_column('characters', 'exhaustion_level')
    op.drop_column('characters', 'inspiration')
    
    # Remove currency
    op.drop_column('characters', 'currency')
    
    # Remove class resources
    op.drop_column('characters', 'class_resources')
    
    # Remove spellcasting
    op.drop_column('characters', 'spell_attack_bonus')
    op.drop_column('characters', 'spell_save_dc')
    op.drop_column('characters', 'spellcasting_ability')
    op.drop_column('characters', 'spell_slots_used')
    op.drop_column('characters', 'spell_slots')
    
    # Remove hit dice
    op.drop_column('characters', 'hit_die_type')
    op.drop_column('characters', 'hit_dice_remaining')
    op.drop_column('characters', 'hit_dice_total')
    
    # Remove death saves
    op.drop_column('characters', 'death_save_failures')
    op.drop_column('characters', 'death_save_successes')
    
    # Remove ability tracking
    op.drop_column('characters', 'proficiency_bonus')
    op.drop_column('characters', 'ability_score_improvements')
