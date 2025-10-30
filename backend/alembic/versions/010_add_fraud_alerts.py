"""add_fraud_alerts

Revision ID: 010
Revises: 009
Create Date: 2025-01-30 05:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '010'
down_revision = '009'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create fraud_alerts table for background fraud detection
    op.create_table(
        'fraud_alerts',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('template_id', sa.Integer(), nullable=True),
        sa.Column('match_user_id', sa.Integer(), nullable=True),
        sa.Column('match_template_id', sa.Integer(), nullable=True),
        sa.Column('match_score', sa.Float(), nullable=False),
        sa.Column('status', sa.String(length=50), nullable=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('reviewed_by', sa.String(length=255), nullable=True),
        sa.Column('reviewed_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['template_id'], ['biometric_templates.id'], ),
        sa.ForeignKeyConstraint(['match_user_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['match_template_id'], ['biometric_templates.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes
    op.create_index('idx_pending_alerts', 'fraud_alerts', ['status', 'created_at'])
    op.create_index('idx_user_alerts', 'fraud_alerts', ['user_id', 'created_at'])
    op.create_index(op.f('ix_fraud_alerts_created_at'), 'fraud_alerts', ['created_at'], unique=False)
    op.create_index(op.f('ix_fraud_alerts_status'), 'fraud_alerts', ['status'], unique=False)
    op.create_index(op.f('ix_fraud_alerts_user_id'), 'fraud_alerts', ['user_id'], unique=False)
    pass


def downgrade() -> None:
    # Drop indexes
    op.drop_index(op.f('ix_fraud_alerts_user_id'), table_name='fraud_alerts')
    op.drop_index(op.f('ix_fraud_alerts_status'), table_name='fraud_alerts')
    op.drop_index(op.f('ix_fraud_alerts_created_at'), table_name='fraud_alerts')
    op.drop_index('idx_user_alerts', 'fraud_alerts')
    op.drop_index('idx_pending_alerts', 'fraud_alerts')
    
    # Drop table
    op.drop_table('fraud_alerts')
    pass

