
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.database.connection import get_db
from app.models.dataset import Dataset
from app.models.project import Project
from app.models.user import User
from app.schemas.dataset import (
    DatasetCreate,
    DatasetResponse,
    DatasetUpdate
)


router = APIRouter(
    prefix="/datasets",
    tags=["Datasets"]
)


# CHECK WHETHER PROJECT BELONGS TO LOGGED-IN USER
def get_user_project(
    project_id: int,
    current_user: User,
    db: Session
):
    project = db.scalar(
        select(Project).where(
            Project.id == project_id,
            Project.owner_id == current_user.id
        )
    )

    if project is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )

    return project


# CREATE DATASET
@router.post(
    "/",
    response_model=DatasetResponse,
    status_code=status.HTTP_201_CREATED
)
def create_dataset(
    dataset_data: DatasetCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    get_user_project(
        dataset_data.project_id,
        current_user,
        db
    )

    new_dataset = Dataset(
        project_id=dataset_data.project_id,
        name=dataset_data.name.strip(),
        description=dataset_data.description
    )

    db.add(new_dataset)
    db.commit()
    db.refresh(new_dataset)

    return new_dataset


# GET ALL DATASETS OF LOGGED-IN USER
@router.get(
    "/",
    response_model=list[DatasetResponse]
)
def get_datasets(
    project_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = (
        select(Dataset)
        .join(Project, Dataset.project_id == Project.id)
        .where(Project.owner_id == current_user.id)
    )

    if project_id is not None:
        query = query.where(Dataset.project_id == project_id)

    datasets = db.scalars(
        query.order_by(Dataset.created_at.desc())
    ).all()

    return datasets


# GET ONE DATASET
@router.get(
    "/{dataset_id}",
    response_model=DatasetResponse
)
def get_dataset(
    dataset_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    dataset = db.scalar(
        select(Dataset)
        .join(Project, Dataset.project_id == Project.id)
        .where(
            Dataset.id == dataset_id,
            Project.owner_id == current_user.id
        )
    )

    if dataset is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dataset not found"
        )

    return dataset


# UPDATE DATASET
@router.put(
    "/{dataset_id}",
    response_model=DatasetResponse
)
def update_dataset(
    dataset_id: int,
    dataset_data: DatasetUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    dataset = db.scalar(
        select(Dataset)
        .join(Project, Dataset.project_id == Project.id)
        .where(
            Dataset.id == dataset_id,
            Project.owner_id == current_user.id
        )
    )

    if dataset is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dataset not found"
        )

    update_data = dataset_data.model_dump(exclude_unset=True)

    if "name" in update_data and update_data["name"] is not None:
        dataset.name = update_data["name"].strip()

    if "description" in update_data:
        dataset.description = update_data["description"]

    db.commit()
    db.refresh(dataset)

    return dataset


# DELETE DATASET
@router.delete("/{dataset_id}")
def delete_dataset(
    dataset_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    dataset = db.scalar(
        select(Dataset)
        .join(Project, Dataset.project_id == Project.id)
        .where(
            Dataset.id == dataset_id,
            Project.owner_id == current_user.id
        )
    )

    if dataset is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dataset not found"
        )

    db.delete(dataset)
    db.commit()

    return {
        "message": "Dataset deleted successfully",
        "dataset_id": dataset_id
    }

