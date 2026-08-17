import { useEffect, useRef, useState } from 'react';
import { paint, sizeOf } from './engine.js';

// One canvas, painted by the engine. Hero, gallery card, thumbnail and the
// main preview are all this component - only `scale` differs.
//
// Gallery cards paint lazily: seventy-odd covers rendered on load is a real
// stall on a phone, and most of them are far below the fold. `eager` opts
// out for the preview and the hero, which must be there immediately.
export default function Page({
  slide, index = 0, total = 1, photos, values, edits, scale = 0.5,
  eager = false, ...rest
}) {
  const ref = useRef(null);
  const [near, setNear] = useState(eager);

  // Reserve the right box before painting, or every lazy canvas sits at the
  // default 300x150 and the grid reflows as they fill in.
  useEffect(() => {
    const c = ref.current;
    const [w, h] = sizeOf(slide);
    if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
  }, [slide]);

  useEffect(() => {
    if (eager || near || typeof IntersectionObserver === 'undefined') {
      if (!near) setNear(true);
      return undefined;
    }
    const io = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) setNear(true); },
      { rootMargin: '600px' },     // start a screen or so before it is needed
    );
    io.observe(ref.current);
    return () => io.disconnect();
  }, [eager, near]);

  useEffect(() => {
    if (!near) return;
    paint(ref.current, slide, { photos, values, edits, index, total }, scale);
  }, [near, slide, photos, values, edits, index, total, scale]);

  return <canvas ref={ref} {...rest} />;
}
