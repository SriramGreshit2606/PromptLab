
import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.database.connection import get_db
from app.models.user import User
from app.models.project import Project
from app.models.prompt import Prompt
from app.models.prompt_version import PromptVersion
from app.models.dataset import Dataset
from app.models.dataset_case import DatasetCase
from app.models.test_run import TestRun
from app.models.test_result import TestResult
from app.schemas.test_run import TestRunCreate, TestRunResponse
from app.schemas.test_result import TestResultResponse
from app.services.gemini_service import generate_response
from app.services.evaluation_service import evaluate_response


logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/test-runs",
    tags=["Test Runs"]
)


# CREATE TEST RUN
@router.post(
    "/",
    response_model=TestRunResponse,
    status_code=201
)
def create_test_run(
    test_data: TestRunCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    prompt_version = db.scalar(
        select(PromptVersion).where(
            PromptVersion.id == test_data.prompt_version_id
        )
    )

    if prompt_version is None:
        raise HTTPException(
            status_code=404,
            detail="Prompt version not found"
        )

    prompt = db.scalar(
        select(Prompt).where(
            Prompt.id == prompt_version.prompt_id
        )
    )

    if prompt is None:
        raise HTTPException(
            status_code=404,
            detail="Prompt not found"
        )

    project = db.scalar(
        select(Project).where(
            Project.id == prompt.project_id,
            Project.owner_id == current_user.id
        )
    )

    if project is None:
        raise HTTPException(
            status_code=403,
            detail="You do not own this project"
        )

    dataset = db.scalar(
        select(Dataset).where(
            Dataset.id == test_data.dataset_id,
            Dataset.project_id == project.id
        )
    )

    if dataset is None:
        raise HTTPException(
            status_code=404,
            detail="Dataset not found in this project"
        )

    cases = list(
        db.scalars(
            select(DatasetCase).where(
                DatasetCase.dataset_id == dataset.id
            )
        ).all()
    )

    if not cases:
        raise HTTPException(
            status_code=400,
            detail="Dataset has no test cases"
        )

    test_run = TestRun(
        prompt_id=prompt.id,
        prompt_version_id=prompt_version.id,
        dataset_id=dataset.id,
        user_id=current_user.id,
        status="running",
        total_cases=len(cases),
        completed_cases=0,
        average_score=0.0,
        total_tokens=0,
        total_latency_ms=0.0
    )

    db.add(test_run)
    db.commit()
    db.refresh(test_run)

    run_id = test_run.id
    scores = []

    try:
        for case in cases:

            full_prompt = (
                f"{prompt_version.content}\n\n"
                f"User input:\n{case.input_text}"
            )

            # Generate AI response
            ai_result = generate_response(full_prompt)

            # Evaluate response using AI Judge
            evaluation = evaluate_response(
                question=case.input_text,
                expected_answer=case.expected_output,
                actual_answer=ai_result["response"]
            )

            score = evaluation["score"]
            criteria = evaluation["criteria"]

            # Save detailed AI Judge results
            result = TestResult(
                test_run_id=run_id,
                dataset_case_id=case.id,
                input_text=case.input_text,
                ai_response=ai_result["response"],
                expected_output=case.expected_output,

                # Final weighted score
                score=score,

                # Individual evaluation scores
                correctness=criteria["correctness"],
                relevance=criteria["relevance"],
                completeness=criteria["completeness"],
                clarity=criteria["clarity"],
                instruction_following=criteria[
                    "instruction_following"
                ],

                # AI Judge explanation
                evaluation_reason=evaluation["reason"],

                # Token usage and latency
                input_tokens=ai_result["input_tokens"],
                output_tokens=ai_result["output_tokens"],
                total_tokens=ai_result["total_tokens"],
                latency_ms=ai_result["latency_ms"]
            )

            db.add(result)

            scores.append(score)

            test_run.completed_cases += 1
            test_run.total_tokens += ai_result["total_tokens"]
            test_run.total_latency_ms += ai_result["latency_ms"]

            test_run.average_score = round(
                sum(scores) / len(scores), 2
            )

            db.commit()

        test_run.status = "completed"
        db.commit()
        db.refresh(test_run)

        return test_run

    except Exception:
        logger.exception("Test run execution failed")

        db.rollback()

        failed_run = db.get(TestRun, run_id)

        if failed_run is not None:
            failed_run.status = "failed"
            db.commit()

        raise HTTPException(
            status_code=502,
            detail="Test execution failed. Check the backend terminal."
        )


# GET ALL TEST RUNS
@router.get(
    "/",
    response_model=list[TestRunResponse]
)
def get_test_runs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return list(
        db.scalars(
            select(TestRun)
            .where(TestRun.user_id == current_user.id)
            .order_by(TestRun.created_at.desc())
        ).all()
    )


# GET SINGLE TEST RUN
@router.get(
    "/{test_run_id}",
    response_model=TestRunResponse
)
def get_test_run(
    test_run_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    test_run = db.scalar(
        select(TestRun).where(
            TestRun.id == test_run_id,
            TestRun.user_id == current_user.id
        )
    )

    if test_run is None:
        raise HTTPException(
            status_code=404,
            detail="Test run not found"
        )

    return test_run


# GET INDIVIDUAL TEST RESULTS
@router.get(
    "/{test_run_id}/results",
    response_model=list[TestResultResponse]
)
def get_test_results(
    test_run_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    test_run = db.scalar(
        select(TestRun).where(
            TestRun.id == test_run_id,
            TestRun.user_id == current_user.id
        )
    )

    if test_run is None:
        raise HTTPException(
            status_code=404,
            detail="Test run not found"
        )

    results = db.scalars(
        select(TestResult)
        .where(TestResult.test_run_id == test_run_id)
        .order_by(TestResult.id.asc())
    ).all()

    return list(results)
