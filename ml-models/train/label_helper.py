"""
ml-models/train/label_helper.py
================================
Validates and inspects a YOLO-format damage detection dataset before training.

Usage:
  python ml-models/train/label_helper.py --data ml-models/train/dataset.yaml

What it checks:
  • images/train and images/val directories exist and contain images
  • labels/train and labels/val directories exist with matching .txt files
  • Each label file is valid YOLO format (class_id cx cy w h)
  • Class IDs are within [0, nc-1]
  • Class distribution (images per class) is printed so you can spot imbalance
  • Detects and lists any corrupt/missing label files

Run this BEFORE training to catch problems early.
"""

from __future__ import annotations

import argparse
import sys
from collections import defaultdict
from pathlib import Path

import yaml


# ─── CLI ──────────────────────────────────────────────────────────────────────

def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Validate a YOLO damage-detection dataset")
    p.add_argument("--data", required=True, help="Path to dataset.yaml")
    return p.parse_args()


# ─── Helpers ──────────────────────────────────────────────────────────────────

IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".bmp", ".webp", ".tiff"}


def iter_images(folder: Path):
    return [f for f in folder.rglob("*") if f.suffix.lower() in IMAGE_EXTS]


def validate_label_file(lbl_path: Path, nc: int) -> list[str]:
    """Return list of error strings (empty = OK)."""
    errors = []
    try:
        lines = lbl_path.read_text().strip().splitlines()
    except OSError as e:
        return [f"Cannot read file: {e}"]

    if not lines:
        errors.append("Empty label file — no annotations")
        return errors

    for i, line in enumerate(lines, 1):
        parts = line.split()
        if len(parts) != 5:
            errors.append(f"Line {i}: expected 5 values, got {len(parts)}: {line!r}")
            continue
        try:
            cls_id = int(parts[0])
            coords = [float(v) for v in parts[1:]]
        except ValueError:
            errors.append(f"Line {i}: non-numeric value: {line!r}")
            continue
        if not (0 <= cls_id < nc):
            errors.append(f"Line {i}: class_id {cls_id} out of range [0, {nc-1}]")
        for j, v in enumerate(coords):
            if not (0.0 <= v <= 1.0):
                errors.append(f"Line {i}: coord[{j}]={v} not in [0, 1]")

    return errors


def check_split(split_name: str, dataset_root: Path, nc: int) -> dict:
    img_dir = dataset_root / "images" / split_name
    lbl_dir = dataset_root / "labels" / split_name

    stats = {
        "images_found":    0,
        "labels_found":    0,
        "missing_labels":  [],
        "label_errors":    {},
        "class_counts":    defaultdict(int),
    }

    if not img_dir.exists():
        print(f"  [WARN] {img_dir} does not exist — skipping {split_name} split")
        return stats

    images = iter_images(img_dir)
    stats["images_found"] = len(images)

    for img_path in images:
        lbl_path = lbl_dir / (img_path.stem + ".txt")

        if not lbl_path.exists():
            stats["missing_labels"].append(img_path.name)
            continue

        stats["labels_found"] += 1
        errors = validate_label_file(lbl_path, nc)

        if errors:
            stats["label_errors"][lbl_path.name] = errors
        else:
            # Count class occurrences
            for line in lbl_path.read_text().strip().splitlines():
                parts = line.split()
                if parts:
                    stats["class_counts"][int(parts[0])] += 1

    return stats


# ─── Main ─────────────────────────────────────────────────────────────────────

