"""add_feature_vector

Revision ID: 009
Revises: 008
Create Date: 2025-01-30 04:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '009'
down_revision = '008'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add feature_vector field to biometric_templates table for similarity scoring
    op.add_column('biometric_templates', sa.Column('feature_vector', sa.String(), nullable=True))
    pass


def downgrade() -> None:
    # Remove feature_vector column
    op.drop_column('biometric_templates', 'feature_vector')
    pass

