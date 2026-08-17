// validate.js - runs templates.js against section 4-6 of system-prompt.md.
//   node validate.js
// ponytail: one file, no test framework. It exits non-zero and names the slot.

import { TEMPLATES } from './src/templates.js';
import { FORMATS, REF, scaleY, mapY, sizeOfFormat } from './src/format.js';

// Ranges are written for the reference format and scaled for the others,
// so a story is checked against a story-sized safe area, not a post one.
let FMT = REF, K = 1, SAFE = { x: [70, 1010], y: [60, 1290] };
const setFormat = (f) => {
  FMT = f || REF;
  K = scaleY(FMT);
  const [, ph] = sizeOfFormat(FMT);
  SAFE = { x: [70, 1010], y: [Math.round(mapY(FMT, 60)), Math.round(mapY(FMT, 1290))] };
  SAFE.page = ph;
};
const FONT_SIZE = {
  caveat: [30, 220], special_elite: [16, 130], kalam: [24, 80], kalam_bold: [24, 80],
};
const TAPE = ['pink', 'sage', 'mustard', 'sky', 'lilac'];
const ACCENTS = ['star', 'sparkle', 'heart', 'paper_plane', 'dashed_trail',
  'cloud', 'sun', 'music_notes', 'arrow', 'coffee_ring', 'flower', 'leaf',
  'butterfly', 'snowflake', 'wave', 'moon'];
const PAPERS = ['ruled', 'kraft', 'plain', 'grid', 'dot'];
const TINTS = ['cream', 'blush', 'sage', 'sky', 'butter', 'lilac', 'charcoal', 'ink'];
const SHAPES = ['rect', 'arch', 'circle'];
const STYLES = ['polaroid', 'bare', 'full'];
// frame geometry allowed per slide type
const FRAME_RANGE = {
  photo:   { w: [700, 800], h: [860, 940], rot: [-4, 4], n: [1, 1] },
  duo:     { w: [440, 500], h: [600, 660], rot: [-7, 7], n: [2, 2] },
  collage: { w: [260, 560], h: [300, 680], rot: [-12, 12], n: [2, 4] },
  feature: { w: [380, 700], h: [420, 940], rot: [-12, 12], n: [1, 1] },
  full:    { w: [1080, 1080], h: [1350, 1350], rot: [0, 0], n: [1, 1] },
};
const ART = ['f-rose', 'f-peony', 'f-tulip', 'f-anemone', 'f-poppy', 'f-cornflower',
  'f-clover', 'f-bluebell', 'f-fern', 'f-lavender',
  'm-taj-mahal', 'm-colosseum', 'm-venice', 'm-bridge', 'm-acropolis', 'm-eiffel'];
const EPHEMERA = { luggage_tag: ['code', 'line'], postmark: ['code', 'date'], paper_slip: ['line'], airmail_stamp: [] };
// section 6 copy caps, keyed by the slot_id suffix the templates use
const ROLE_CAP = {
  'title-1': 9, 'title-2': 9, 'sub': 26, 'quote': 38, 'stats': 32,
  'cap': 26, 'cap-a': 10, 'cap-b': 10, 'slip': 26, 'tag-line': 12, 'date': 12,
  'big': 6, 'side-1': 15, 'side-2': 15, 'keep': 22, 'foot': 32, 'note': 28,
  'head': 28, 'code': 3, 'tag-code': 3, 'mark-code': 3, 'mark-date': 12,
};

let fails = 0;
const bad = (where, msg) => { fails++; console.error(`  x ${where}: ${msg}`); };
const inRange = (v, [lo, hi]) => typeof v === 'number' && v >= lo && v <= hi;

function checkText(slot, where, ids, { placed = false, ephemeral = false } = {}) {
  if (!slot) return;
  const at = `${where} "${slot.slot_id}"`;
  if (ids.has(slot.slot_id)) bad(at, 'duplicate slot_id');
  ids.add(slot.slot_id);

  const range = FONT_SIZE[slot.font];
  if (!range) bad(at, `unknown font ${slot.font}`);
  else if (!inRange(slot.size, ephemeral ? [16, 34] : range)) bad(at, `size ${slot.size} out of range`);
  if (ephemeral && slot.font !== 'special_elite') bad(at, 'ephemera slots must be special_elite');
  if (!inRange(slot.rotation || 0, [-12, 12])) bad(at, `rotation ${slot.rotation} out of range`);

  const [x, y] = slot.center;
  if (placed) {
    if (x !== 0 || y !== 0) bad(at, 'placed slots must use center [0,0]');
  } else if (!inRange(x, SAFE.x) || !inRange(y, SAFE.y)) {
    bad(at, `center ${x},${y} outside safe area`);
  }

  const cap = ROLE_CAP[slot.slot_id.replace(/^[a-z]\d*-/, '')];
  if (cap && slot.max_chars > cap) bad(at, `max_chars ${slot.max_chars} exceeds role cap ${cap}`);
  if (slot.text.length > slot.max_chars) bad(at, `default "${slot.text}" is ${slot.text.length} > max_chars ${slot.max_chars}`);

  if (/[^\x20-\x7e]/.test(slot.text)) bad(at, 'non-ASCII in default text');
  if (/[!—‘’“”…]/.test(slot.text)) bad(at, 'banned punctuation (! em dash curly quote ellipsis)');
  if (/^[a-z]\d*-title-/.test(slot.slot_id) && !/^[a-z ]*$/.test(slot.text)) {
    bad(at, 'title lines must be letters and spaces only');
  }
  if (slot.transform !== 'upper' && slot.text !== slot.text.toLowerCase()) bad(at, 'default text must be lowercase');
}

