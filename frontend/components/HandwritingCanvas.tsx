'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import getStroke from 'perfect-freehand';

interface Point {
  x: number;
  y: number;
  pressure: number;
}

interface Stroke {
  id: string;
  points: Point[];
  color: string;
  size: number;
}

interface HandwritingCanvasProps {
  width?: number;
  height?: number;
  className?: string;
  onSave?: (strokes: Stroke[]) => void;
  initialStrokes?: Stroke[];
}

/**
 * Handwriting Canvas Component
 * Supports Apple Pencil and stylus input with pressure sensitivity
 */
export function HandwritingCanvas({
  width = 800,
  height = 600,
  className = '',
  onSave,
  initialStrokes = [],
}: HandwritingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [strokes, setStrokes] = useState<Stroke[]>(initialStrokes);
  const [currentPoints, setCurrentPoints] = useState<Point[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [penColor, setPenColor] = useState('#000000');
  const [penSize, setPenSize] = useState(3);

  // Render a single stroke
  const renderStroke = useCallback(
    (ctx: CanvasRenderingContext2D, stroke: Stroke) => {
      if (stroke.points.length < 2) return;

      const outlinePoints = getStroke(stroke.points, {
        size: stroke.size,
        thinning: 0.6,
        smoothing: 0.5,
        streamline: 0.5,
        easing: (t) => t,
        start: {
          taper: 0,
          cap: true,
        },
        end: {
          taper: 0,
          cap: true,
        },
      });

      ctx.fillStyle = stroke.color;
      ctx.beginPath();

      if (outlinePoints.length > 0) {
        ctx.moveTo(outlinePoints[0][0], outlinePoints[0][1]);

        for (let i = 1; i < outlinePoints.length; i++) {
          ctx.lineTo(outlinePoints[i][0], outlinePoints[i][1]);
        }

        ctx.closePath();
        ctx.fill();
      }
    },
    []
  );

  // Render all strokes
  const renderAllStrokes = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Render all completed strokes
    strokes.forEach((stroke) => renderStroke(ctx, stroke));

    // Render current stroke being drawn
    if (currentPoints.length > 0) {
      renderStroke(ctx, {
        id: 'current',
        points: currentPoints,
        color: penColor,
        size: penSize,
      });
    }
  }, [strokes, currentPoints, penColor, penSize, renderStroke]);

  // Handle pointer down
  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      // Only allow pen or touch input
      if (e.pointerType === 'mouse') return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const pressure = e.pressure || 0.5;

      setIsDrawing(true);
      setCurrentPoints([{ x, y, pressure }]);
    },
    []
  );

  // Handle pointer move
  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!isDrawing) return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const pressure = e.pressure || 0.5;

      setCurrentPoints((prev) => [...prev, { x, y, pressure }]);
    },
    [isDrawing]
  );

  // Handle pointer up
  const handlePointerUp = useCallback(() => {
    if (!isDrawing || currentPoints.length === 0) return;

    // Save the stroke
    const newStroke: Stroke = {
      id: `stroke-${Date.now()}`,
      points: currentPoints,
      color: penColor,
      size: penSize,
    };

    setStrokes((prev) => [...prev, newStroke]);
    setCurrentPoints([]);
    setIsDrawing(false);
  }, [isDrawing, currentPoints, penColor, penSize]);

  // Clear canvas
  const handleClear = useCallback(() => {
    setStrokes([]);
    setCurrentPoints([]);
  }, []);

  // Undo last stroke
  const handleUndo = useCallback(() => {
    setStrokes((prev) => prev.slice(0, -1));
  }, []);

  // Save strokes
  const handleSave = useCallback(() => {
    onSave?.(strokes);
  }, [strokes, onSave]);

  // Render canvas whenever strokes change
  useEffect(() => {
    renderAllStrokes();
  }, [renderAllStrokes]);

  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      {/* Toolbar */}
      <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
        {/* Color Picker */}
        <div className="flex items-center gap-2">
          <label htmlFor="pen-color" className="text-sm font-medium">
            색상:
          </label>
          <input
            id="pen-color"
            type="color"
            value={penColor}
            onChange={(e) => setPenColor(e.target.value)}
            className="w-10 h-10 rounded cursor-pointer"
          />
        </div>

        {/* Size Slider */}
        <div className="flex items-center gap-2">
          <label htmlFor="pen-size" className="text-sm font-medium">
            두께:
          </label>
          <input
            id="pen-size"
            type="range"
            min="1"
            max="10"
            step="0.5"
            value={penSize}
            onChange={(e) => setPenSize(Number(e.target.value))}
            className="w-32"
          />
          <span className="text-sm text-muted-foreground">{penSize}</span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={handleUndo}
            disabled={strokes.length === 0}
            className="px-3 py-2 text-sm font-medium bg-background border rounded hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
          >
            실행 취소
          </button>
          <button
            onClick={handleClear}
            disabled={strokes.length === 0}
            className="px-3 py-2 text-sm font-medium bg-background border rounded hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
          >
            전체 지우기
          </button>
          {onSave && (
            <button
              onClick={handleSave}
              disabled={strokes.length === 0}
              className="px-3 py-2 text-sm font-medium bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              저장
            </button>
          )}
        </div>
      </div>

      {/* Canvas */}
      <div className="relative border rounded-lg overflow-hidden bg-white">
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          className="touch-none cursor-crosshair"
          style={{ touchAction: 'none' }}
        />

        {/* Hint */}
        {strokes.length === 0 && !isDrawing && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-muted-foreground text-sm">
              터치하거나 Apple Pencil로 글씨를 써보세요
            </p>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="text-sm text-muted-foreground">
        총 획: {strokes.length}
      </div>
    </div>
  );
}
