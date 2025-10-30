"""add_unique_constraints_fingerprint_phone_card

Revision ID: 006
Revises: 005
Create Date: 2025-01-30 01:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '006'
down_revision = '005'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add unique constraint to phone field in users table
    op.create_unique_constraint('users_phone_key', 'users', ['phone'], schema=None, if_exists=False)
    
    # Add unique constraint to card_fingerprint field in users table
    op.create_unique_constraint('users_card_fingerprint_key', 'users', ['card_fingerprint'], schema=None, if_exists=False)
    
    # Note: template_hash already has unique constraint from previous migrations
    # The BiometricTemplate model stores multiple templates per user (different fingers)
    # so we DON'T want a unique constraint on template_hash across all users
    
    pass


def downgrade() -> None:
    # Remove unique constraints
    op.drop_constraint('users_card_fingerprint_key', 'users', type_='unique')
    op.drop_constraint('users_phone_key', 'users', type_='unique')
    
    pass
