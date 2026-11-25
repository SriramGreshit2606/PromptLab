
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.database.connection import get_db
from app.models.prompt import Prompt
from app.models.project import Project
from app.models.user import User
from app.schemas.prompt import PromptCreate, PromptResponse, PromptUpdate


router = APIRouter(
    prefix="/prompts",
    tags=["Prompts"]
)


# CREATE A NEW PROMPT
@router.post(
    "/",
    response_model=PromptResponse,
    status_code=status.HTTP_201_CREATED
)
def create_prompt(
    prompt_data: PromptCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    project = db.scalar(
        select(Project).where(
            Project.id == prompt_data.project_id,
            Project.owner_id == current_user.id
        )
    )

    if project is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )

    new_prompt = Prompt(
        project_id=prompt_data.project_id,
        name=prompt_data.name.strip(),
        description=prompt_data.description
    )

    db.add(new_prompt)
    db.commit()
    db.refresh(new_prompt)

    return new_prompt


# GET ALL PROMPTS OF THE LOGGED-IN USER
@router.get(
    "/",
    response_model=list[PromptResponse]
)
def get_prompts(
    project_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = (
        select(Prompt)
        .join(Project, Prompt.project_id == Project.id)
        .where(Project.owner_id == current_user.id)
    )

    if project_id is not None:
        query = query.where(Prompt.project_id == project_id)

    prompts = db.scalars(
        query.order_by(Prompt.created_at.desc())
    ).all()

    return prompts


# GET A SINGLE PROMPT BY ID
@router.get(
    "/{prompt_id}",
    response_model=PromptResponse
)
def get_prompt(
    prompt_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    prompt = db.scalar(
        select(Prompt)
        .join(Project, Prompt.project_id == Project.id)
        .where(
            Prompt.id == prompt_id,
            Project.owner_id == current_user.id
        )
    )

    if prompt is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prompt not found"
        )

    return prompt


# UPDATE AN EXISTING PROMPT
@router.put(
    "/{prompt_id}",
    response_model=PromptResponse
)
def update_prompt(
    prompt_id: int,
    prompt_data: PromptUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    prompt = db.scalar(
        select(Prompt)
        .join(Project, Prompt.project_id == Project.id)
        .where(
            Prompt.id == prompt_id,
            Project.owner_id == current_user.id
        )
    )

    if prompt is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prompt not found"
        )

    update_data = prompt_data.model_dump(exclude_unset=True)

    if "name" in update_data and update_data["name"] is not None:
        prompt.name = update_data["name"].strip()

    if "description" in update_data:
        prompt.description = update_data["description"]

    db.commit()
    db.refresh(prompt)

    return prompt
