"""
ml-models/train/train.py
========================
Fine-tune YOLOv8n for surface-damage detection and export to ONNX.

Usage (run from the workspace root):

  # CPU training (slow but works without a GPU)
  python ml-models/train/train.py

  # GPU training (NVIDIA, much faster)
  python ml-models/train/train.py --device 0

  # Custom dataset location
  python ml-models/train/train.py --data path/to/dataset.yaml

  # Quick smoke-test on 5 epochs
  python ml-models/train/train.py --epochs 5 --batch 4

After training the script automatically:
  1. Copies best.pt  → ml-models/weights/yolov8n_damage.pt
  2. Exports to ONNX → ml-models/weights/yolov8n_damage.onnx
  3. Prints accuracy metrics (mAP50, mAP50-95)

The Python FastAPI service (ml-models/service.py) automatically loads
yolov8n_damage.pt when it exists, falling back to the base yolov8n.pt.
"""

from __future__ import annotations

import argparse
import shutil
import sys
from pathlib import Path

# ─── Paths ────────────────────────────────────────────────────────────────────

WORKSPACE_ROOT  = Path(__file__).resolve().parent.parent.parent
WEIGHTS_DIR     = WORKSPACE_ROOT / "ml-models" / "weights"
DEFAULT_DATA    = Path(__file__).resolve().parent / "dataset.yaml"
RUNS_DIR        = WORKSPACE_ROOT / "runs" / "damage"


# ─── CLI ──────────────────────────────────────────────────────────────────────

def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Fine-tune YOLOv8n for damage detection")
    p.add_argument(
        "--data", default=str(DEFAULT_DATA),
        help="Path to dataset.yaml (default: ml-models/train/dataset.yaml)",
    )
    p.add_argument("--epochs",  type=int,   default=100,  help="Training epochs (default 100)")
    p.add_argument("--imgsz",   type=int,   default=640,  help="Input image size (default 640)")
    p.add_argument("--batch",   type=int,   default=16,   help="Batch size (default 16, lower for CPU)")
    p.add_argument("--device",  default="cpu",            help="Device: 'cpu' or GPU index e.g. '0'")
    p.add_argument("--patience",type=int,   default=20,   help="Early-stop patience (default 20)")
    p.add_argument("--workers", type=int,   default=4,    help="DataLoader workers (default 4)")
    p.add_argument("--name",    default="train",          help="Run name under runs/damage/")
    return p.parse_args()


# ─── Main ─────────────────────────────────────────────────────────────────────

def main() -> None:
    args = parse_args()

    # ── Validate data file ────────────────────────────────────────────────────
    data_path = Path(args.data)
    if not data_path.exists():
        print(f"[ERROR] Dataset YAML not found: {data_path}")
        print("        Create it by following ml-models/train/README.md")
        sys.exit(1)

    # ── Import ultralytics ────────────────────────────────────────────────────
    try:
        from ultralytics import YOLO
    except ImportError:
        print("[ERROR] ultralytics is not installed.")
        print("        Run: pip install ultralytics")
        sys.exit(1)

    WEIGHTS_DIR.mkdir(parents=True, exist_ok=True)

    # ── Load base model ───────────────────────────────────────────────────────
    # yolov8n.pt is the smallest/fastest YOLOv8 — good for CPU training.
    # Swap for 'yolov8s.pt' or 'yolov8m.pt' for higher accuracy if you have a GPU.
    print("[Train] Loading YOLOv8n base model…")
    model = YOLO("yolov8n.pt")  # auto-downloaded from Ultralytics hub (~6 MB)

    # ── Train ─────────────────────────────────────────────────────────────────
    print(f"[Train] Starting training for {args.epochs} epochs on device={args.device}")
    print(f"[Train] Dataset: {data_path}")
    print(f"[Train] Results will appear in: {RUNS_DIR / args.name}")
    print()

    results = model.train(
        data       = str(data_path),
        epochs     = args.epochs,
        imgsz      = args.imgsz,
        batch      = args.batch,
        device     = args.device,
        patience   = args.patience,
        workers    = args.workers,
        project    = str(RUNS_DIR.parent),
        name       = f"damage/{args.name}",
        save       = True,
        plots      = True,
        val        = True,
    )

    best_weights = RUNS_DIR / args.name / "weights" / "best.pt"
    if not best_weights.exists():
        print("[ERROR] Training completed but best.pt was not found. Check the run logs.")
        sys.exit(1)

    # ── Print metrics ─────────────────────────────────────────────────────────
    metrics = results.results_dict if hasattr(results, "results_dict") else {}
    map50   = metrics.get("metrics/mAP50(B)",    "?")
    map5095 = metrics.get("metrics/mAP50-95(B)", "?")
    print()
    print("=" * 60)
    print(f"  Training complete!")
    print(f"  mAP50:     {map50}")
    print(f"  mAP50-95:  {map5095}")
    print("=" * 60)

    # ── Copy weights ──────────────────────────────────────────────────────────
    dest_pt = WEIGHTS_DIR / "yolov8n_damage.pt"
    shutil.copy(best_weights, dest_pt)
    print(f"[Train] Saved PyTorch weights → {dest_pt}")

    # ── Export to ONNX ────────────────────────────────────────────────────────
    print("[Train] Exporting to ONNX…")
    best_model = YOLO(str(best_weights))
    best_model.export(format="onnx", imgsz=args.imgsz, simplify=True, dynamic=False)

    onnx_src  = best_weights.with_suffix(".onnx")
    dest_onnx = WEIGHTS_DIR / "yolov8n_damage.onnx"
    if onnx_src.exists():
        shutil.copy(onnx_src, dest_onnx)
        print(f"[Train] Saved ONNX model      → {dest_onnx}")
    else:
        print(f"[WARN] ONNX export file not found at {onnx_src}. Check export logs.")

    print()
    print("[Train] DONE — restart the Python ML service to load the new model:")
    print("        python ml-models/service.py")


if __name__ == "__main__":
    main()
