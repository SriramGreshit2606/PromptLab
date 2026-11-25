
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import Base


class PromptVersion(Base):
    __tablename__ = "prompt_versions"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True
    )

    prompt_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("prompts.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    version_number: Mapped[int] = mapped_column(
        Integer,
        nullable=False
    )

    content: Mapped[str] = mapped_column(
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
            f"<PromptVersion("
            f"id={self.id}, "
            f"prompt_id={self.prompt_id}, "
            f"version={self.version_number})>"
        )
