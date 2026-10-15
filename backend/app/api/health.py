from fastapi import APIRouter

router = APIRouter(
    prefix="/api",
    tags=["Health"]
)


@router.get("/health")
def health():
    return {
        "status": "UP",
        "service": "coal-visibility-backend"
    }