function checkFrame(f, where, ids, type) {
  const R0 = FRAME_RANGE[type] || FRAME_RANGE.photo;
  const scaled = (r) => [Math.floor(r[0] * K) - 1, Math.ceil(r[1] * K) + 1];
  const R = type === 'full'
    ? { w: [1080, 1080], h: [SAFE.page, SAFE.page], rot: R0.rot }
    : { w: R0.w, h: scaled(R0.h), rot: R0.rot };
  if (!inRange(f.photo_w, R.w)) bad(where, `photo_w ${f.photo_w} out of range ${R.w}`);
  if (!inRange(f.photo_h, R.h)) bad(where, `photo_h ${f.photo_h} out of range ${R.h}`);
  if (!inRange(f.rotation, R.rot)) bad(where, `rotation ${f.rotation} out of range`);
  if (type === 'photo') {
    const wy = [Math.floor(mapY(FMT, 640)) - 2, Math.ceil(mapY(FMT, 660)) + 2];
    if (!inRange(f.center[0], [540, 565]) || !inRange(f.center[1], wy)) {
      bad(where, `center ${f.center} outside the single-polaroid window`);
    }
  }
  if (f.shape && !SHAPES.includes(f.shape)) bad(where, `bad shape ${f.shape}`);
  if (f.style && !STYLES.includes(f.style)) bad(where, `bad frame style ${f.style}`);
  if (type !== 'full' && (!inRange(f.center[0], SAFE.x) || !inRange(f.center[1], SAFE.y))) {
    bad(where, `frame center ${f.center} outside safe area`);
  }
  if (!['tape', 'photo_corners', 'none'].includes(f.mount)) bad(where, `bad mount ${f.mount}`);
  if (f.mount === 'tape') {
    if (!f.tape_colors.length || f.tape_colors.length > 2) bad(where, 'tape needs 1-2 colours');
    f.tape_colors.forEach((c) => { if (!TAPE.includes(c)) bad(where, `unknown tape colour ${c}`); });
  }
  checkText(f.caption, where, ids, { placed: true });
}

