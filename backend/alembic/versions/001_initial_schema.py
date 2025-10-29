"""Initial schema

Revision ID: 001
Revises: 
Create Date: 2025-10-29

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '001'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create users table
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('full_name', sa.String(length=255), nullable=False),
        sa.Column('stripe_customer_id', sa.String(length=255), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)
    op.create_index(op.f('ix_users_id'), 'users', ['id'], unique=False)
    op.create_index(op.f('ix_users_stripe_customer_id'), 'users', ['stripe_customer_id'], unique=True)

    # Create biometric_templates table
    op.create_table(
        'biometric_templates',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('template_hash', sa.String(length=128), nullable=False),
        sa.Column('salt', sa.String(length=64), nullable=False),
        sa.Column('active', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_biometric_templates_active'), 'biometric_templates', ['active'], unique=False)
    op.create_index(op.f('ix_biometric_templates_id'), 'biometric_templates', ['id'], unique=False)
    op.create_index(op.f('ix_biometric_templates_user_id'), 'biometric_templates', ['user_id'], unique=False)
    op.create_index('idx_active_templates', 'biometric_templates', ['user_id', 'active'], unique=False)

    # Create consents table
    op.create_table(
        'consents',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('consent_text', sa.Text(), nullable=False),
        sa.Column('accepted_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_consents_id'), 'consents', ['id'], unique=False)
    op.create_index(op.f('ix_consents_user_id'), 'consents', ['user_id'], unique=False)

    # Create merchants table
    op.create_table(
        'merchants',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('password_hash', sa.String(length=255), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_merchants_email'), 'merchants', ['email'], unique=True)
    op.create_index(op.f('ix_merchants_id'), 'merchants', ['id'], unique=False)

    # Create terminals table
    op.create_table(
        'terminals',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('merchant_id', sa.Integer(), nullable=False),
        sa.Column('label', sa.String(length=255), nullable=False),
        sa.Column('api_key', sa.String(length=64), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['merchant_id'], ['merchants.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_terminals_api_key'), 'terminals', ['api_key'], unique=True)
    op.create_index(op.f('ix_terminals_id'), 'terminals', ['id'], unique=False)
    op.create_index(op.f('ix_terminals_merchant_id'), 'terminals', ['merchant_id'], unique=False)

    # Create payment_methods table
    op.create_table(
        'payment_methods',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('provider', sa.Enum('STRIPE', name='paymentprovider'), nullable=False),
        sa.Column('provider_payment_method_id', sa.String(length=255), nullable=False),
        sa.Column('brand', sa.String(length=50), nullable=True),
        sa.Column('last4', sa.String(length=4), nullable=True),
        sa.Column('is_default', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_payment_methods_id'), 'payment_methods', ['id'], unique=False)
    op.create_index(op.f('ix_payment_methods_user_id'), 'payment_methods', ['user_id'], unique=False)
    op.create_index('idx_default_payment_method', 'payment_methods', ['user_id', 'is_default'], unique=False)

    # Create transactions table
    op.create_table(
        'transactions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('merchant_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=True),
        sa.Column('amount_cents', sa.Integer(), nullable=False),
        sa.Column('currency', sa.String(length=3), nullable=False),
        sa.Column('status', sa.Enum('SUCCEEDED', 'FAILED', name='transactionstatus'), nullable=False),
        sa.Column('processor_txn_id', sa.String(length=255), nullable=True),
        sa.Column('merchant_ref', sa.String(length=255), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['merchant_id'], ['merchants.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_transactions_created_at'), 'transactions', ['created_at'], unique=False)
    op.create_index(op.f('ix_transactions_id'), 'transactions', ['id'], unique=False)
    op.create_index(op.f('ix_transactions_merchant_id'), 'transactions', ['merchant_id'], unique=False)
    op.create_index(op.f('ix_transactions_processor_txn_id'), 'transactions', ['processor_txn_id'], unique=False)
    op.create_index(op.f('ix_transactions_status'), 'transactions', ['status'], unique=False)
    op.create_index(op.f('ix_transactions_user_id'), 'transactions', ['user_id'], unique=False)
    op.create_index('idx_merchant_transactions', 'transactions', ['merchant_id', 'created_at'], unique=False)


def downgrade() -> None:
    op.drop_index('idx_merchant_transactions', table_name='transactions')
    op.drop_index(op.f('ix_transactions_user_id'), table_name='transactions')
    op.drop_index(op.f('ix_transactions_status'), table_name='transactions')
    op.drop_index(op.f('ix_transactions_processor_txn_id'), table_name='transactions')
    op.drop_index(op.f('ix_transactions_merchant_id'), table_name='transactions')
    op.drop_index(op.f('ix_transactions_id'), table_name='transactions')
    op.drop_index(op.f('ix_transactions_created_at'), table_name='transactions')
    op.drop_table('transactions')
    
    op.drop_index('idx_default_payment_method', table_name='payment_methods')
    op.drop_index(op.f('ix_payment_methods_user_id'), table_name='payment_methods')
    op.drop_index(op.f('ix_payment_methods_id'), table_name='payment_methods')
    op.drop_table('payment_methods')
    
    op.drop_index(op.f('ix_terminals_merchant_id'), table_name='terminals')
    op.drop_index(op.f('ix_terminals_id'), table_name='terminals')
    op.drop_index(op.f('ix_terminals_api_key'), table_name='terminals')
    op.drop_table('terminals')
    
    op.drop_index(op.f('ix_merchants_id'), table_name='merchants')
    op.drop_index(op.f('ix_merchants_email'), table_name='merchants')
    op.drop_table('merchants')
    
    op.drop_index(op.f('ix_consents_user_id'), table_name='consents')
    op.drop_index(op.f('ix_consents_id'), table_name='consents')
    op.drop_table('consents')
    
    op.drop_index('idx_active_templates', table_name='biometric_templates')
    op.drop_index(op.f('ix_biometric_templates_user_id'), table_name='biometric_templates')
    op.drop_index(op.f('ix_biometric_templates_id'), table_name='biometric_templates')
    op.drop_index(op.f('ix_biometric_templates_active'), table_name='biometric_templates')
    op.drop_table('biometric_templates')
    
    op.drop_index(op.f('ix_users_stripe_customer_id'), table_name='users')
    op.drop_index(op.f('ix_users_id'), table_name='users')
    op.drop_index(op.f('ix_users_email'), table_name='users')
    op.drop_table('users')

