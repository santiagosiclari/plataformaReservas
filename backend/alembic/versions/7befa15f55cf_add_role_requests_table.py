"""add role_requests table

Revision ID: 7befa15f55cf
Revises: 9e1e5bb376b7
Create Date: 2025-10-06 23:35:50.543369
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '7befa15f55cf'
down_revision: Union[str, Sequence[str], None] = '9e1e5bb376b7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()

    # ENUM existente (users.role). No crear el tipo otra vez.
    role_enum = postgresql.ENUM(
        'PLAYER', 'OWNER', 'ADMIN',
        name='roleenum',
        schema='public',
        create_type=False
    )

    # ENUM nuevo para estado. Lo creamos 1 sola vez con checkfirst.
    status_enum = postgresql.ENUM(
        'pending', 'approved', 'rejected',
        name='rolerequeststatus',
        schema='public',
        create_type=False   # <- clave: no intentes crear al usarlo en Column
    )
    status_enum.create(bind=bind, checkfirst=True)

    op.create_table(
        'role_requests',
        sa.Column('id', sa.Integer(), primary_key=True, nullable=False),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id', ondelete="CASCADE"), nullable=False),
        sa.Column('role', role_enum, nullable=False),
        sa.Column('status', status_enum, nullable=False,
                  server_default=sa.text("'pending'::public.rolerequeststatus")),
        sa.Column('created_at', sa.DateTime(timezone=False), nullable=False,
                  server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('resolved_at', sa.DateTime(timezone=False), nullable=True),
    )

    op.create_index('ix_role_requests_user_id', 'role_requests', ['user_id'])
    op.create_index('ix_role_requests_status', 'role_requests', ['status'])


def downgrade() -> None:
    bind = op.get_bind()

    op.drop_index('ix_role_requests_status', table_name='role_requests')
    op.drop_index('ix_role_requests_user_id', table_name='role_requests')
    op.drop_table('role_requests')

    # borrar el enum de estado si no lo usa nadie más
    status_enum = postgresql.ENUM(
        'pending', 'approved', 'rejected',
        name='rolerequeststatus',
        schema='public'
    )
    status_enum.drop(bind=bind, checkfirst=True)
