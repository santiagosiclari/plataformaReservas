from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "cf26491bee89"
down_revision = "7befa15f55cf"
branch_labels = None
depends_on = None


def upgrade():
    # 1) columnas nuevas en venues (todas NULLABLE al crear)
    op.add_column("venues", sa.Column("state", sa.String(length=100), nullable=True))
    op.add_column("venues", sa.Column("postal_code", sa.String(length=32), nullable=True))
    op.add_column("venues", sa.Column("country_code", sa.String(length=2), nullable=True))
    op.add_column("venues", sa.Column("google_place_id", sa.String(length=255), nullable=True))
    op.add_column("venues", sa.Column("google_formatted_address", sa.Text(), nullable=True))
    # si querés JSONB para address_components:
    op.add_column("venues", sa.Column("address_components", postgresql.JSONB(astext_type=sa.Text()), nullable=True))
    # op.add_column("venues", sa.Column("address_components", sa.Text(), nullable=True))

    # validated_address: crear con default temporal y nullable para no romper
    op.add_column(
        "venues",
        sa.Column(
            "validated_address",
            sa.Boolean(),
            nullable=True,
            server_default=sa.text("false"),
        ),
    )

    # 2) poblar/normalizar (si querés lógica más fina, hacela acá)
    op.execute("UPDATE venues SET validated_address = false WHERE validated_address IS NULL;")

    # 3) ahora sí, hacer NOT NULL y quitar default
    op.alter_column("venues", "validated_address", nullable=False)
    op.alter_column("venues", "validated_address", server_default=None)

    # 4) índices y constraints
    op.create_index("idx_city_state", "venues", ["city", "state"], unique=False)
    op.create_unique_constraint("uq_venues_google_place_id", "venues", ["google_place_id"])


def downgrade():
    # revertir índices/constraints
    op.drop_constraint("uq_venues_google_place_id", "venues", type_="unique")
    op.drop_index("idx_city_state", table_name="venues")

    # dropear columnas (en orden inverso)
    op.drop_column("venues", "validated_address")
    op.drop_column("venues", "address_components")
    op.drop_column("venues", "google_formatted_address")
    op.drop_column("venues", "google_place_id")
    op.drop_column("venues", "country_code")
    op.drop_column("venues", "postal_code")
    op.drop_column("venues", "state")
