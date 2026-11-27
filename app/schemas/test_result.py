
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class TestResultResponse(BaseModel):
    id: int
    test_run_id: int
    dataset_case_id: int

    input_text: str
    ai_response: str
    expected_output: str

    # Final weighted AI Judge score
    score: float

    # Individual AI Judge criteria
    correctness: float
    relevance: float
    completeness: float
    clarity: float
    instruction_following: float

    # AI Judge explanation
    evaluation_reason: str

    # Token usage
    input_tokens: int
    output_tokens: int
    total_tokens: int

    latency_ms: float
    created_at: datetime

    model_config = ConfigDict(
        from_attributes=True
    )
