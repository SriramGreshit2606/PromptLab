
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


# CREATE A NEW PROMPT VERSION
class PromptVersionCreate(BaseModel):
    content: str = Field(
        min_length=1,
        max_length=10000
    )


# PROMPT VERSION RESPONSE
class PromptVersionResponse(BaseModel):
    id: int
    prompt_id: int
    version_number: int
    content: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

