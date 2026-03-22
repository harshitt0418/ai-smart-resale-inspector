# ML Models — AI Smart Resale Inspector

This directory contains:

| Path                        | Purpose                                              |
|-----------------------------|------------------------------------------------------|
| `object-detection/`         | YOLOv8 model for identifying item categories         |
| `damage-detection/`         | Fine-tuned YOLOv8 model for scratch/dent/crack detection |
| `cost-prediction/`          | LightGBM / XGBoost repair cost prediction model      |
| `weights/`                  | Binary model weight files (`.pt`, `.onnx`) — gitignored |
| `service.py`                | FastAPI microservice exposing all models via REST     |
| `requirements.txt`          | Python dependencies                                  |

---

## Running the ML Microservice

```bash
# Create virtual environment
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start the service
python service.py
# → Listening on http://localhost:8000
```

---

## Endpoints (stubbed — filled in Parts 5–8)

| Method | Path               | Description                     |
|--------|--------------------|---------------------------------|
| POST   | `/detect/item`     | Run object detection on frame   |
| POST   | `/detect/damage`   | Run damage detection on frame   |
| POST   | `/predict/cost`    | Predict repair cost             |
| GET    | `/health`          | Service health check            |
