/**
 * components/inspect/DamageOverlay.tsx
 *
 * Canvas overlay rendered on top of the captured preview that draws all
 * detected damage regions.  Each region gets:
 *  • Colour-coded bounding box by severity (yellow=minor, orange=moderate, red=severe)
 *  • Severity + type label pill
 *  • Corner accent marks
 *
 * Bounding box coordinates are normalised (0-1). Pass rendered pixel dimensions.
 */

'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import type { Damage } from '@/types';

interface DamageOverlayProps {
  damages:         Damage[];
  containerWidth:  number;
  containerHeight: number;
}

// Colour palette per severity
const SEVERITY_COLORS: Record<Damage['severity'], { stroke: string; fill: string; pill: string }> = {
  minor:    { stroke: '#FBBF24', fill: 'rgba(251,191,36,0.06)',  pill: '#D97706' },
  moderate: { stroke: '#F97316', fill: 'rgba(249,115,22,0.06)',  pill: '#EA580C' },
  severe:   { stroke: '#EF4444', fill: 'rgba(239,68,68,0.06)',   pill: '#DC2626' },
};

export default function DamageOverlay({
  damages,
  containerWidth,
  containerHeight,
}: DamageOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || containerWidth <= 0 || containerHeight <= 0 || damages.length === 0) return;

    canvas.width  = containerWidth;
    canvas.height = containerHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, containerWidth, containerHeight);

    const fontSize = Math.max(10, Math.min(12, containerWidth / 50));

    damages.forEach((dmg) => {
      const colors = SEVERITY_COLORS[dmg.severity] ?? SEVERITY_COLORS.minor;
      const { boundingBox } = dmg;

      const px = boundingBox.x      * containerWidth;
      const py = boundingBox.y      * containerHeight;
      const pw = boundingBox.width  * containerWidth;
      const ph = boundingBox.height * containerHeight;

      // ── Box ────────────────────────────────────────────────────────────
      ctx.save();
      ctx.shadowColor = colors.stroke;
      ctx.shadowBlur  = 8;
      ctx.strokeStyle = colors.stroke;
      ctx.lineWidth   = 1.5;
      ctx.setLineDash([4, 3]); // dashed — distinguishes from item box
      ctx.strokeRect(px, py, pw, ph);
      ctx.restore();

      // ── Fill ───────────────────────────────────────────────────────────
      ctx.fillStyle = colors.fill;
      ctx.fillRect(px, py, pw, ph);

      // ── Label pill ──────────────────────────────────────────────────────
      const text    = `${dmg.type}  ${dmg.severity}`;
      ctx.font      = `500 ${fontSize}px Inter, system-ui, sans-serif`;
      const metrics = ctx.measureText(text);
      const pillW   = metrics.width + 16;
      const pillH   = fontSize + 8;
      const pillX   = Math.min(px, containerWidth - pillW - 2);
      const pillY   = Math.max(2, py - pillH - 4);

      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur  = 4;
      ctx.fillStyle   = colors.pill;
      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(pillX, pillY, pillW, pillH, 3);
      } else {
        ctx.rect(pillX, pillY, pillW, pillH);
      }
      ctx.fill();
      ctx.restore();

      ctx.fillStyle    = '#ffffff';
      ctx.font         = `500 ${fontSize}px Inter, system-ui, sans-serif`;
      ctx.textBaseline = 'middle';
      ctx.fillText(text, pillX + 8, pillY + pillH / 2);

      // ── Corner accents ─────────────────────────────────────────────────
      const cornerLen = Math.min(10, pw * 0.15, ph * 0.15);

      ctx.save();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth   = 1.5;
      ctx.setLineDash([]);
      ctx.shadowColor = colors.stroke;
      ctx.shadowBlur  = 4;

      const corners: [number, number, number, number][] = [
        [px,      py,      1,  1],
        [px + pw, py,     -1,  1],
        [px,      py + ph, 1, -1],
        [px + pw, py + ph,-1, -1],
      ];
      corners.forEach(([cx, cy, dx, dy]) => {
        ctx.beginPath();
        ctx.moveTo(cx + dx * cornerLen, cy);
        ctx.lineTo(cx, cy);
        ctx.lineTo(cx, cy + dy * cornerLen);
        ctx.stroke();
      });
      ctx.restore();
    });
  }, [damages, containerWidth, containerHeight]);

  return (
    <motion.canvas
      ref={canvasRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35, ease: 'easeOut', delay: 0.15 }}
      className="absolute inset-0 pointer-events-none z-20"
      style={{ width: containerWidth, height: containerHeight }}
      aria-hidden="true"
    />
  );
}
