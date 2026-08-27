from fastapi import APIRouter

router = APIRouter()

@router.get("/health")
@router.get("/ready")
async def health_check():
    return {"status": "ok"}
