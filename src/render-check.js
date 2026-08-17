// Renders every page of every template at full size and reports anything that
// throws or comes out the wrong size. Open /render-check.html with the dev
// server running. ponytail: a page, not a test framework.
import { TEMPLATES } from './templates.js';
import { paint, fontsReady } from './engine.js';
import { artReady } from './art.js';
import { sizeOfFormat, REF } from './format.js';

Promise.all([fontsReady(), artReady()]).then(() => {
  const lines = [];
  let bad = 0;

  for (const t of TEMPLATES) {
    for (let i = 0; i < t.slides.length; i++) {
      const canvas = document.createElement('canvas');
      const [wantW, wantH] = sizeOfFormat(t.template.format || REF);
      let note;
      try {
        paint(canvas, t.slides[i], { index: i, total: t.slides.length }, 1);
        const url = canvas.toDataURL('image/jpeg', 0.92);
        const kb = Math.round((url.length * 0.75) / 1024);
        const ok = canvas.width === wantW && canvas.height === wantH && kb > 20;
        if (!ok) bad++;
        note = `${ok ? 'ok  ' : 'FAIL'} ${canvas.width}x${canvas.height} ${kb}kb`;
      } catch (e) {
        bad++;
        note = `FAIL threw ${e.message}`;
      }
      lines.push(`${note}  ${t.template.id} p${i + 1} ${t.slides[i].type}`);
    }
  }

  lines.push(bad
    ? `\n${bad} FAILED`
    : `\nall ${lines.length} pages render at their format's size`);
  document.getElementById('out').textContent = lines.join('\n');
});
