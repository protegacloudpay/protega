"""add_last_used_at

Revision ID: 008
Revises: 007
Create Date: 2025-01-30 03:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '008'
down_revision = '007'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add last_used_at field to biometric_templates table for multi-finger support
    op.add_column('biometric_templates', sa.Column('last_used_at', sa.DateTime(), nullable=True))
    
    # Add index for faster lookups
    op.create_index('idx_last_used_at', 'biometric_templates', ['last_used_at'])
    pass


def downgrade() -> None:
    # Remove index and column
    op.drop_index('idx_last_used_at', 'biometric_templates')
    op.drop_column('biometric_templates', 'last_used_at')
    pass

