
from datetime import datetime

from sqlalchemy import (
    DateTime,
    ForeignKey,
    Integer,
    Float,
    String,
    func
)
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import Base


class TestRun(Base):
    __tablename__ = "test_runs"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True
    )

    prompt_id: Mapped[int] = mapped_column(
        ForeignKey("prompts.id", ondelete="CASCADE"),
        nullable=False
    )

    prompt_version_id: Mapped[int] = mapped_column(
        ForeignKey("prompt_versions.id", ondelete="CASCADE"),
        nullable=False
    )

    dataset_id: Mapped[int] = mapped_column(
        ForeignKey("datasets.id", ondelete="CASCADE"),
        nullable=False
    )

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False
    )

    status: Mapped[str] = mapped_column(
        String(20),
        default="pending",
        nullable=False
    )

    total_cases: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False
    )

    completed_cases: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False
    )

    average_score: Mapped[float] = mapped_column(
        Float,
        default=0.0,
        nullable=False
    )

    total_tokens: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False
    )

    total_latency_ms: Mapped[float] = mapped_column(
        Float,
        default=0.0,
        nullable=False
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )
