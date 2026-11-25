
from pydantic import BaseModel, Field


class AITestRequest(BaseModel):
    prompt: str = Field(
        min_length=1,
        max_length=10000
    )


class AITestResponse(BaseModel):
    response: str
    input_tokens: int
    output_tokens: int
    total_tokens: int
    latency_ms: float

