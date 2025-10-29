"""add protega fee field

Revision ID: 003
Revises: 002
Create Date: 2025-10-29 05:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '003'
down_revision: str | None = '002'
branch_labels: str | None = None
depends_on: str | None = None


def upgrade() -> None:
    # Add protega_fee_cents column to transactions table
    op.add_column('transactions', sa.Column('protega_fee_cents', sa.Integer(), nullable=False, server_default='0'))


def downgrade() -> None:
    # Remove protega_fee_cents column from transactions table
    op.drop_column('transactions', 'protega_fee_cents')

