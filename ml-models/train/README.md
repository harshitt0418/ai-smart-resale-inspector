# Training Guide — AI Smart Resale Inspector Damage Detector

This guide walks you through training a real YOLOv8 damage detection model to replace the CLIP zero-shot baseline. A properly trained model will be **10–30× more accurate** for damage detection.

**No GPU on your machine? No problem.** See the cloud training options first — they are the recommended path.

---

## Cloud Training Options (No GPU Required)

| Platform | GPU | Free quota | Best for |
|---|---|---|---|
| **Google Colab** | NVIDIA T4 (16 GB) | ~4 hrs/day | Easiest, use the notebook |
| **Kaggle Notebooks** | NVIDIA P100 (16 GB) | 30 hrs/week | More quota than Colab |
| **Roboflow Train** | Cloud (managed) | 3 free credits | Zero setup, one-click |

---

## Option 1 — Google Colab (Recommended)

A ready-to-run notebook is included: **`colab_train.ipynb`**

### Steps

1. **Open the notebook in Colab**
   - Go to [https://colab.research.google.com](https://colab.research.google.com)
   - Click **File → Upload notebook**
   - Select: `ml-models/train/colab_train.ipynb` from your computer

2. **Enable the free GPU**
   - In Colab: **Runtime → Change runtime type → T4 GPU → Save**

3. **Get a free dataset from Roboflow**
   - Go to [https://universe.roboflow.com](https://universe.roboflow.com)
   - Search: `phone damage detection` or `surface defect yolov8`
   - Open a dataset (pick one with 500+ images)
   - Click **"Download Dataset"** → Format: **YOLOv8** → **"Show download code"**
   - Copy the three values: `api_key`, `workspace`, `project`

4. **Run cells top to bottom** (Shift+Enter each cell)
   - Cell 1: checks GPU is available
   - Cell 2: installs ultralytics
   - Cell 3: mounts Google Drive (so weights survive disconnects)
   - Cell 4: downloads the dataset using your Roboflow values
   - Cell 6: trains for 100 epochs (~20–40 min)
   - Cell 8: downloads `best.pt` to your computer

5. **Rename and place the file**
   ```
   Rename:  best.pt  →  yolov8n_damage.pt
   Copy to: ml-models/weights/yolov8n_damage.pt
   ```

6. **Restart the Python ML service** — it auto-loads the new weights:
   ```powershell
   python ml-models/service.py
   ```

---

## Option 2 — Kaggle Notebooks (30 hrs/week free GPU)

Kaggle gives **30 GPU hours per week** — much more than Colab's free tier.

### Steps

1. Go to [https://www.kaggle.com/code](https://www.kaggle.com/code) → **New Notebook**
2. Click **File → Import Notebook** → upload `colab_train.ipynb`
   - The notebook works on Kaggle without modification
3. On the right panel: **Accelerator → GPU P100** → Save
4. In Cell 4, paste your Roboflow values (same as Colab)
5. Click **Run All** (top menu)
6. When done: **Output tab** → download `best.pt`

---

## Option 3 — Roboflow Train (Easiest, Zero Setup)

If you only want to train and don't want to write any code:

1. Go to [https://app.roboflow.com](https://app.roboflow.com) → create free account
2. Create a project → **Object Detection** → upload your photos
3. Label them (draw boxes, pick class names)
4. Click **Train** → choose **"Roboflow 3.0 Fast"** (YOLOv8 based)
5. After training: **Deploy → Export → YOLOv8 PyTorch** → download
6. Rename to `yolov8n_damage.pt` → place in `ml-models/weights/`

> Roboflow Train gives 3 free training credits. Each credit trains one version.

---

## Why the Default Model is Inaccurate

| Component | Current approach | Problem |
|---|---|---|
| Item detection | `Xenova/detr-resnet-50` (COCO pretrained) | Only recognises 80 generic COCO categories |
| Damage detection | CLIP zero-shot with text prompts | Never seen actual damage — guesses from descriptions |

Training a dedicated **YOLOv8n** model on real damage images directly addresses the second problem.

---

## Local Training (requires GPU or patience)

Only use this if you have a dedicated NVIDIA GPU. On CPU, 100 epochs takes 4–8 hours.

```powershell
cd "ml-models"
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

---

## Step 1 — Get a Labeled Dataset

You need images of damaged items with bounding boxes drawn around each defect.  
Pick **one** of the three options below.

### Option A — Download from Roboflow Universe (Recommended, Free)

Roboflow has hundreds of free community datasets. These work out of the box.

1. Go to [https://universe.roboflow.com](https://universe.roboflow.com)
2. Search for one of these (copy the search term exactly):
   - `phone damage detection` — cracks and scratches on phones
   - `surface defect detection` — general surface defects
   - `product damage` — various product damage types
   - `scratch detection` — scratch-specific dataset
3. Open a dataset → click **"Dataset"** tab → pick the latest version
4. Click **"Export Dataset"** → Format: **"YOLOv8"** → **"download zip to computer"**
5. Extract the zip — you will get a folder with `images/` and `labels/` subfolders
6. Copy that folder to `ml-models/train/data/`  
   (or update `path:` in `dataset.yaml` to point to wherever you extracted it)

> **Tip**: Datasets with 500+ images across your target classes give the best results.  
> Aim for classes: scratch, crack, dent, stain — even if not all 6 are present.

---

### Option B — Label Your Own Photos (Best for Accuracy)

If you want maximum accuracy for your specific items (phones, laptops, furniture):

1. Take 100–500 photos of different items, including damaged ones
2. Go to [https://app.roboflow.com](https://app.roboflow.com) → Create a free account
3. New Project → **Object Detection**
4. Upload your photos
5. Use the annotation tool to draw bounding boxes and label them:
   - `scratch` — any visible scratch or scuff
   - `crack` — cracks in screen, body, or frame
   - `dent` — physical dents or deformations
   - `stain` — discolouration, water damage, heavy dirt
   - `chip` — chipped corners or missing material
   - `corrosion` — rust or oxidation
6. Generate a dataset version → Export → **YOLOv8** format
7. Set `path:` in `dataset.yaml` to the extracted folder

> **Minimum recommended**: 100 labeled boxes per class.  
> **Good**: 300+ boxes per class.  
> **Excellent**: 1000+ boxes per class.

---

### Option C — Kaggle Public Datasets

Some useful free datasets on Kaggle:
- [Surface Crack Detection](https://www.kaggle.com/datasets/arunrk7/surface-crack-detection) — ~20k crack images
- [Defect Detection](https://www.kaggle.com/datasets/search?q=defect+detection) — various

Note: Kaggle datasets may need format conversion to YOLO format. Use `label_helper.py` to validate after conversion.

---

## Step 2 — Validate the Dataset

Before training, check that your dataset is properly formatted:

```powershell
# From workspace root, with venv active
python ml-models/train/label_helper.py --data ml-models/train/dataset.yaml
```

Fix any errors it reports before proceeding.

**Expected output when ready:**
```
✓  All classes have examples.
✓  Class distribution looks balanced.
✓  No label format errors found.

  Dataset looks ready! Run training with:
    python ml-models/train/train.py --data ml-models/train/dataset.yaml
```

---

## Step 3 — Train the Model

```powershell
# From workspace root, with venv active

# CPU training (no GPU required, ~2-4 hours for 100 epochs)
python ml-models/train/train.py

# GPU training (NVIDIA, ~15-30 min) — replace '0' with your GPU index
python ml-models/train/train.py --device 0

# Quick test run (5 epochs) to verify everything works
python ml-models/train/train.py --epochs 5 --batch 4

# Custom dataset path
python ml-models/train/train.py --data path/to/your/dataset.yaml
```

### All training options

| Flag | Default | Description |
|---|---|---|
| `--data` | `ml-models/train/dataset.yaml` | Path to dataset YAML |
| `--epochs` | `100` | Training epochs |
| `--imgsz` | `640` | Input image resolution |
| `--batch` | `16` | Batch size (lower to `4` or `8` on CPU/low RAM) |
| `--device` | `cpu` | `cpu` or GPU index (`0`, `1`, …) |
| `--patience` | `20` | Early stopping patience |

### Expected results by dataset size

| Dataset size | Epochs | Expected mAP50 |
|---|---|---|
| 200 images | 50 | ~0.45–0.60 |
| 500 images | 100 | ~0.60–0.75 |
| 2000 images | 100 | ~0.75–0.88 |
| 5000+ images | 150 | ~0.85–0.93 |

---

## Step 4 — After Training

When training finishes, the script automatically copies:
- `ml-models/weights/yolov8n_damage.pt` — PyTorch weights
- `ml-models/weights/yolov8n_damage.onnx` — ONNX weights

**Restart the Python ML service** to load the new model:

```powershell
# Kill any running instance, then:
python ml-models/service.py
```

The service checks for `yolov8n_damage.pt` at startup and uses it automatically.  
You do **not** need to change any code.

---

## Step 5 — Monitor Training Progress

Training logs appear in `runs/damage/train/`. Open `results.png` to see:
- Box loss (lower = better box localisation)
- Class loss (lower = better class prediction)
- mAP50 curve (higher = better accuracy)

If the model is **overfitting** (val loss rising while train loss falls):
- Reduce `--epochs` or increase `--patience`
- Add more diverse training images
- Enable augmentation in `dataset.yaml` (already default in YOLOv8)

---

## Architecture Notes

```
User uploads photo
       │
       ▼
Node.js Express backend  (port 5000)
  └── transformersService.js
       ├── Item detection:   Xenova/detr-resnet-50  (COCO, 42 mAP)
       └── Damage detection: CLIP zero-shot + prompt ensembling
                              │  (used until Python service is running)
                              ▼
                         Python FastAPI  (port 8000)  ← optional
                           └── damage_detection.py
                                └── yolov8n_damage.pt  ← your trained model
```

After training, you can route damage detection calls to the Python service  
by updating `backend/src/services/transformersService.js` to call  
`http://localhost:8000/detect/damage` when the Python service is available.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `ModuleNotFoundError: ultralytics` | `pip install ultralytics` |
| `CUDA out of memory` | Add `--batch 4` or use `--device cpu` |
| Dataset YAML not found | Check the `path:` field in `dataset.yaml` |
| 0 examples for a class | Add more photos or merge rare classes |
| mAP below 0.40 after 100 epochs | Dataset too small — get more labeled images |
| Training very slow on CPU | Normal — use `--batch 4` and expect 2-4 hours |
