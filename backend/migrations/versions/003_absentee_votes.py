"""Add absentee voting system

Revision ID: 003_absentee_votes
Revises: 002_game_sessions
Create Date: 2024-11-19 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '003_absentee_votes'
down_revision = '002_game_sessions'
branch_labels = None
depends_on = None


def upgrade():
    # Create enum types
    vote_type_enum = postgresql.ENUM('skip_turn', 'ai_control', name='votetype')
    vote_type_enum.create(op.get_bind())
    
    vote_status_enum = postgresql.ENUM('active', 'passed', 'failed', 'expired', name='votestatus')
    vote_status_enum.create(op.get_bind())
    
    # Create absentee_votes table
    op.create_table(
        'absentee_votes',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('session_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('game_sessions.id'), nullable=False),
        sa.Column('campaign_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('campaigns.id'), nullable=False),
        sa.Column('absent_character_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('characters.id'), nullable=False),
        sa.Column('vote_type', vote_type_enum, nullable=False),
        sa.Column('status', vote_status_enum, nullable=False, server_default='active'),
        sa.Column('votes_for', postgresql.JSON, nullable=True),
        sa.Column('votes_against', postgresql.JSON, nullable=True),
        sa.Column('eligible_voters', postgresql.JSON, nullable=True),
        sa.Column('required_votes', sa.Integer, nullable=False),
        sa.Column('vote_threshold', sa.Integer, nullable=False, server_default='50'),
        sa.Column('initiated_at', sa.DateTime, nullable=False, server_default=sa.func.now()),
        sa.Column('expires_at', sa.DateTime, nullable=False),
        sa.Column('resolved_at', sa.DateTime, nullable=True),
        sa.Column('ai_agent_active', sa.Boolean, nullable=False, server_default='false'),
        sa.Column('ai_agent_config', postgresql.JSON, nullable=True),
        sa.Column('initiated_by', postgresql.UUID(as_uuid=True), sa.ForeignKey('characters.id'), nullable=False),
        sa.Column('reason', sa.String, nullable=True)
    )
    
    # Create indexes
    op.create_index('idx_absentee_votes_session', 'absentee_votes', ['session_id'])
    op.create_index('idx_absentee_votes_campaign', 'absentee_votes', ['campaign_id'])
    op.create_index('idx_absentee_votes_character', 'absentee_votes', ['absent_character_id'])
    op.create_index('idx_absentee_votes_status', 'absentee_votes', ['status'])


def downgrade():
    # Drop indexes
    op.drop_index('idx_absentee_votes_status')
    op.drop_index('idx_absentee_votes_character')
    op.drop_index('idx_absentee_votes_campaign')
    op.drop_index('idx_absentee_votes_session')
    
    # Drop table
    op.drop_table('absentee_votes')
    
    # Drop enum types
    vote_status_enum = postgresql.ENUM(name='votestatus')
    vote_status_enum.drop(op.get_bind())
    
    vote_type_enum = postgresql.ENUM(name='votetype')
    vote_type_enum.drop(op.get_bind())
