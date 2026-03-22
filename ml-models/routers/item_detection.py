"""
routers/item_detection.py — YOLOv8 item detection router.

Loads yolov8n.pt on first request (auto-downloaded ~6 MB from Ultralytics hub
if not already present in ml-models/weights/).

Mapped COCO classes → resale-relevant item labels.
Returns normalised bounding box coordinates (0-1 relative to image size).
"""

from __future__ import annotations

import base64
import io
import logging
import os

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()
logger = logging.getLogger(__name__)

# ─── Lazy model singleton ────────────────────────────────────────────────────
_model = None

# COCO class name → resale item label
RESALE_COCO_MAP: dict[str, str] = {
    "cell phone":    "Smartphone",
    "laptop":        "Laptop",
    "keyboard":      "Keyboard",
    "tv":            "Television",
    "mouse":         "Computer Mouse",
    "remote":        "TV Remote",
    "backpack":      "Backpack",
    "chair":         "Chair",
    "couch":         "Sofa",
    "bed":           "Bed",
    "clock":         "Clock",
    "vase":          "Vase",
    "bottle":        "Bottle",
    "cup":           "Cup",
    "book":          "Book",
    "teddy bear":    "Toy",
    "suitcase":      "Luggage",
    "umbrella":      "Umbrella",
    "handbag":       "Handbag",
    "tie":           "Tie",
    "sports ball":   "Sports Equipment",
    "baseball bat":  "Sports Equipment",
    "skateboard":    "Skateboard",
    "surfboard":     "Surfboard",
    "tennis racket": "Tennis Racket",
    "microwave":     "Microwave",
    "oven":          "Oven",
    "toaster":       "Toaster",
    "refrigerator":  "Refrigerator",
    "scissors":      "Scissors",
    "bicycle":       "Bicycle",
    "motorcycle":    "Motorcycle",
}


def _load_model():
    """Lazily load YOLOv8n; raise HTTP 503 if ultralytics is not installed."""
    global _model
    if _model is not None:
        return _model
    try:
        from ultralytics import YOLO  # noqa: PLC0415

        weights_path = os.path.join(
            os.path.dirname(__file__), "..", "weights", "yolov8n.pt"
        )
        _model = YOLO(weights_path)  # auto-downloads if file is missing
        logger.info("YOLOv8n loaded from %s", weights_path)
    except ImportError as exc:
        raise HTTPException(
            status_code=503,
            detail="ultralytics package not installed. Run: pip install ultralytics",
        ) from exc
    except Exception as exc:
        logger.exception("Failed to load YOLOv8 model: %s", exc)
        raise HTTPException(status_code=503, detail=f"Model unavailable: {exc}") from exc
    return _model


# ─── Schema ──────────────────────────────────────────────────────────────────

class FrameRequest(BaseModel):
    image: str  # raw base-64 JPEG/PNG (no data-URL prefix)


# ─── Endpoint ────────────────────────────────────────────────────────────────

@router.post("/item")
async def detect_item(body: FrameRequest):
    """
    Detect the primary resale item in the frame.

    Returns the highest-confidence detection that maps to a resale category.
    Bounding box coordinates are normalised to the range [0, 1].
    """
    model = _load_model()

    try:
        from PIL import Image  # noqa: PLC0415

        img_bytes = base64.b64decode(body.image)
        img = Image.open(io.BytesIO(img_bytes)).convert("RGB")
        img_w, img_h = img.size

        results = model.predict(img, imgsz=640, conf=0.50, verbose=False)  # Increased from 0.25

        best: dict | None = None
        best_conf = 0.0
        
        # Prioritize "cell phone" detection if found (smartphones are commonly misidentified)
        phone_detection: dict | None = None

        for r in results:
            for box in r.boxes:
                conf = float(box.conf[0])
                cls  = int(box.cls[0])
                name = model.names[cls].lower()

                if name in RESALE_COCO_MAP:
                    xyxy = box.xyxy[0].tolist()  # [x1, y1, x2, y2] in pixels
                    detection = {
                        "label":      RESALE_COCO_MAP[name],
                        "confidence": round(conf, 4),
                        "boundingBox": {
                            "x":      round(xyxy[0] / img_w, 4),
                            "y":      round(xyxy[1] / img_h, 4),
                            "width":  round((xyxy[2] - xyxy[0]) / img_w, 4),
                            "height": round((xyxy[3] - xyxy[1]) / img_h, 4),
                        },
                    }
                    
                    # If we find a cell phone, store it separately
                    if name == "cell phone":
                        if phone_detection is None or conf > phone_detection["confidence"]:
                            phone_detection = detection
                    
                    # Track highest confidence detection
                    if conf > best_conf:
                        best_conf = conf
                        best = detection
        
        # Prefer phone detection over other classes (even if lower confidence)
        if phone_detection is not None:
            return phone_detection

        if best is None:
            # No recognised resale item — fall back to generic label
            return {
                "label":      "Unknown Item",
                "confidence": 0.0,
                "boundingBox": {"x": 0.1, "y": 0.1, "width": 0.8, "height": 0.8},
            }

        return best

    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Inference error: %s", exc)
        raise HTTPException(status_code=500, detail=str(exc)) from exc

