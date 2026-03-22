# AI Smart Resale Inspector

AI Smart Resale Inspector is a full-stack resale assessment app that inspects phones and other consumer devices from uploaded photos or camera input.

It currently supports:

- item detection through YOLO-based vision models
- background removal before damage analysis
- damage detection with bounding-box overlays
- exact model identification with Gemini vision fallback logic
- repair-cost and resale-price estimation in INR
- downloadable inspection reports
- docs and reports pages in the frontend

## Repository Layout

```
ai-smart-resale-inspector/
├── frontend/                 # Next.js app router frontend
├── backend/                  # Express API and orchestration layer
├── ml-models/                # FastAPI ML service, training assets, weights
│   ├── train/
│   │   ├── colab_train.ipynb
│   │   ├── TRAINING_GUIDE.md
│   │   └── train.py
├── shared/                   # Shared pricing and utility logic
└── README.md
```

## Key Files

- `frontend/src/app/inspect/page.tsx` - main inspection route
- `frontend/src/components/inspect/InspectLayout.tsx` - inspection workflow UI
- `backend/src/services/modelIdentificationService.js` - Gemini exact-model identification
- `backend/src/services/pricingService.js` - INR pricing logic and eBay integration hooks
- `ml-models/service.py` - FastAPI ML entrypoint
- `ml-models/train/TRAINING_GUIDE.md` - step-by-step model training guide

## Training Guide

If you want to train the custom models used by this project, start here:

- `ml-models/train/TRAINING_GUIDE.md`
- `ml-models/train/colab_train.ipynb`

The training guide covers:

- damage detection model training on Colab/Kaggle
- item detection model training for better device classification
- dataset selection tips
- installation of trained weights into `ml-models/weights/`

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | Next.js, TypeScript, Tailwind CSS, Framer Motion |
| Backend | Node.js, Express |
| ML Service | FastAPI, Python, Ultralytics YOLO, rembg |
| AI Services | Gemini Vision, Transformers-based fallbacks |
| Pricing | INR pricing engine, repair estimation, optional eBay lookup |

## Local Development

### Prerequisites

- Node.js 18+
- Python 3.10+
- npm

MongoDB is optional for local demo usage. If Atlas is unavailable, the backend still runs in degraded/demo mode.

### Install Dependencies

```bash
cd frontend
npm install

cd ../backend
npm install

cd ../ml-models
pip install -r requirements.txt
```

### Environment Setup

Create and fill these files as needed:

- `backend/.env`
- `frontend/.env.local` if required

Important backend variables include:

- `ML_SERVICE_URL=http://localhost:8000`
- `GEMINI_API_KEY=...`
- `EBAY_APP_ID=` optional

### Run the App

Use three terminals:

```bash
cd frontend
npm run dev
```

```bash
cd backend
npm run dev
```

```bash
cd ml-models
python service.py
```

Then open:

- Frontend: `http://localhost:3000`
- Backend health: `http://localhost:5000/api/health`
- ML health: `http://localhost:8000/health`

## Notes

- Large model caches are not committed to GitHub because GitHub rejects files over 100 MB.
- Transformer and ONNX caches download automatically on first use.
- If `yolov8n_damage.pt` is missing, the damage route falls back to a base YOLO model and accuracy will be limited.

## License

MIT
