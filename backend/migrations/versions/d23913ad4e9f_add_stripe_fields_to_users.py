"""add_stripe_fields_to_users

Revision ID: d23913ad4e9f
Revises: 29bf064c68b7
Create Date: 2025-11-24 12:00:01.504195

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd23913ad4e9f'
down_revision: Union[str, Sequence[str], None] = '29bf064c68b7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add stripe_subscription_id field
    op.add_column('users', sa.Column('stripe_subscription_id', sa.String(100), nullable=True))
    
    # Add current_period_end field
    op.add_column('users', sa.Column('current_period_end', sa.DateTime(timezone=True), nullable=True))
    
    # Update subscription_tier enum to include new tiers
    # SQLAlchemy/PostgreSQL enum migration
    op.execute("ALTER TYPE subscriptiontier ADD VALUE IF NOT EXISTS 'basic'")
    op.execute("ALTER TYPE subscriptiontier ADD VALUE IF NOT EXISTS 'premium'")
    op.execute("ALTER TYPE subscriptiontier ADD VALUE IF NOT EXISTS 'ultimate'")
    
    # Migrate old tier names to new ones
    op.execute("UPDATE users SET subscription_tier = 'basic' WHERE subscription_tier = 'creator'")
    op.execute("UPDATE users SET subscription_tier = 'premium' WHERE subscription_tier = 'master'")


def downgrade() -> None:
    """Downgrade schema."""
    # Revert tier migrations
    op.execute("UPDATE users SET subscription_tier = 'creator' WHERE subscription_tier = 'basic'")
    op.execute("UPDATE users SET subscription_tier = 'master' WHERE subscription_tier = 'premium'")
    op.execute("UPDATE users SET subscription_tier = 'free' WHERE subscription_tier = 'ultimate'")
    
    # Remove columns
    op.drop_column('users', 'current_period_end')
    op.drop_column('users', 'stripe_subscription_id')
    
    # Note: Cannot remove enum values in PostgreSQL, they remain in the type
