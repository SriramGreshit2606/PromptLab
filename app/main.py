
from fastapi import FastAPI, HTTPException
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from app.core.config import settings
from app.database.connection import engine
from app.routers import (
    auth,
    projects,
    prompts,
    prompt_versions,
    datasets,
    dataset_cases,
    ai_testing,
    test_runs,
    comparisons,
    dashboard
)


app = FastAPI(
    title=settings.APP_NAME,
    description="Prompt Engineering and Testing Toolkit",
    version="1.0.0"
)


# REGISTER API ROUTERS

app.include_router(auth.router, prefix="/api/v1")
app.include_router(projects.router, prefix="/api/v1")
app.include_router(prompts.router, prefix="/api/v1")
app.include_router(prompt_versions.router, prefix="/api/v1")
app.include_router(datasets.router, prefix="/api/v1")
app.include_router(dataset_cases.router, prefix="/api/v1")
app.include_router(ai_testing.router, prefix="/api/v1")
app.include_router(test_runs.router, prefix="/api/v1")
app.include_router(comparisons.router, prefix="/api/v1")
app.include_router(dashboard.router, prefix="/api/v1")


# HOME
@app.get("/")
def home():
    return {
        "message": "Welcome to PromptLab",
        "application": settings.APP_NAME,
        "status": "running"
    }


# API HEALTH CHECK
@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "PromptLab API"
    }


# DATABASE HEALTH CHECK
@app.get("/health/database")
def database_health():
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))

        return {
            "status": "connected",
            "database": "PostgreSQL"
        }

    except SQLAlchemyError:
        raise HTTPException(
            status_code=503,
            detail="Database connection failed"
        )
