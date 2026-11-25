
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


# CREATE DATASET
class DatasetCreate(BaseModel):
    project_id: int = Field(gt=0)

    name: str = Field(
        min_length=2,
        max_length=150
    )

    description: str | None = Field(
        default=None,
        max_length=2000
    )


# UPDATE DATASET
class DatasetUpdate(BaseModel):
    name: str | None = Field(
        default=None,
        min_length=2,
        max_length=150
    )

    description: str | None = Field(
        default=None,
        max_length=2000
    )


# DATASET RESPONSE
class DatasetResponse(BaseModel):
    id: int
    project_id: int
    name: str
    description: str | None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