function checkSlide(slide, i, ids, seen) {
  const where = `slide ${i + 1} (${slide.type})`;

  (slide.texts || []).forEach((t) => checkText(t, where, ids));

  const frames = slide.frame ? [slide.frame] : (slide.frames || []);
  frames.forEach((f) => {
    checkFrame(f, `${where} photo ${f.photo_index}`, ids, slide.type);
    if (seen.has(f.photo_index)) bad(where, `photo_index ${f.photo_index} used twice`);
    seen.add(f.photo_index);
  });
  if (slide.type === 'duo') {
    if (frames.length !== 2) bad(where, 'a duo needs exactly two frames');
    else if (Math.sign(frames[0].rotation) === Math.sign(frames[1].rotation)) {
      bad(where, 'duo rotations must have opposite signs');
    }
  }
  const R = FRAME_RANGE[slide.type];
  if (R && (frames.length < R.n[0] || frames.length > R.n[1])) {
    bad(where, `${slide.type} needs ${R.n[0]}-${R.n[1]} frames, has ${frames.length}`);
  }

  if (slide.keepsake) {
    const k = slide.keepsake;
    if (!inRange(k.size, [260, 300])) bad(where, `keepsake size ${k.size} out of range`);
    if (!inRange(k.rotation, [-6, 6])) bad(where, `keepsake rotation ${k.rotation} out of range`);
    if (!inRange(k.center[0], SAFE.x) || !inRange(k.center[1], SAFE.y)) bad(where, 'keepsake center outside safe area');
    checkText(k.caption, where, ids, { placed: true });
  }

  const eph = slide.ephemera || [];
  if (eph.length > 2) bad(where, `${eph.length} ephemera, max 2`);
  eph.forEach((e) => {
    const keys = EPHEMERA[e.type];
    if (!keys) return bad(where, `unknown ephemera ${e.type}`);
    if (!inRange(e.rotation, [-20, 20])) bad(where, `ephemera rotation ${e.rotation} out of range`);
    if (!inRange(e.center[0], SAFE.x) || !inRange(e.center[1], SAFE.y)) bad(where, `${e.type} center outside safe area`);
    keys.forEach((k) => {
      if (!e[k]) return bad(where, `${e.type} missing "${k}" slot`);
      checkText(e[k], where, ids, { placed: true, ephemeral: true });
    });
  });

  const acc = slide.accents || [];
  const accMax = slide.type === 'cover' || slide.type === 'closing' ? 6 : 4;
  if (acc.length > accMax) bad(where, `${acc.length} accents, max ${accMax}`);
  acc.forEach((a) => {
    if (!ACCENTS.includes(a.type)) bad(where, `unknown accent ${a.type}`);
    if (!inRange(a.scale, [0.5, 2.5])) bad(where, `accent scale ${a.scale} out of range`);
    if (!inRange(a.rotation, [-20, 20])) bad(where, `accent rotation ${a.rotation} out of range`);
    if (!inRange(a.center[0], SAFE.x) || !inRange(a.center[1], SAFE.y)) bad(where, `accent ${a.type} outside safe area`);
  });

  const stk = slide.stickers || [];
  const stkMax = slide.type === 'cover' || slide.type === 'closing' ? 2 : 1;
  if (stk.length > stkMax) bad(where, `${stk.length} stickers, max ${stkMax}`);
  stk.forEach((k) => {
    if (!ART.includes(k.art)) bad(where, `unknown art ${k.art}`);
    if (k.style === 'cutout' && k.art.startsWith('m-')) bad(where, `${k.art} is a photo, needs style stamp`);
    if (!['cutout', 'stamp'].includes(k.style)) bad(where, `bad sticker style ${k.style}`);
    if (!inRange(k.scale, [0.5, 2])) bad(where, `sticker scale ${k.scale} out of range`);
    if (!inRange(k.rotation, [-20, 20])) bad(where, `sticker rotation ${k.rotation} out of range`);
    if (!inRange(k.center[0], SAFE.x) || !inRange(k.center[1], SAFE.y)) bad(where, `sticker ${k.art} outside safe area`);
  });

  if (!slide.paper || !PAPERS.includes(slide.paper.style)) bad(where, 'bad paper style');
  if (slide.paper.tint && !TINTS.includes(slide.paper.tint)) bad(where, `bad tint ${slide.paper.tint}`);
  if (!inRange(slide.paper.stains, [0, 2])) bad(where, 'stains must be 0-2');
}

const ids = new Set();
TEMPLATES.forEach((t) => {
  const m = t.template;
  setFormat(m.format);
  console.log(`\n${m.id}  [${m.format || REF}]`);
  ids.clear();
  const seen = new Set();

  if (m.id.length > 40 || !/^[a-z0-9-]+$/.test(m.id)) bad(m.id, 'id must be kebab-case, <= 40');
  if (m.name.length > 32) bad(m.id, 'name > 32');
  if (m.tagline.length > 60) bad(m.id, 'tagline > 60');
  if (m.preview_brief.length > 160) bad(m.id, 'preview_brief > 160');
  if (m.category.length < 1 || m.category.length > 3) bad(m.id, 'category needs 1-3 tags');
  if (m.occasions.length < 1 || m.occasions.length > 4) bad(m.id, 'occasions needs 1-4');
  if (!inRange(m.photo_count, [3, 9])) bad(m.id, 'photo_count must be 3-9');
  if (m.format && !FORMATS[m.format]) bad(m.id, `unknown format ${m.format}`);
  t.slides.forEach((s, i) => {
    if ((s.format || REF) !== (m.format || REF)) {
      bad(m.id, `slide ${i + 1}: format ${s.format} does not match the template`);
    }
  });

  const budget = Math.min(m.photo_count + 2, 10);
  if (t.slides.length > budget) bad(m.id, `${t.slides.length} slides > budget ${budget}`);
  if (t.slides[0].type !== 'cover') bad(m.id, 'first slide must be the cover');
  if (t.slides[t.slides.length - 1].type !== 'closing') bad(m.id, 'last slide must be the closing');
  if (t.slides.filter((s) => s.type === 'cover').length !== 1) bad(m.id, 'need exactly one cover');
  if (t.slides.filter((s) => s.type === 'duo').length > 1) bad(m.id, 'at most one duo');
  const KINDS = ['cover', 'photo', 'duo', 'collage', 'feature', 'full', 'closing'];
  t.slides.forEach((s, i) => {
    if (!KINDS.includes(s.type)) bad(m.id, `slide ${i + 1}: unknown type ${s.type}`);
  });

  t.slides.forEach((s, i) => checkSlide(s, i, ids, seen));

  for (let n = 1; n <= m.photo_count; n++) {
    if (!seen.has(n)) bad(m.id, `photo_index ${n} never used`);
  }
  if (seen.size !== m.photo_count) bad(m.id, `${seen.size} photo appearances, expected ${m.photo_count}`);
});

console.log(fails ? `\n${fails} problem(s).` : `\nAll ${TEMPLATES.length} templates valid.`);
process.exit(fails ? 1 : 0);
