import { useMemo, useState } from 'react';
import { TEMPLATES } from './templates.js';
import { FORMATS, REF } from './format.js';
import Page from './Page.jsx';

const TAPES = ['', 'sage', 'butter', 'sky', 'lilac'];

// same category, same colour, everywhere on the page
const colourOf = (c) => {
  let h = 0;
  for (let i = 0; i < c.length; i++) h = (h * 31 + c.charCodeAt(i)) % 5;
  return h;
};

export default function Gallery({ onPick }) {
  const hero = TEMPLATES[0];
  const [filter, setFilter] = useState(null);
  const [format, setFormat] = useState(null);

  // Fifty three cards is a wall without a way to narrow it.
  const categories = useMemo(() => {
    const counts = new Map();
    TEMPLATES.forEach((t) => t.template.category.forEach(
      (c) => counts.set(c, (counts.get(c) || 0) + 1),
    ));
    return [...counts].sort((a, b) => b[1] - a[1]);
  }, []);

  const formats = useMemo(() => {
    const counts = new Map();
    TEMPLATES.forEach((t) => {
      const f = t.template.format || REF;
      counts.set(f, (counts.get(f) || 0) + 1);
    });
    return [...counts];
  }, []);

  const shown = TEMPLATES.filter((t) =>
    (!filter || t.template.category.includes(filter))
    && (!format || (t.template.format || REF) === format));

  return (
    <main className="view">

      <section className="hero">
        <div>
          <p className="eyebrow">{TEMPLATES.length} templates / no account / no upload</p>
          <h1>
            pick a page,<br />fill it with{' '}
            <span className="swap">
              your week
              <svg viewBox="0 0 200 12" preserveAspectRatio="none" aria-hidden="true">
                <path d="M2 8 C 40 2, 70 11, 108 5 S 170 3, 198 7" fill="none"
                  stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
              </svg>
            </span>
          </h1>
          <p className="lede">
            Templates drawn once, by hand, then rendered at the size the post
            actually needs - 4:5 carousels, 9:16 stories, 1:1 squares. Drop in photos,
            change the words that need changing, download the set. Your photos stay
            in this tab.
          </p>
          <div className="hero-actions">
            <a className="btn btn-primary" href="#board">See the templates</a>
            <button className="btn btn-ghost" onClick={() => onPick(hero)}>
              Open the first one
            </button>
          </div>
        </div>

        <div className="hero-stage">
          <span className="tape" />
          <Page
            slide={hero.slides[0]}
            total={hero.slides.length}
            scale={0.5}
            aria-label={`Cover page of ${hero.template.name}`}
          />
          <p className="hero-caption">page one, before you touch it.</p>
        </div>
      </section>

      <section className="board" id="board">
        <div className="board-head">
          <h2>the shelf</h2>
          <p>
            Every template keeps one signature - a coffee ring, a pressed flower, a frame
            slip, a luggage tag - and stays quiet everywhere else.
          </p>

          <div className="filters" role="group" aria-label="Filter by output size">
            <button
              type="button"
              className={`chip chip-btn${format ? '' : ' on'}`}
              aria-pressed={!format}
              onClick={() => setFormat(null)}
            >
              every size
            </button>
            {formats.map(([f, n]) => (
              <button
                key={f}
                type="button"
                className={`chip chip-btn${format === f ? ' on' : ''}`}
                aria-pressed={format === f}
                onClick={() => setFormat(format === f ? null : f)}
              >
                {FORMATS[f].label} {n}
              </button>
            ))}
          </div>

          <div className="filters" role="group" aria-label="Filter by category">
            <button
              type="button"
              className={`chip chip-btn${filter ? '' : ' on'}`}
              aria-pressed={!filter}
              onClick={() => setFilter(null)}
            >
              all {shown.length === TEMPLATES.length ? TEMPLATES.length : `${shown.length} of ${TEMPLATES.length}`}
            </button>
            {categories.map(([c, n], i) => (
              <button
                key={c}
                type="button"
                className={`chip c${i % 5} chip-btn${filter === c ? ' on' : ''}`}
                aria-pressed={filter === c}
                onClick={() => setFilter(filter === c ? null : c)}
              >
                {c} {n}
              </button>
            ))}
          </div>
        </div>

        <div className="cards">
          {shown.map((t, i) => (
            <button
              key={t.template.id}
              type="button"
              className="card"
              onClick={() => onPick(t)}
            >
              <span className={`tape ${TAPES[i % TAPES.length]}`} />
              <Page slide={t.slides[0]} total={t.slides.length} scale={0.28} />
              <h3>{t.template.name}</h3>
              <p className="tagline">{t.template.tagline}</p>
              <p className="meta">
                {t.template.photo_count} photos, {t.slides.length} pages
                <span className="fmt">{FORMATS[t.template.format || REF].label}</span>
              </p>
              <span className="card-foot">
                {t.template.category.map((c) => (
                  <span className={`chip c${colourOf(c)}`} key={c}>{c}</span>
                ))}
              </span>
            </button>
          ))}
        </div>
      </section>

    </main>
  );
}
