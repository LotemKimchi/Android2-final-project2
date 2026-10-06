import { useEffect, useRef, useState } from 'react';

const WIDTH = 800;
const HEIGHT = 500;
const MAX_UNDO_STEPS = 20;
const COLORS = ['#1f2430', '#4f46e5', '#dc2626', '#16a34a', '#f59e0b'];

/** Freehand drawing on HTML5 <canvas> (req #12.ii). Reports a PNG blob via onChange. */
export function DoodleCanvas({ onChange }) {
  const canvasRef = useRef(null);
  const isDrawingRef = useRef(false);
  const historyRef = useRef([]);
  const [color, setColor] = useState(COLORS[0]);
  const [brushSize, setBrushSize] = useState(6);
  const [canUndo, setCanUndo] = useState(false);

  const context = () => canvasRef.current.getContext('2d');

  const paintBackground = () => {
    const ctx = context();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
  };

  useEffect(paintBackground, []);

  /** Converts pointer coordinates (CSS pixels) into canvas pixels. */
  const pointFrom = (event) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) * WIDTH) / rect.width,
      y: ((event.clientY - rect.top) * HEIGHT) / rect.height,
    };
  };

  const emitChange = (isBlank) => {
    if (isBlank) onChange?.(null);
    else canvasRef.current.toBlob((blob) => onChange?.(blob), 'image/png');
  };

  const handlePointerDown = (event) => {
    event.preventDefault();
    canvasRef.current.setPointerCapture(event.pointerId);

    historyRef.current.push(context().getImageData(0, 0, WIDTH, HEIGHT));
    if (historyRef.current.length > MAX_UNDO_STEPS) historyRef.current.shift();
    setCanUndo(true);

    const ctx = context();
    const { x, y } = pointFrom(event);
    ctx.strokeStyle = color;
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y);
    ctx.stroke();
    isDrawingRef.current = true;
  };

  const handlePointerMove = (event) => {
    if (!isDrawingRef.current) return;
    const { x, y } = pointFrom(event);
    context().lineTo(x, y);
    context().stroke();
  };

  const finishStroke = () => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    emitChange(false);
  };

  const undo = () => {
    const previous = historyRef.current.pop();
    if (previous) context().putImageData(previous, 0, 0);
    const isBlank = historyRef.current.length === 0;
    setCanUndo(!isBlank);
    emitChange(isBlank);
  };

  const clear = () => {
    paintBackground();
    historyRef.current = [];
    setCanUndo(false);
    emitChange(true);
  };

  return (
    <div className="doodle">
      <canvas
        ref={canvasRef}
        width={WIDTH}
        height={HEIGHT}
        aria-label="Doodle canvas"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishStroke}
        onPointerCancel={finishStroke}
      />
      <div className="row">
        {COLORS.map((swatch) => (
          <button
            key={swatch}
            type="button"
            className={`doodle__swatch${swatch === color ? ' is-active' : ''}`}
            style={{ background: swatch }}
            onClick={() => setColor(swatch)}
            aria-label={`Use color ${swatch}`}
          />
        ))}
        <label className="small">
          Brush{' '}
          <input
            type="range"
            min="2"
            max="30"
            value={brushSize}
            onChange={(event) => setBrushSize(Number(event.target.value))}
          />
        </label>
        <button type="button" className="btn btn--ghost" onClick={undo} disabled={!canUndo}>
          Undo
        </button>
        <button type="button" className="btn btn--ghost" onClick={clear}>
          Clear
        </button>
      </div>
    </div>
  );
}
