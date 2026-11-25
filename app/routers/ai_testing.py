
import logging

from fastapi import APIRouter, Depends, HTTPException

from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.ai_testing import AITestRequest, AITestResponse
from app.services.gemini_service import generate_response


logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/ai",
    tags=["AI Testing"]
)


@router.post(
    "/test",
    response_model=AITestResponse
)
def test_ai(
    test_data: AITestRequest,
    current_user: User = Depends(get_current_user)
):
    try:
        return generate_response(test_data.prompt)

    except RuntimeError as error:
        logger.exception("AI testing configuration error")
        raise HTTPException(
            status_code=503,
            detail=str(error)
        )

    except Exception:
        logger.exception("Gemini API request failed")
        raise HTTPException(
            status_code=502,
            detail="Gemini request failed. Check the backend terminal for the actual error."
        )
