
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.database.connection import get_db
from app.models.dataset import Dataset
from app.models.dataset_case import DatasetCase
from app.models.project import Project
from app.models.user import User
from app.schemas.dataset_case import (
    DatasetCaseCreate,
    DatasetCaseResponse,
    DatasetCaseUpdate
)


router = APIRouter(
    prefix="/datasets",
    tags=["Dataset Cases"]
)


# CHECK WHETHER DATASET BELONGS TO LOGGED-IN USER
def get_user_dataset(
    dataset_id: int,
    current_user: User,
    db: Session
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


# ADD A TEST CASE TO A DATASET
@router.post(
    "/{dataset_id}/cases/",
    response_model=DatasetCaseResponse,
    status_code=status.HTTP_201_CREATED
)
def create_dataset_case(
    dataset_id: int,
    case_data: DatasetCaseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    dataset = get_user_dataset(dataset_id, current_user, db)

    new_case = DatasetCase(
        dataset_id=dataset.id,
        input_text=case_data.input_text.strip(),
        expected_output=case_data.expected_output.strip()
    )

    db.add(new_case)
    db.commit()
    db.refresh(new_case)

    return new_case


# GET ALL TEST CASES IN A DATASET
@router.get(
    "/{dataset_id}/cases/",
    response_model=list[DatasetCaseResponse]
)
def get_dataset_cases(
    dataset_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    dataset = get_user_dataset(dataset_id, current_user, db)

    cases = db.scalars(
        select(DatasetCase)
        .where(DatasetCase.dataset_id == dataset.id)
        .order_by(DatasetCase.id.asc())
    ).all()

    return cases


# GET ONE TEST CASE
@router.get(
    "/{dataset_id}/cases/{case_id}",
    response_model=DatasetCaseResponse
)
def get_dataset_case(
    dataset_id: int,
    case_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    dataset = get_user_dataset(dataset_id, current_user, db)

    case = db.scalar(
        select(DatasetCase).where(
            DatasetCase.id == case_id,
            DatasetCase.dataset_id == dataset.id
        )
    )

    if case is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dataset case not found"
        )

    return case


# UPDATE A TEST CASE
@router.put(
    "/{dataset_id}/cases/{case_id}",
    response_model=DatasetCaseResponse
)
def update_dataset_case(
    dataset_id: int,
    case_id: int,
    case_data: DatasetCaseUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    dataset = get_user_dataset(dataset_id, current_user, db)

    case = db.scalar(
        select(DatasetCase).where(
            DatasetCase.id == case_id,
            DatasetCase.dataset_id == dataset.id
        )
    )

    if case is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dataset case not found"
        )

    update_data = case_data.model_dump(exclude_unset=True)

    if "input_text" in update_data and update_data["input_text"] is not None:
        case.input_text = update_data["input_text"].strip()

    if "expected_output" in update_data and update_data["expected_output"] is not None:
        case.expected_output = update_data["expected_output"].strip()

    db.commit()
    db.refresh(case)

    return case


# DELETE A TEST CASE
@router.delete("/{dataset_id}/cases/{case_id}")
def delete_dataset_case(
    dataset_id: int,
    case_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    dataset = get_user_dataset(dataset_id, current_user, db)

    case = db.scalar(
        select(DatasetCase).where(
            DatasetCase.id == case_id,
            DatasetCase.dataset_id == dataset.id
        )
    )

    if case is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dataset case not found"
        )

    db.delete(case)
    db.commit()

    return {
        "message": "Dataset test case deleted successfully",
        "case_id": case_id
    }

