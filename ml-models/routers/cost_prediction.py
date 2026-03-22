"""
routers/cost_prediction.py — Stub router for LightGBM cost prediction.
Full implementation added in Part 8.
"""

from fastapi import APIRouter
from pydantic import BaseModel
from typing import List

router = APIRouter()


class CostRequest(BaseModel):
    itemLabel:    str
    damages:      List[dict]
    itemAgeYears: float


@router.post("/cost")
async def predict_cost(body: CostRequest):
    # TODO Part 8: load LightGBM model and return cost range
    return {"min": 0, "max": 0, "currency": "USD"}
