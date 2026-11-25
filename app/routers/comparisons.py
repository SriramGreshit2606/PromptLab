
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.database.connection import get_db
from app.models.user import User
from app.models.test_run import TestRun
from app.schemas.comparison import ComparisonResult


router = APIRouter(
    prefix="/comparisons",
    tags=["Prompt Comparisons"]
)


@router.get(
    "/",
    response_model=ComparisonResult
)
def compare_prompt_versions(
    first_run_id: int,
    second_run_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # GET FIRST TEST RUN
    first_run = db.scalar(
        select(TestRun).where(
            TestRun.id == first_run_id,
            TestRun.user_id == current_user.id
        )
    )

    if first_run is None:
        raise HTTPException(
            status_code=404,
            detail="First test run not found"
        )

    # GET SECOND TEST RUN
    second_run = db.scalar(
        select(TestRun).where(
            TestRun.id == second_run_id,
            TestRun.user_id == current_user.id
        )
    )

    if second_run is None:
        raise HTTPException(
            status_code=404,
            detail="Second test run not found"
        )

    # CHECK SAME PROMPT
    if first_run.prompt_id != second_run.prompt_id:
        raise HTTPException(
            status_code=400,
            detail="Both test runs must belong to the same prompt"
        )

    # CHECK COMPLETED STATUS
    if (
        first_run.status != "completed"
        or second_run.status != "completed"
    ):
        raise HTTPException(
            status_code=400,
            detail="Both test runs must be completed"
        )

    # CALCULATE DIFFERENCES
    score_difference = round(
        second_run.average_score - first_run.average_score,
        2
    )

    token_difference = (
        second_run.total_tokens - first_run.total_tokens
    )

    latency_difference = round(
        second_run.total_latency_ms - first_run.total_latency_ms,
        2
    )

    # FIND BETTER VERSION
    if first_run.average_score > second_run.average_score:
        better_version = first_run.prompt_version_id

    elif second_run.average_score > first_run.average_score:
        better_version = second_run.prompt_version_id

    else:
        better_version = 0

    # RETURN COMPARISON
    return ComparisonResult(
        first_run_id=first_run.id,
        second_run_id=second_run.id,

        first_prompt_version_id=first_run.prompt_version_id,
        second_prompt_version_id=second_run.prompt_version_id,

        first_average_score=first_run.average_score,
        second_average_score=second_run.average_score,

        first_total_tokens=first_run.total_tokens,
        second_total_tokens=second_run.total_tokens,

        first_total_latency_ms=first_run.total_latency_ms,
        second_total_latency_ms=second_run.total_latency_ms,

        score_difference=score_difference,
        token_difference=token_difference,
        latency_difference_ms=latency_difference,

        better_performing_version=better_version
    )
