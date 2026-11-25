
from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.database.connection import get_db
from app.models.user import User
from app.models.project import Project
from app.models.prompt import Prompt
from app.models.test_run import TestRun


router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"]
)


@router.get("/summary")
def get_dashboard_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # TOTAL PROJECTS
    total_projects = db.scalar(
        select(func.count(Project.id)).where(
            Project.owner_id == current_user.id
        )
    ) or 0

    # TOTAL PROMPTS
    total_prompts = db.scalar(
        select(func.count(Prompt.id))
        .join(Project, Prompt.project_id == Project.id)
        .where(Project.owner_id == current_user.id)
    ) or 0

    # TOTAL TEST RUNS
    total_test_runs = db.scalar(
        select(func.count(TestRun.id)).where(
            TestRun.user_id == current_user.id
        )
    ) or 0

    # AVERAGE SCORE
    average_score = db.scalar(
        select(func.avg(TestRun.average_score)).where(
            TestRun.user_id == current_user.id,
            TestRun.status == "completed"
        )
    ) or 0

    return {
        "total_projects": total_projects,
        "total_prompts": total_prompts,
        "total_test_runs": total_test_runs,
        "average_score": round(float(average_score), 2)
    }
