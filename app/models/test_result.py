
from datetime import datetime

from sqlalchemy import (
    DateTime,
    ForeignKey,
    Integer,
    Float,
    Text,
    func
)
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import Base


class TestResult(Base):
    __tablename__ = "test_results"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True
    )

    test_run_id: Mapped[int] = mapped_column(
        ForeignKey("test_runs.id", ondelete="CASCADE"),
        nullable=False
    )

    dataset_case_id: Mapped[int] = mapped_column(
        ForeignKey("dataset_cases.id", ondelete="CASCADE"),
        nullable=False
    )

    input_text: Mapped[str] = mapped_column(
        Text,
        nullable=False
    )

    ai_response: Mapped[str] = mapped_column(
        Text,
        nullable=False
    )

    expected_output: Mapped[str] = mapped_column(
        Text,
        nullable=False
    )

    score: Mapped[float] = mapped_column(
        Float,
        default=0.0,
        nullable=False
    )

    # Individual AI Judge criteria
    correctness: Mapped[float] = mapped_column(
        Float,
        default=0.0,
        nullable=False
    )

    relevance: Mapped[float] = mapped_column(
        Float,
        default=0.0,
        nullable=False
    )

    completeness: Mapped[float] = mapped_column(
        Float,
        default=0.0,
        nullable=False
    )

    clarity: Mapped[float] = mapped_column(
        Float,
        default=0.0,
        nullable=False
    )

    instruction_following: Mapped[float] = mapped_column(
        Float,
        default=0.0,
        nullable=False
    )

    evaluation_reason: Mapped[str] = mapped_column(
        Text,
        default="",
        nullable=False
    )

    input_tokens: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False
    )

    output_tokens: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False
    )

    total_tokens: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False
    )

    latency_ms: Mapped[float] = mapped_column(
        Float,
        default=0.0,
        nullable=False
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )
