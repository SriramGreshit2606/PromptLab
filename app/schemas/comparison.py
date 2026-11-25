
from pydantic import BaseModel


class ComparisonResult(BaseModel):
    first_run_id: int
    second_run_id: int

    first_prompt_version_id: int
    second_prompt_version_id: int

    first_average_score: float
    second_average_score: float

    first_total_tokens: int
    second_total_tokens: int

    first_total_latency_ms: float
    second_total_latency_ms: float

    score_difference: float
    token_difference: int
    latency_difference_ms: float

    better_performing_version: int
