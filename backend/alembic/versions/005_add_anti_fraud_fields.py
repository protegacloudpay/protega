"""add anti_fraud fields and flagged enrollments

Revision ID: 005
Revises: 004
Create Date: 2025-01-21 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '005'
down_revision: str | None = '004'
branch_labels: str | None = None
depends_on: str | None = None


def upgrade() -> None:
    # Create protega_identities table
    op.create_table(
        'protega_identities',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_protega_identities_id'), 'protega_identities', ['id'], unique=False)
    
    # Add anti-fraud fields to users table
    op.add_column('users', sa.Column('protega_identity_id', sa.Integer(), nullable=True))
    op.add_column('users', sa.Column('phone_verified', sa.Boolean(), nullable=False, server_default='false'))
    op.add_column('users', sa.Column('card_fingerprint', sa.String(length=64), nullable=True))
    
    # Create foreign key for protega_identity_id
    op.create_foreign_key(None, 'users', 'protega_identities', ['protega_identity_id'], ['id'])
    op.create_index(op.f('ix_users_protega_identity_id'), 'users', ['protega_identity_id'], unique=False)
    op.create_index(op.f('ix_users_card_fingerprint'), 'users', ['card_fingerprint'], unique=False)
    
    # Add anti-fraud fields to biometric_templates table
    op.add_column('biometric_templates', sa.Column('device_id', sa.String(length=255), nullable=True))
    op.add_column('biometric_templates', sa.Column('enroll_ip', sa.String(length=45), nullable=True))
    op.add_column('biometric_templates', sa.Column('finger_label', sa.String(length=50), nullable=True))
    op.add_column('biometric_templates', sa.Column('liveness_score', sa.Integer(), nullable=True))
    
    # Create indexes for anti-fraud queries
    op.create_index(op.f('ix_biometric_templates_device_id'), 'biometric_templates', ['device_id'], unique=False)
    op.create_index('idx_device_enrolls', 'biometric_templates', ['device_id', 'created_at'], unique=False)
    
    # Create flagged_enrolls table
    op.create_table(
        'flagged_enrolls',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=True),
        sa.Column('phone', sa.String(length=20), nullable=True),
        sa.Column('card_fingerprint', sa.String(length=64), nullable=True),
        sa.Column('fingerprint_hash', sa.String(length=128), nullable=True),
        sa.Column('device_id', sa.String(length=255), nullable=True),
        sa.Column('enroll_ip', sa.String(length=45), nullable=True),
        sa.Column('risk_score', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('reason', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('resolved', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('resolved_by', sa.String(length=255), nullable=True),
        sa.Column('resolved_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_flagged_enrolls_id'), 'flagged_enrolls', ['id'], unique=False)
    op.create_index(op.f('ix_flagged_enrolls_email'), 'flagged_enrolls', ['email'], unique=False)
    op.create_index(op.f('ix_flagged_enrolls_phone'), 'flagged_enrolls', ['phone'], unique=False)
    op.create_index(op.f('ix_flagged_enrolls_card_fingerprint'), 'flagged_enrolls', ['card_fingerprint'], unique=False)
    op.create_index(op.f('ix_flagged_enrolls_risk_score'), 'flagged_enrolls', ['risk_score'], unique=False)
    op.create_index(op.f('ix_flagged_enrolls_resolved'), 'flagged_enrolls', ['resolved'], unique=False)
    op.create_index('idx_unresolved_flags', 'flagged_enrolls', ['resolved', 'created_at'], unique=False)
    op.create_index('idx_risk_score', 'flagged_enrolls', ['risk_score', 'created_at'], unique=False)


def downgrade() -> None:
    # Drop indexes
    op.drop_index('idx_risk_score', table_name='flagged_enrolls')
    op.drop_index('idx_unresolved_flags', table_name='flagged_enrolls')
    op.drop_index(op.f('ix_flagged_enrolls_resolved'), table_name='flagged_enrolls')
    op.drop_index(op.f('ix_flagged_enrolls_risk_score'), table_name='flagged_enrolls')
    op.drop_index(op.f('ix_flagged_enrolls_card_fingerprint'), table_name='flagged_enrolls')
    op.drop_index(op.f('ix_flagged_enrolls_phone'), table_name='flagged_enrolls')
    op.drop_index(op.f('ix_flagged_enrolls_email'), table_name='flagged_enrolls')
    op.drop_index(op.f('ix_flagged_enrolls_id'), table_name='flagged_enrolls')
    
    # Drop flagged_enrolls table
    op.drop_table('flagged_enrolls')
    
    # Drop indexes from biometric_templates
    op.drop_index('idx_device_enrolls', table_name='biometric_templates')
    op.drop_index(op.f('ix_biometric_templates_device_id'), table_name='biometric_templates')
    
    # Drop columns from biometric_templates
    op.drop_column('biometric_templates', 'liveness_score')
    op.drop_column('biometric_templates', 'finger_label')
    op.drop_column('biometric_templates', 'enroll_ip')
    op.drop_column('biometric_templates', 'device_id')
    
    # Drop indexes and foreign key from users
    op.drop_index(op.f('ix_users_card_fingerprint'), table_name='users')
    op.drop_index(op.f('ix_users_protega_identity_id'), table_name='users')
    op.drop_foreign_key(None, 'users', 'protega_identities')
    
    # Drop columns from users
    op.drop_column('users', 'card_fingerprint')
    op.drop_column('users', 'phone_verified')
    op.drop_column('users', 'protega_identity_id')
    
    # Drop protega_identities table
    op.drop_index(op.f('ix_protega_identities_id'), table_name='protega_identities')
    op.drop_table('protega_identities')

