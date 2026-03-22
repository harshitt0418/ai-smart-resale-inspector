# AI Smart Resale Inspector

AI Smart Resale Inspector is a full-stack computer vision application for evaluating used phones and consumer devices from camera input or uploaded images.

It combines frontend inspection workflows, backend orchestration, and an ML microservice to estimate condition, repair cost, and resale value.

## What It Does

- detects the item category from live camera or uploaded photos
- removes background noise before running damage analysis
- identifies visible issues with overlayed bounding boxes
- estimates repair cost and resale price in INR
- uses Gemini vision for exact device-model identification when available
- generates downloadable inspection reports
- includes dedicated docs and reports pages in the app

## End-to-End Flow

1. Capture or upload photos of the device.
2. Detect the primary item.
3. Remove background from the inspection image.
4. Detect damage regions.
5. Estimate severity, repair cost, and resale value.
6. Identify the likely exact model.
7. Generate a report for download.

## Project Highlights

- Next.js inspection UI with camera and upload modes
- Express backend for orchestration and business logic
- FastAPI ML service for item and damage detection
- rembg preprocessing to reduce false positives from backgrounds
- Gemini-powered model identification fallback flow
- INR-based pricing pipeline for the India resale market

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | Next.js, TypeScript, Tailwind CSS, Framer Motion |
| Backend | Node.js, Express |
| ML Service | FastAPI, Python, Ultralytics YOLO, rembg |
| AI Services | Gemini Vision, Transformers-based fallbacks |
| Pricing | INR pricing engine, repair estimation, optional eBay lookup |

## Repository Structure

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

## Important Project Files

- `frontend/src/app/inspect/page.tsx` - main inspection route
- `frontend/src/components/inspect/InspectLayout.tsx` - inspection workflow UI
- `frontend/src/app/reports/page.tsx` - generated reports listing page
- `frontend/src/app/docs/page.tsx` - in-app documentation page
- `backend/src/services/modelIdentificationService.js` - Gemini model identification
- `backend/src/services/pricingService.js` - pricing and valuation logic
- `ml-models/service.py` - FastAPI ML service entrypoint
- `ml-models/train/TRAINING_GUIDE.md` - training instructions for custom models

## Training the Models

If you want to train the custom damage or item detection models, start here:

- `ml-models/train/TRAINING_GUIDE.md`
- `ml-models/train/colab_train.ipynb`

The training workflow covers:

- damage detection model training on Colab or Kaggle
- item detection model training for better device classification
- dataset selection guidance
- installation of trained weights into `ml-models/weights/`

## Local Development

### Prerequisites

- Node.js 18+
- Python 3.10+
- npm

MongoDB is optional for local demo usage. If Atlas is unavailable, the backend still runs in demo mode.

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

Open the following URLs:

- Frontend: `http://localhost:3000`
- Backend health: `http://localhost:5000/api/health`
- ML health: `http://localhost:8000/health`

## Notes

- Large model caches are not committed because GitHub rejects files over 100 MB.
- Transformer and ONNX caches download automatically on first use.
- If `yolov8n_damage.pt` is missing, damage detection falls back to a base model and accuracy is limited.
- Generated PDF reports are excluded from version control.

## License

MIT
