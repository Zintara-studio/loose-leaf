import { useEffect, useRef } from 'react';
import { paint } from './engine.js';

// One canvas, painted by the engine. Hero, gallery card, thumbnail and the
// main preview are all this component - only `scale` differs.
export default function Page({
  slide, index = 0, total = 1, photos, values, scale = 0.5, ...rest
}) {
  const ref = useRef(null);

  useEffect(() => {
    paint(ref.current, slide, { photos, values, index, total }, scale);
  }, [slide, photos, values, index, total, scale]);

  return <canvas ref={ref} {...rest} />;
}
