"""Add legislation and legislation_chunks tables."""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "20251116_legislation"
down_revision = "20251115_flags"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "legislations",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("filename", sa.String(length=255), nullable=False),
        sa.Column("file_path", sa.String(length=500), nullable=False),
        sa.Column("text_length", sa.Integer(), nullable=True),
        sa.Column("num_chunks", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    op.create_table(
        "legislation_chunks",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("legislation_id", sa.Integer(), sa.ForeignKey("legislations.id", ondelete="CASCADE"), nullable=False),
        sa.Column("chunk_index", sa.Integer(), nullable=True),
        sa.Column("text", sa.Text(), nullable=False),
        sa.Column("embedding", sa.LargeBinary(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    op.create_index("idx_legislation_chunks_legislation", "legislation_chunks", ["legislation_id"])


def downgrade() -> None:
    op.drop_index("idx_legislation_chunks_legislation", table_name="legislation_chunks")
    op.drop_table("legislation_chunks")
    op.drop_table("legislations")

