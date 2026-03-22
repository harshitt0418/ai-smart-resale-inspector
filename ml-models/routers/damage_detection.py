"""
routers/damage_detection.py — Fine-tuned YOLOv8 damage detection router.

Uses yolov8n.pt as a base model with a damage-specific class mapping.
In production, replace the weights path with a fine-tuned model trained on
a labelled dataset of scratches, dents, cracks, and stains.

Damage classes (synthetic — override with real fine-tuned class names):
  0: scratch  1: dent  2: crack  3: stain

Severity is derived from detection confidence:
  conf >= 0.70 → severe   (clearly visible = significant damage)
  conf >= 0.50 → moderate
  conf <  0.50 → minor    (barely detected = subtle damage)

  After training a dedicated damage model, severity should come from
  explicit trained classes (e.g. scratch_minor, scratch_severe) rather
  than detection confidence alone.

Background removal:
  Before YOLO inference each image is passed through rembg (U2NetP model,
  ~4 MB) which isolates the device from the scene. The subject is then
  composited onto a neutral gray canvas so the detector cannot mistake
  floor textures, table grain, or shadows for device damage.
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

# ─── Lazy model singletons ───────────────────────────────────────────────────
_damage_model   = None
_rembg_session  = None          # rembg U2NetP session (lazy, ~4 MB download)

# Neutral gray background colour used after bg removal.
# Gray is deliberately chosen: it is neither white (could be confused with
# device body) nor black (could be confused with screen bezel).
_BG_COLOUR = (160, 160, 160)

# Damage class index → type label.
# These class IDs MUST match the order in ml-models/train/dataset.yaml.
# Update ONLY if you retrain with a different class order.
DAMAGE_CLASS_MAP: dict[int, str] = {
    0: "scratch",
    1: "crack",
    2: "dent",
    3: "stain",
    4: "chip",
    5: "corrosion",
}

# Fallback for any class index not in the trained map
FALLBACK_DAMAGE_TYPE = "scratch"


def _conf_to_severity(conf: float) -> str:
    """High detection confidence = clearly visible = likely more severe."""
    if conf >= 0.70:
        return "severe"
    if conf >= 0.50:
        return "moderate"
    return "minor"


def _load_model():
    """Lazily load the damage detection model weights."""
    global _damage_model
    if _damage_model is not None:
        return _damage_model
    try:
        from ultralytics import YOLO  # noqa: PLC0415

        # Use fine-tuned weights if present, otherwise fall back to yolov8n base
        weights_dir = os.path.join(os.path.dirname(__file__), "..", "weights")
        fine_tuned  = os.path.join(weights_dir, "yolov8n_damage.pt")
        base_model  = os.path.join(weights_dir, "yolov8n.pt")

        weights_path = fine_tuned if os.path.exists(fine_tuned) else base_model
        _damage_model = YOLO(weights_path)
        logger.info("Damage model loaded from %s", weights_path)
    except ImportError as exc:
        raise HTTPException(
            status_code=503,
            detail="ultralytics package not installed. Run: pip install ultralytics",
        ) from exc
    except Exception as exc:
        logger.exception("Failed to load damage model: %s", exc)
        raise HTTPException(status_code=503, detail=f"Model unavailable: {exc}") from exc
    return _damage_model


def _get_rembg_session():
    """
    Lazily initialise a rembg U2NetP session.
    U2NetP is the lightweight variant (~4 MB vs ~176 MB for U2Net);
    fast enough for real-time pre-processing on CPU.
    Returns None if rembg is not installed (graceful degradation).
    """
    global _rembg_session
    if _rembg_session is not None:
        return _rembg_session
    try:
        from rembg import new_session  # noqa: PLC0415
        _rembg_session = new_session("u2netp")
        logger.info("[BgRemoval] rembg U2NetP session initialised")
    except Exception as exc:  # noqa: BLE001
        logger.warning("[BgRemoval] rembg unavailable — skipping background removal: %s", exc)
        _rembg_session = False          # sentinel so we don't retry every request
    return _rembg_session


def _remove_background(img):
    """
    Strip the scene background and composite the subject onto a neutral
    gray canvas.  Returns the original image if rembg is unavailable or
    fails, so damage detection always proceeds.

    Args:
        img: PIL.Image.Image in RGB mode.
    Returns:
        PIL.Image.Image in RGB mode, background replaced with _BG_COLOUR.
    """
    session = _get_rembg_session()
    if not session:                     # rembg not installed or failed to init
        return img
    try:
        from rembg import remove  # noqa: PLC0415
        from PIL import Image     # noqa: PLC0415

        removed = remove(img, session=session)  # → RGBA, alpha=0 where bg was
        bg = Image.new("RGB", removed.size, _BG_COLOUR)
        bg.paste(removed, mask=removed.split()[3])   # alpha channel as mask
        logger.debug("[BgRemoval] background stripped successfully")
        return bg
    except Exception as exc:            # noqa: BLE001
        logger.warning("[BgRemoval] removal failed, using original image: %s", exc)
        return img


# ─── Schema ──────────────────────────────────────────────────────────────────

class FrameRequest(BaseModel):
    image: str  # raw base-64 JPEG/PNG (no data-URL prefix)


# ─── Endpoint ────────────────────────────────────────────────────────────────

@router.post("/damage")
async def detect_damage(body: FrameRequest):
    """
    Detect surface damage regions in the frame.

    Pipeline:
      1. Decode base-64 image.
      2. Remove background (rembg U2NetP) → composite onto neutral gray.
      3. Run YOLO damage detection on the cleaned image.
      4. Return normalised bounding boxes tagged with type + severity.

    Returns a list of damage objects, each with:
      type, severity, confidence, boundingBox (normalised 0–1)
    """
    model = _load_model()

    try:
        from PIL import Image  # noqa: PLC0415

        img_bytes = base64.b64decode(body.image)
        img = Image.open(io.BytesIO(img_bytes)).convert("RGB")
        img_w, img_h = img.size

        # ── Step: remove background ──────────────────────────────────────────
        # Isolate the device from the scene so YOLO cannot fire on background
        # textures (tables, floors, walls, shadows).
        img = _remove_background(img)

        # Convert processed image to base64 for frontend display
        processed_buffer = io.BytesIO()
        img.save(processed_buffer, format="JPEG", quality=85)
        processed_b64 = base64.b64encode(processed_buffer.getvalue()).decode()

        # Lower confidence threshold so the base model returns something visible
        results = model.predict(img, imgsz=640, conf=0.20, verbose=False)

        damages: list[dict] = []

        for r in results:
            for box in r.boxes:
                conf = float(box.conf[0])
                cls  = int(box.cls[0])

                # Map class → damage type (fallback to "unknown" for unlisted)
                dtype = DAMAGE_CLASS_MAP.get(cls % len(DAMAGE_CLASS_MAP), FALLBACK_DAMAGE_TYPE)

                xyxy = box.xyxy[0].tolist()  # [x1, y1, x2, y2] in pixels

                damages.append({
                    "type":      dtype,
                    "severity":  _conf_to_severity(conf),
                    "confidence": round(conf, 4),
                    "boundingBox": {
                        "x":      round(xyxy[0] / img_w, 4),
                        "y":      round(xyxy[1] / img_h, 4),
                        "width":  round((xyxy[2] - xyxy[0]) / img_w, 4),
                        "height": round((xyxy[3] - xyxy[1]) / img_h, 4),
                    },
                })

        # Cap at 10 damage regions — more than that is noise
        damages = sorted(damages, key=lambda d: d["confidence"], reverse=True)[:10]

        return {
            "damages": damages,
            "processedImage": processed_b64  # Base64 JPEG of bg-removed image
        }

    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Damage inference error: %s", exc)
        raise HTTPException(status_code=500, detail=str(exc)) from exc

