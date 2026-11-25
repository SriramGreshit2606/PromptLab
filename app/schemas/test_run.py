
from pydantic import BaseModel, Field


class TestRunCreate(BaseModel):
    prompt_version_id: int = Field(gt=0)
    dataset_id: int = Field(gt=0)


class TestRunResponse(BaseModel):
    id: int
    prompt_id: int
    prompt_version_id: int
    dataset_id: int
    status: str
    total_cases: int
    completed_cases: int
    average_score: float
    total_tokens: int
    total_latency_ms: float

    model_config = {
        "from_attributes": True
    }
