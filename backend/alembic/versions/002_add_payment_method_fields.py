"""add payment method exp and updated_at fields

Revision ID: 002
Revises: 001
Create Date: 2025-10-29

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '002'
down_revision: Union[str, None] = '001'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add exp_month, exp_year, and updated_at to payment_methods table."""
    # Add new columns
    op.add_column('payment_methods', sa.Column('exp_month', sa.Integer(), nullable=True))
    op.add_column('payment_methods', sa.Column('exp_year', sa.Integer(), nullable=True))
    op.add_column('payment_methods', sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')))
    
    # Make provider_payment_method_id unique
    op.create_unique_constraint('uq_payment_methods_provider_payment_method_id', 'payment_methods', ['provider_payment_method_id'])
    
    # Add index on provider_payment_method_id
    op.create_index(op.f('ix_payment_methods_provider_payment_method_id'), 'payment_methods', ['provider_payment_method_id'], unique=True)


def downgrade() -> None:
    """Remove exp_month, exp_year, and updated_at from payment_methods table."""
    # Drop index and constraint
    op.drop_index(op.f('ix_payment_methods_provider_payment_method_id'), table_name='payment_methods')
    op.drop_constraint('uq_payment_methods_provider_payment_method_id', 'payment_methods', type_='unique')
    
    # Drop columns
    op.drop_column('payment_methods', 'updated_at')
    op.drop_column('payment_methods', 'exp_year')
    op.drop_column('payment_methods', 'exp_month')

