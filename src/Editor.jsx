import { useEffect, useRef, useState } from 'react';
import Page from './Page.jsx';
import { editableSlots, toBlob } from './engine.js';

const LABELS = {
  'the': 'opening word', 'title-1': 'title, line 1', 'title-2': 'title, line 2',
  'sub': 'subtitle', 'stats': 'small line', 'quote': 'quote', 'slip': 'paper slip',
  'cap': 'caption', 'cap-a': 'left caption', 'cap-b': 'right caption',
  'note': 'note', 'head': 'heading', 'big': 'big word',
  'side-1': 'side note, line 1', 'side-2': 'side note, line 2', 'foot': 'footer',
  'keep': 'keepsake caption', 'tag-code': 'three-letter code', 'tag-line': 'tag line',
  'mark-code': 'three-letter code', 'mark-date': 'date',
  'code': 'three-letter code', 'date': 'date', 'label': 'label',
};
const labelFor = (id) => {
  const key = id.replace(/^[a-z]\d*-/, '');
  return LABELS[key] || key.replace(/-/g, ' ');
};

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => { URL.revokeObjectURL(img.src); reject(new Error('bad image')); };
    img.src = URL.createObjectURL(file);   // browsers apply EXIF orientation here
  });
}

function save(blob, filename) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

export default function Editor({ tpl, onBack }) {
  const [photos, setPhotos] = useState({});
  const [values, setValues] = useState({});
  const [page, setPage] = useState(0);
  const [busy, setBusy] = useState('');

  const slides = tpl.slides;
  const count = tpl.template.photo_count;
  const slots = editableSlots(slides[page]);

  // Object URLs outlive React state, so keep a live handle for cleanup and
  // for the bulk-fill loop, which runs faster than re-renders arrive.
  const live = useRef(photos);
  live.current = photos;
  useEffect(() => () => {
    Object.values(live.current).forEach((img) => URL.revokeObjectURL(img.src));
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.target.tagName === 'INPUT') return;
      if (e.key === 'ArrowLeft') setPage((p) => Math.max(0, p - 1));
      if (e.key === 'ArrowRight') setPage((p) => Math.min(slides.length - 1, p + 1));
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [slides.length]);

  async function setPhoto(n, file) {
    if (!file || !file.type.startsWith('image/')) return;
    const img = await loadImage(file);
    const prev = live.current[n];
    if (prev) URL.revokeObjectURL(prev.src);
    setPhotos((p) => ({ ...p, [n]: img }));
  }

  async function addMany(files) {
    let n = 1;
    for (const file of files) {
      while (n <= count && live.current[n]) n++;   // fill the gaps, in order
      if (n > count) break;
      await setPhoto(n, file);
      n++;
    }
  }

  async function download(indices) {
    for (let k = 0; k < indices.length; k++) {
      const i = indices[k];
      setBusy(`Rendering ${k + 1} / ${indices.length}`);
      const blob = await toBlob(slides[i], { photos, values, index: i, total: slides.length });
      save(blob, `${tpl.template.id}-${String(i + 1).padStart(2, '0')}.jpg`);
      // ponytail: a short gap keeps Chrome from swallowing the later downloads.
      await new Promise((r) => setTimeout(r, 250));
    }
    setBusy('');
  }

  return (
    <main className="view">

      <div className="editor-bar">
        <button className="btn btn-ghost" onClick={onBack}>&larr; the shelf</button>
        <div className="grow">
          <h2>{tpl.template.name}</h2>
          <p className="sub">
            {tpl.template.tone} / {count} photos / {slides.length} pages
          </p>
        </div>
        <button
          className="btn btn-primary"
          disabled={!!busy}
          onClick={() => download(slides.map((_, i) => i))}
        >
          {busy || 'Download all pages'}
        </button>
      </div>

      <div className="editor-grid">

        <aside className="panel">
          <h3>Photos</h3>
          <p className="hint">This template takes exactly {count}.</p>

          <label className="btn btn-ghost btn-block file">
            Add photos
            <input type="file" accept="image/*" multiple
              onChange={(e) => { addMany([...e.target.files]); e.target.value = ''; }} />
          </label>

          <ul className="slots">
            {Array.from({ length: count }, (_, k) => k + 1).map((n) => (
              <li key={n}>
                <label className={`slot${photos[n] ? ' filled' : ''}`}>
                  {photos[n] && <img src={photos[n].src} alt="" />}
                  <span className="n">{n}</span>
                  <input type="file" accept="image/*" aria-label={`Photo ${n}`}
                    onChange={(e) => setPhoto(n, e.target.files[0])} />
                </label>
              </li>
            ))}
          </ul>
        </aside>

        <section className="stage">
          <Page
            id="page"
            slide={slides[page]}
            index={page}
            total={slides.length}
            photos={photos}
            values={values}
            scale={0.5}
            aria-label={`Page ${page + 1} preview`}
          />

          <div className="pager">
            <button className="pgbtn" aria-label="Previous page"
              onClick={() => setPage((p) => Math.max(0, p - 1))}>&larr;</button>

            <div className="thumbs">
              {slides.map((s, i) => (
                <button key={i} type="button" className="thumb"
                  aria-label={`Page ${i + 1}`} aria-current={i === page}
                  onClick={() => setPage(i)}>
                  <Page slide={s} index={i} total={slides.length}
                    photos={photos} values={values} scale={0.09} />
                </button>
              ))}
            </div>

            <button className="pgbtn" aria-label="Next page"
              onClick={() => setPage((p) => Math.min(slides.length - 1, p + 1))}>&rarr;</button>
          </div>

          <button className="btn btn-ghost" disabled={!!busy}
            onClick={() => download([page])}>
            Download this page
          </button>
        </section>

        <aside className="panel words">
          <h3>Words</h3>
          <p className="hint">This page only. Clear a line to leave it off.</p>

          {slots.length === 0
            ? <p className="empty">nothing to change on this one.</p>
            : slots.map((slot) => {
              const value = slot.slot_id in values ? values[slot.slot_id] : slot.text;
              return (
                <div className="field" key={slot.slot_id}>
                  <label htmlFor={`f-${slot.slot_id}`}>
                    <span>{labelFor(slot.slot_id)}</span>
                    <span className="count">{value.length}/{slot.max_chars}</span>
                  </label>
                  <input
                    id={`f-${slot.slot_id}`}
                    type="text"
                    maxLength={slot.max_chars}
                    value={value}
                    // maxLength caps typing and pasting; slice keeps the cap
                    // true for any other way the value arrives.
                    onChange={(e) => setValues((v) => ({
                      ...v, [slot.slot_id]: e.target.value.slice(0, slot.max_chars),
                    }))}
                  />
                </div>
              );
            })}
        </aside>

      </div>
    </main>
  );
}
