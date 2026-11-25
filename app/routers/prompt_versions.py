
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.database.connection import get_db
from app.models.prompt import Prompt
from app.models.prompt_version import PromptVersion
from app.models.project import Project
from app.models.user import User
from app.schemas.prompt_version import (
    PromptVersionCreate,
    PromptVersionResponse
)


router = APIRouter(
    prefix="/prompts",
    tags=["Prompt Versions"]
)


# CHECK WHETHER THE PROMPT BELONGS TO THE LOGGED-IN USER
def get_user_prompt(
    prompt_id: int,
    current_user: User,
    db: Session
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


# CREATE A NEW PROMPT VERSION
@router.post(
    "/{prompt_id}/versions/",
    response_model=PromptVersionResponse,
    status_code=status.HTTP_201_CREATED
)
def create_prompt_version(
    prompt_id: int,
    version_data: PromptVersionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    prompt = get_user_prompt(prompt_id, current_user, db)

    latest_version = db.scalar(
        select(func.max(PromptVersion.version_number))
        .where(PromptVersion.prompt_id == prompt.id)
    )

    next_version = (latest_version or 0) + 1

    new_version = PromptVersion(
        prompt_id=prompt.id,
        version_number=next_version,
        content=version_data.content.strip()
    )

    db.add(new_version)
    db.commit()
    db.refresh(new_version)

    return new_version


# GET ALL VERSIONS OF A PROMPT
@router.get(
    "/{prompt_id}/versions/",
    response_model=list[PromptVersionResponse]
)
def get_prompt_versions(
    prompt_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    prompt = get_user_prompt(prompt_id, current_user, db)

    versions = db.scalars(
        select(PromptVersion)
        .where(PromptVersion.prompt_id == prompt.id)
        .order_by(PromptVersion.version_number.desc())
    ).all()

    return versions


# GET ONE PARTICULAR VERSION
@router.get(
    "/{prompt_id}/versions/{version_id}",
    response_model=PromptVersionResponse
)
def get_prompt_version(
    prompt_id: int,
    version_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    prompt = get_user_prompt(prompt_id, current_user, db)

    version = db.scalar(
        select(PromptVersion).where(
            PromptVersion.id == version_id,
            PromptVersion.prompt_id == prompt.id
        )
    )

    if version is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prompt version not found"
        )

    return version


# RESTORE AN OLD VERSION AS A NEW VERSION
@router.post(
    "/{prompt_id}/versions/{version_id}/restore",
    response_model=PromptVersionResponse,
    status_code=status.HTTP_201_CREATED
)
def restore_prompt_version(
    prompt_id: int,
    version_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    prompt = get_user_prompt(prompt_id, current_user, db)

    old_version = db.scalar(
        select(PromptVersion).where(
            PromptVersion.id == version_id,
            PromptVersion.prompt_id == prompt.id
        )
    )

    if old_version is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prompt version not found"
        )

    latest_version = db.scalar(
        select(func.max(PromptVersion.version_number))
        .where(PromptVersion.prompt_id == prompt.id)
    )

    next_version = (latest_version or 0) + 1

    restored_version = PromptVersion(
        prompt_id=prompt.id,
        version_number=next_version,
        content=old_version.content
    )

    db.add(restored_version)
    db.commit()
    db.refresh(restored_version)

    return restored_version

