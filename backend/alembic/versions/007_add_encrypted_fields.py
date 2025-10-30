"""add_encrypted_fields

Revision ID: 007
Revises: 006
Create Date: 2025-01-30 02:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '007'
down_revision = '006'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add encrypted fields to biometric_templates table
    op.add_column('biometric_templates', sa.Column('salt_b64', sa.String(), nullable=True))
    op.add_column('biometric_templates', sa.Column('encrypted_template', sa.String(), nullable=True))
    
    # Note: template_hash and salt already exist from previous migrations
    # We're adding the encrypted storage fields for the Secure Enclave
    pass


def downgrade() -> None:
    # Remove encrypted fields
    op.drop_column('biometric_templates', 'encrypted_template')
    op.drop_column('biometric_templates', 'salt_b64')
    pass

