
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import Base


class DatasetCase(Base):
    __tablename__ = "dataset_cases"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True
    )

    dataset_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("datasets.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    input_text: Mapped[str] = mapped_column(
        Text,
        nullable=False
    )

    expected_output: Mapped[str] = mapped_column(
        Text,
        nullable=False
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )

    def __repr__(self):
        return (
            f"<DatasetCase("
            f"id={self.id}, "
            f"dataset_id={self.dataset_id})>"
        )

