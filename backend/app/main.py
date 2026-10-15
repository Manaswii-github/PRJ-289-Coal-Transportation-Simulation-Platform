from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.health import router as health_router
from app.api.tracking import router as tracking_router
from app.api.websocket import router as websocket_router
from app.api.prediction import router as prediction_router
from app.api.live_prediction import router as live_prediction_router
from app.api.simulation import router as simulation_router
from app.api.replay import router as replay_router
from app.api.analytics import router as analytics_router

app = FastAPI(
    title="CoalVision Backend",
    description="Backend API for multimodal coal transportation visibility",
    version="1.0.0"
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(
    analytics_router,
    prefix="/api"
)
app.include_router(replay_router, prefix="/api")
app.include_router(health_router)
app.include_router(tracking_router)
app.include_router(websocket_router)
app.include_router(
    live_prediction_router,
    prefix="/api",
)
app.include_router(
    prediction_router,
    prefix="/api",
)
app.include_router(
    simulation_router,
    prefix="/api",
)
@app.get("/")
def root():
    return {
        "message": "CoalVision backend is running"
    }