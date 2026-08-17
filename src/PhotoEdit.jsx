import { useEffect, useRef } from 'react';
import { previewPhoto, FILTER_NAMES } from './engine.js';

export const DEFAULT_EDIT = { zoom: 1, ox: 0, oy: 0, rotate: 0, filter: 'none' };

// The preview is the same crop maths the page uses, at the frame's aspect,
// so what you drag here is exactly what gets rendered.
export default function PhotoEdit({ n, img, aspect, page, value, onChange, onDone }) {
  const ref = useRef(null);
  const drag = useRef(null);
  const edit = { ...DEFAULT_EDIT, ...value };

  const w = 224;
  const h = Math.round(w / aspect);

  useEffect(() => {
    const c = ref.current;
    c.width = w * 2;            // 2x so the preview is not soft
    c.height = h * 2;
    previewPhoto(c, img, edit);
  }, [img, edit.zoom, edit.ox, edit.oy, edit.rotate, edit.filter, w, h]);

  const set = (patch) => onChange({ ...edit, ...patch });

  function onPointerDown(e) {
    if (edit.zoom <= 1) return;              // nothing to pan into yet
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY, ox: edit.ox, oy: edit.oy };
  }
  function onPointerMove(e) {
    if (!drag.current) return;
    const d = drag.current;
    const clamp = (v) => Math.max(-1, Math.min(1, v));
    set({
      ox: clamp(d.ox + (e.clientX - d.x) / (w / 2)),
      oy: clamp(d.oy + (e.clientY - d.y) / (h / 2)),
    });
  }
  const endDrag = () => { drag.current = null; };

  return (
    <div className="photo-edit">
      <div className="pe-head">
        <h3>Photo {n}</h3>
        <span className="pe-page">page {page}</span>
      </div>

      <canvas
        ref={ref}
        className={`pe-canvas${edit.zoom > 1 ? ' pannable' : ''}`}
        style={{ width: w, height: h }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        aria-label={`Crop preview for photo ${n}`}
      />
      <p className="pe-tip">
        {edit.zoom > 1 ? 'drag the preview to reframe' : 'zoom in to reframe'}
      </p>

      <label className="pe-row">
        <span>zoom</span>
        <input
          type="range" min="1" max="3" step="0.02" value={edit.zoom}
          onChange={(e) => set({ zoom: +e.target.value })}
        />
        <span className="pe-val">{edit.zoom.toFixed(1)}x</span>
      </label>

      <div className="pe-row">
        <span>turn</span>
        <div className="pe-btns">
          <button type="button" onClick={() => set({ rotate: (edit.rotate + 270) % 360 })}
            aria-label="Rotate left">&#8630;</button>
          <button type="button" onClick={() => set({ rotate: (edit.rotate + 90) % 360 })}
            aria-label="Rotate right">&#8631;</button>
          <span className="pe-val">{edit.rotate}&deg;</span>
        </div>
      </div>

      <div className="pe-filters">
        {FILTER_NAMES.map((f) => (
          <button
            key={f}
            type="button"
            className={`chip chip-btn${edit.filter === f ? ' on' : ''}`}
            aria-pressed={edit.filter === f}
            onClick={() => set({ filter: f })}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="pe-actions">
        <button className="btn btn-ghost" onClick={() => onChange({ ...DEFAULT_EDIT })}>
          Reset
        </button>
        <button className="btn btn-primary" onClick={onDone}>Done</button>
      </div>
    </div>
  );
}
