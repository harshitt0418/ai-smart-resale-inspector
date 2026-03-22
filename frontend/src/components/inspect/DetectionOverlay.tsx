/**
 * components/inspect/DetectionOverlay.tsx
 *
 * Canvas overlay rendered on top of the captured frame that draws:
 *  • Animated red bounding box
 *  • Label + confidence pill above the box
 *  • Corner accent marks (tactical HUD style)
 *
 * BoundingBox coordinates are normalised (0-1) relative to the image.
 * Pass the rendered pixel dimensions of the image container so the canvas
 * can scale them correctly.
 */

'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import type { DetectedItem } from '@/types';

interface DetectionOverlayProps {
  item:            DetectedItem;
  containerWidth:  number;
  containerHeight: number;
}

export default function DetectionOverlay({
  item,
  containerWidth,
  containerHeight,
}: DetectionOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || containerWidth <= 0 || containerHeight <= 0) return;

    canvas.width  = containerWidth;
    canvas.height = containerHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, containerWidth, containerHeight);

    const { boundingBox, label, confidence } = item;

    // Scale normalised coordinates → pixel coordinates
    const px = boundingBox.x      * containerWidth;
    const py = boundingBox.y      * containerHeight;
    const pw = boundingBox.width  * containerWidth;
    const ph = boundingBox.height * containerHeight;

    // ── Bounding box with glow ───────────────────────────────────────────────
    ctx.save();
    ctx.shadowColor = '#22C55E';
    ctx.shadowBlur  = 14;
    ctx.strokeStyle = '#22C55E';
    ctx.lineWidth   = 2;
    ctx.strokeRect(px, py, pw, ph);
    ctx.restore();

    // ── Semi-transparent fill ───────────────────────────────────────────────
    ctx.fillStyle = 'rgba(34, 197, 94, 0.06)';
    ctx.fillRect(px, py, pw, ph);

    // ── Label pill ──────────────────────────────────────────────────────────
    const text     = `${label}  ${Math.round(confidence * 100)}%`;
    const fontSize = Math.max(11, Math.min(13, containerWidth / 45));
    ctx.font       = `600 ${fontSize}px Inter, system-ui, sans-serif`;

    const metrics  = ctx.measureText(text);
    const pillW    = metrics.width + 18;
    const pillH    = fontSize + 10;
    const pillX    = Math.min(px, containerWidth - pillW - 4);
    const pillY    = Math.max(4, py - pillH - 6);

    // pill background
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur  = 6;
    ctx.fillStyle   = '#16A34A';
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(pillX, pillY, pillW, pillH, 4);
    } else {
      ctx.rect(pillX, pillY, pillW, pillH);
    }
    ctx.fill();
    ctx.restore();

    // pill text
    ctx.fillStyle    = '#ffffff';
    ctx.font         = `600 ${fontSize}px Inter, system-ui, sans-serif`;
    ctx.textBaseline = 'middle';
    ctx.fillText(text, pillX + 9, pillY + pillH / 2);

    // ── Corner accent marks ─────────────────────────────────────────────────
    const cornerLen = Math.min(18, pw * 0.12, ph * 0.12);

    ctx.save();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth   = 2;
    ctx.shadowColor = '#22C55E';
    ctx.shadowBlur  = 8;

    const corners: [number, number, number, number][] = [
      [px,      py,      1,  1 ],
      [px + pw, py,     -1,  1 ],
      [px,      py + ph, 1, -1 ],
      [px + pw, py + ph,-1, -1 ],
    ];
    corners.forEach(([cx, cy, dx, dy]) => {
      ctx.beginPath();
      ctx.moveTo(cx + dx * cornerLen, cy);
      ctx.lineTo(cx, cy);
      ctx.lineTo(cx, cy + dy * cornerLen);
      ctx.stroke();
    });
    ctx.restore();
  }, [item, containerWidth, containerHeight]);

  return (
    <motion.canvas
      ref={canvasRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="absolute inset-0 pointer-events-none z-10"
      style={{ width: containerWidth, height: containerHeight }}
      aria-hidden="true"
    />
  );
}
