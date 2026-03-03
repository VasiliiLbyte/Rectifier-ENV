from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from agents.design_agent import generate_tz, validate_tz
import logging

router = APIRouter(prefix="/api/agents", tags=["agents"])
logger = logging.getLogger(__name__)

class DesignRequest(BaseModel):
    prompt: str

class DesignResponse(BaseModel):
    tz_content: str

@router.post("/design", response_model=DesignResponse)
async def create_tz(request: DesignRequest):
    try:
        tz_text = generate_tz(request.prompt)
        return DesignResponse(tz_content=tz_text)
    except Exception as e:
        logger.exception("Ошибка в /design")
        raise HTTPException(status_code=500, detail=str(e))

class ValidateRequest(BaseModel):
    tz_content: str

class ValidateResponse(BaseModel):
    analysis: str

@router.post("/validate", response_model=ValidateResponse)
async def validate_tz_endpoint(request: ValidateRequest):
    try:
        analysis = validate_tz(request.tz_content)
        return ValidateResponse(analysis=analysis)
    except Exception as e:
        logger.exception("Ошибка в /validate")
        raise HTTPException(status_code=500, detail=str(e))
