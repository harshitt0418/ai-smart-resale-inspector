"""
service.py — FastAPI ML microservice entry point.

Exposes three AI pipelines as REST endpoints:
  • /detect/item    — YOLOv8 object detection
  • /detect/damage  — YOLOv8 damage detection
  • /predict/cost   — LightGBM repair cost prediction

Each endpoint is stubbed here; implementation is added in Parts 5–8.
"""

import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from routers import item_detection, damage_detection, cost_prediction

# Configure logging to show INFO level messages
logging.basicConfig(
    level=logging.INFO,
    format='%(levelname)s:     %(name)s - %(message)s'
)

app = FastAPI(
    title="AI Smart Resale Inspector — ML Service",
    version="0.1.0",
)

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(item_detection.router,   prefix="/detect",  tags=["Detection"])
app.include_router(damage_detection.router, prefix="/detect",  tags=["Detection"])
app.include_router(cost_prediction.router,  prefix="/predict", tags=["Prediction"])


@app.get("/health", tags=["Health"])
async def health():
    return {"status": "healthy"}


if __name__ == "__main__":
    uvicorn.run("service:app", host="0.0.0.0", port=8000, reload=True)
