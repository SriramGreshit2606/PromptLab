
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


# CREATE DATASET TEST CASE
class DatasetCaseCreate(BaseModel):
    input_text: str = Field(
        min_length=1,
        max_length=10000
    )

    expected_output: str = Field(
        min_length=1,
        max_length=10000
    )


# UPDATE DATASET TEST CASE
class DatasetCaseUpdate(BaseModel):
    input_text: str | None = Field(
        default=None,
        min_length=1,
        max_length=10000
    )

    expected_output: str | None = Field(
        default=None,
        min_length=1,
        max_length=10000
    )


# DATASET TEST CASE RESPONSE
class DatasetCaseResponse(BaseModel):
    id: int
    dataset_id: int
    input_text: str
    expected_output: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