def main() -> None:
    args = parse_args()
    yaml_path = Path(args.data)

    if not yaml_path.exists():
        print(f"[ERROR] dataset.yaml not found: {yaml_path}")
        sys.exit(1)

    with yaml_path.open() as f:
        cfg = yaml.safe_load(f)

    nc    = int(cfg.get("nc", 0))
    names = cfg.get("names", {})
    raw_path = cfg.get("path", ".")

    # Resolve dataset root relative to the yaml file's directory
    dataset_root = (yaml_path.parent / raw_path).resolve()

    print()
    print("=" * 60)
    print("  Dataset Validator — AI Smart Resale Inspector")
    print("=" * 60)
    print(f"  YAML:        {yaml_path}")
    print(f"  Dataset dir: {dataset_root}")
    print(f"  Classes:     {nc}")
    for idx, name in (names.items() if isinstance(names, dict) else enumerate(names)):
        print(f"    {idx}: {name}")
    print()

    if not dataset_root.exists():
        print(f"[ERROR] Dataset root does not exist: {dataset_root}")
        print("        Update the 'path' field in dataset.yaml")
        sys.exit(1)

    total_errors = 0

    for split in ("train", "val"):
        print(f"── {split.upper()} split ──────────────────────────────────────")
        stats = check_split(split, dataset_root, nc)

        print(f"  Images found:  {stats['images_found']}")
        print(f"  Labels found:  {stats['labels_found']}")

        if stats["missing_labels"]:
            print(f"  [WARN] {len(stats['missing_labels'])} images have no label file:")
            for name in stats["missing_labels"][:5]:
                print(f"         {name}")
            if len(stats["missing_labels"]) > 5:
                print(f"         … and {len(stats['missing_labels']) - 5} more")

        if stats["label_errors"]:
            print(f"  [ERROR] {len(stats['label_errors'])} label files have errors:")
            for fname, errs in list(stats["label_errors"].items())[:3]:
                print(f"    {fname}:")
                for e in errs[:3]:
                    print(f"      • {e}")
            total_errors += len(stats["label_errors"])

        if stats["class_counts"]:
            print("  Class distribution:")
            total_boxes = sum(stats["class_counts"].values())
            for cls_id in range(nc):
                count = stats["class_counts"].get(cls_id, 0)
                bar   = "█" * min(int(count / max(total_boxes, 1) * 40), 40)
                label = names.get(cls_id, names[cls_id]) if isinstance(names, dict) else names[cls_id]
                print(f"    {cls_id} {label:<12} {count:>5} boxes  {bar}")
        else:
            print("  [INFO] No valid annotations found in this split")
        print()

    # ── Recommendations ───────────────────────────────────────────────────────
    print("── Recommendations ──────────────────────────────────────────")
    all_class_counts: dict[int, int] = defaultdict(int)
    for split in ("train", "val"):
        stats = check_split(split, dataset_root, nc)
        for cls_id, cnt in stats["class_counts"].items():
            all_class_counts[cls_id] += cnt

    min_count = min((all_class_counts.get(i, 0) for i in range(nc)), default=0)
    max_count = max((all_class_counts.get(i, 0) for i in range(nc)), default=0)

    if min_count == 0:
        missing = [names.get(i, i) for i in range(nc) if all_class_counts.get(i, 0) == 0]
        print(f"  ⚠  Classes with 0 examples: {missing}")
        print("     Add labeled images for these classes before training.")
    elif min_count < 50:
        print(f"  ⚠  Some classes have fewer than 50 examples.")
        print("     Aim for 100–300 labeled boxes per class for reliable detection.")
    else:
        print("  ✓  All classes have examples.")

    if max_count > min_count * 5 and min_count > 0:
        print("  ⚠  Class imbalance detected (ratio > 5×).")
        print("     Consider augmenting minority classes or using class weights.")
    elif min_count > 0:
        print("  ✓  Class distribution looks balanced.")

    if total_errors == 0:
        print("  ✓  No label format errors found.")
    else:
        print(f"  ✗  {total_errors} label file(s) have format errors — fix before training.")

    print()
    if total_errors == 0 and min_count >= 50:
        print("  Dataset looks ready! Run training with:")
        print("    python ml-models/train/train.py --data", str(yaml_path))
    else:
        print("  Address the issues above, then re-run this validator.")
    print()


if __name__ == "__main__":
    main()
