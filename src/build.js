// build.js - compact descriptor in, section-6 JSON out.
//
// Fifty templates written as raw slots would be ten thousand lines of
// coordinates. `build` takes only the parts that actually differ - paper,
// copy, motifs, mounts - and derives the geometry inside the spec's ranges
// from a hash of the template id. Same id, same layout, every reload.
//
// ponytail: this is shorthand, not a framework. The output is plain spec
// JSON, so hand-written templates sit next to built ones in the same array.

const T = (slot_id, text, font, size, cx, cy, max_chars, o) => Object.assign({
  slot_id, text, font, size, center: [cx, cy], rotation: 0,
  max_chars, editable: true, transform: 'none',
}, o);

const CAP = (slot_id, text, font, size, max_chars, o) =>
  T(slot_id, text, font, size, 0, 0, max_chars, o);

function prng(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 15), h | 1);
    h ^= h + Math.imul(h ^ (h >>> 7), h | 61);
    return ((h ^ (h >>> 14)) >>> 0) / 4294967296;
  };
}
const W = 1080, H = 1350;
const num = (r, lo, hi) => lo + r() * (hi - lo);
const int = (r, lo, hi) => Math.round(num(r, lo, hi));
const one = (r, list) => list[Math.floor(r() * list.length) % list.length];

// Where a cover's title block sits. Four rhythms so fifty covers are not
// fifty copies of the same vertical stack.
const COVER = {
  centred: { x: 540, the: 284, t1: 402, gap: 118, sub: 106, stats: 64, quote: 1168 },
  high:    { x: 540, the: 196, t1: 306, gap: 116, sub: 102, stats: 62, quote: 1198 },
  low:     { x: 540, the: 430, t1: 546, gap: 118, sub: 104, stats: 64, quote: 1206 },
  left:    { x: 430, the: 254, t1: 368, gap: 116, sub: 102, stats: 62, quote: 1178 },
  plate:   { x: 540, the: 148, t1: 250, gap: 122, sub: 108, stats: 66, quote: 1226 },
  foot:    { x: 540, the: 690, t1: 806, gap: 120, sub: 104, stats: 64, quote: 232 },
};
const NOTE_AT = {
  under: [540, 1200, 0],
  left: [268, 1188, -4],
  right: [808, 1192, 3],
};

// Three scattered arrangements for a collage page, so a three-photo page is
// never the same three-photo page twice.
const COLLAGE = [
  [[348, 396, -6], [722, 458, 5], [524, 900, -3]],
  [[372, 372, 5], [706, 660, -4], [430, 966, 3]],
  [[534, 358, -3], [332, 776, 6], [730, 946, -5]],
];

// Each rhythm adds up to 6 or 7 uploads across 4-6 pages, and never puts the
// same recipe twice in a row.
const RHYTHMS = [
  ['polaroid', 'bleed', 'polaroid', 'offset', 'polaroid', 'corner'],
  ['bleed', 'stack', 'polaroid', 'strip'],
  ['polaroid', 'offset', 'scatter', 'bleed'],
  ['portrait', 'polaroid', 'bleed', 'stack', 'polaroid'],
  ['strip', 'polaroid', 'bleed', 'corner'],
  ['polaroid', 'corner', 'bleed', 'polaroid', 'offset', 'polaroid'],
  ['scatter', 'offset', 'bleed', 'portrait'],
  ['stack', 'bleed', 'polaroid', 'corner', 'offset'],
  ['polaroid', 'portrait', 'polaroid', 'bleed', 'stack'],
  ['bleed', 'polaroid', 'scatter', 'polaroid'],
  ['offset', 'polaroid', 'stack', 'bleed', 'portrait'],
  ['polaroid', 'strip', 'polaroid', 'corner'],
];

// Accents go in the margins: corner zones for photo pages, a wider set for
// covers and closings, which have no polaroid in the middle.
const CORNERS = [[112, 262, 198, 330], [826, 972, 198, 330],
  [112, 262, 1018, 1150], [826, 972, 1018, 1150]];
const OPEN = [[118, 236, 196, 348], [846, 968, 196, 348],
  [112, 268, 736, 892], [812, 968, 736, 892],
  [126, 262, 952, 1064], [820, 964, 952, 1064]];

const hits = ([zx1, zx2, zy1, zy2], [bx1, by1, bx2, by2]) =>
  zx1 < bx2 && zx2 > bx1 && zy1 < by2 && zy2 > by1;

// `reserved` is a list of [x1,y1,x2,y2] boxes already occupied by ephemera,
// a keepsake or the closing side note. Zones that touch one are dropped, so
// a star never lands under a luggage tag.
function accents(types, zones, r, count, reserved = []) {
  if (!types || !types.length) return [];
  const spots = zones.filter((z) => !reserved.some((b) => hits(z, b)));
  const out = [];
  for (let i = 0; i < count && spots.length; i++) {
    const [x1, x2, y1, y2] = spots.splice(Math.floor(r() * spots.length), 1)[0];
    out.push({
      type: types[i % types.length],
      center: [int(r, x1, x2), int(r, y1, y2)],
      scale: +num(r, 0.8, 1.3).toFixed(2),
      rotation: int(r, -14, 14),
    });
  }
  return out;
}

// Where the signature artwork sits. Big enough that it gets its own zones.
const ART_OPEN = [[188, 246, 950, 1030], [836, 896, 950, 1030],
  [186, 240, 776, 852], [840, 900, 776, 852]];
const ART_CORNER = [[184, 244, 288, 356], [840, 900, 288, 356],
  [184, 244, 1006, 1086], [840, 900, 1006, 1086]];

function stickers(spec, zones, r, count, reserved = []) {
  if (!spec) return [];
  const [art, style] = spec;
  const spots = zones.filter((z) => !reserved.some((b) => hits(z, b)));
  const out = [];
  for (let i = 0; i < count && spots.length; i++) {
    const [x1, x2, y1, y2] = spots.splice(Math.floor(r() * spots.length), 1)[0];
    out.push({
      art,
      center: [int(r, x1, x2), int(r, y1, y2)],
      scale: +num(r, 0.72, 1).toFixed(2),
      rotation: int(r, -12, 12),
      style,
    });
  }
  return out;
}

// Rough footprints, used only to keep accents off them.
const EPH_BOX = { slip: [180, 48], tag: [138, 74], mark: [92, 92], stamp: [88, 102] };
const ephBox = (spec, cx, cy) => {
  if (!spec) return [];
  const [w, h] = EPH_BOX[spec[0]] || [0, 0];
  return [[cx - w, cy - h, cx + w, cy + h]];
};

const artBox = (list) => list.map((k) => {
  const w = (k.style === 'stamp' ? 260 : 210) * k.scale;
  const h = (k.style === 'stamp' ? 300 : 320) * k.scale;
  return [k.center[0] - w / 2, k.center[1] - h / 2, k.center[0] + w / 2, k.center[1] + h / 2];
});

// Real artwork and a cartoon vector flower on one page fight each other, so
// a template carrying artwork drops the drawn nature accents.
const DRAWN_NATURE = ['flower', 'leaf', 'butterfly'];

// eph descriptors: ['slip', line] | ['tag', code, line] | ['mark', code, date] | ['stamp']
function ephemera(spec, prefix, cx, cy, r) {
  if (!spec) return [];
  const [kind, a, b] = spec;
  const at = { center: [cx, cy], rotation: int(r, -4, 4) };
  // slot_ids carry the ephemera role so the editor can label the field
  const slot = (name, text, max) =>
    CAP(`${prefix}-${name}`, text, 'special_elite', name.endsWith('code') ? 28 : 24, max,
      { transform: 'upper' });

  if (kind === 'slip') return [{ type: 'paper_slip', ...at, line: slot('slip', a, 26) }];
  if (kind === 'stamp') return [{ type: 'airmail_stamp', ...at }];
  if (kind === 'tag') {
    return [{ type: 'luggage_tag', ...at,
      code: slot('tag-code', a, 3), line: slot('tag-line', b, 12) }];
  }
  if (kind === 'mark') {
    return [{ type: 'postmark', ...at,
      code: slot('mark-code', a, 3), date: slot('mark-date', b, 12) }];
  }
  return [];
}

export function build(d) {
  const r = prng(d.id);
  const [coverPaper, pagePaper, closePaper] = d.paper.split('/');
  const stain = (style) => (style === 'grid' || style === 'dot' ? 0 : (r() > 0.45 ? 1 : 0));
  const mount = d.mount === 'corners' ? 'photo_corners' : (d.mount || 'tape');
  const tapes = d.tapes || ['pink', 'sage'];
  const titleFont = d.titleFont || 'special_elite';
  const titleFontIsHand = (d.titleFont || 'special_elite') === 'caveat';
  const titleSize = d.titleSize
    || (titleFontIsHand ? int(r, 138, 168) : (d.layout === 'left' ? 96 : int(r, 94, 110)));
  const L = COVER[d.layout || one(r, Object.keys(COVER))];
  const tint = d.tint || 'cream';
  const shape = d.shape || 'rect';
  const altPaper = one(r, ['plain', 'ruled', 'grid', 'dot'].filter((p) => p !== pagePaper));
  const motif = d.sticker
    ? (d.motif || []).filter((m) => !DRAWN_NATURE.includes(m))
    : d.motif;
  const notePos = NOTE_AT[d.notePos || one(r, Object.keys(NOTE_AT))];

  const subY = L.t1 + L.gap + L.sub;
  const slides = [];

  /* ---- cover ---- */
  const coverTexts = [
    T('c-the', d.the ?? 'the', 'caveat', 46, L.x, L.the, 6),
    T('c-title-1', d.t[0], titleFont, titleSize, L.x, L.t1, 9, { transform: 'upper' }),
    T('c-title-2', d.t[1], titleFont, titleSize, L.x, L.t1 + L.gap, 9, { transform: 'upper' }),
    T('c-sub', d.sub, 'caveat', 50, L.x, subY, 26),
    T('c-stats', d.stats, 'special_elite', 26, L.x, subY + L.stats, 32),
    T('c-quote', d.quote, 'caveat', 46, 540, L.quote, 38),
  ];
  const cEphAt = [d.eph?.[0] === 'tag' ? 838 : 540, d.eph?.[0] === 'mark' ? 960 : 892];
  const cEphBox = ephBox(d.eph, cEphAt[0], cEphAt[1]);
  const cStk = stickers(d.sticker, ART_OPEN, r, 1, cEphBox);
  slides.push({
    type: 'cover',
    paper: { style: coverPaper, stains: stain(coverPaper), tint },
    texts: coverTexts,
    ephemera: ephemera(d.eph, 'c', cEphAt[0], cEphAt[1], r),
    stickers: cStk,
    // artwork is loud, so a template carrying it keeps its accents quiet
    accents: accents(motif, OPEN, r, d.sticker ? 2 : 4, [...cEphBox, ...artBox(cStk)]),
  });

  /* ---- photo pages ---- */
  // A scrapbook does not repeat one layout six times. Each template gets a
  // rhythm: a sequence of different page recipes that still adds up to a
  // sane number of uploads. One caption line feeds one page, whatever
  // shape that page turns out to be.
  let photo = 0;
  const next = () => (photo += 1);

  // n is captured before the object literal so the caption id always matches
  // the photo it belongs to, whatever order the fields evaluate in.
  const bare = (w, h, cx, cy, rot, cap, capSize = 52) => {
    const n = next();
    return {
      photo_index: n, style: 'bare', shape,
      photo_w: w, photo_h: h, center: [cx, cy], rotation: rot,
      mount: 'none', tape_colors: [],
      caption: cap === null ? null : CAP(`p${n}-cap`, cap, 'caveat', capSize, 26),
    };
  };

  const RECIPES = {
    // one big polaroid, taped, dead centre - the classic page
    polaroid: (cap, note, k) => {
      const n = next();
      return {
        type: 'photo',
        frame: {
          photo_index: n,
          photo_w: int(r, 720, 792), photo_h: int(r, 866, 930),
          center: [int(r, 542, 563), int(r, 642, 658)],
          rotation: +num(r, -3.6, 3.6).toFixed(1),
          mount, shape,
          tape_colors: mount === 'tape'
            ? [tapes[k % tapes.length], tapes[(k + 1) % tapes.length]] : [],
          caption: CAP(`p${n}-cap`, cap, 'caveat', 58, 26),
        },
        texts: note ? [T(`n${k}-note`, note, 'caveat', 44,
          notePos[0], notePos[1], 28, { rotation: notePos[2] })] : [],
        paperOverride: null,
      };
    },

    // the photo is the whole page, caption on a dark scrim
    bleed: (cap) => {
      const n = next();
      return {
        type: 'full',
        frames: [{
          photo_index: n, style: 'full', shape: 'rect',
          photo_w: W, photo_h: H, center: [540, 675], rotation: 0,
          mount: 'none', tape_colors: [],
          caption: CAP(`p${n}-cap`, cap, 'caveat', 62, 26),
        }],
        texts: [],
        paperOverride: { style: 'plain', stains: 0 },
      };
    },

    // photo shoved to one side, the words get the other side
    offset: (cap, note, k) => {
      const right = r() > 0.5;
      const fx = right ? 702 : 378;
      const tx = right ? 268 : 812;
      const f = bare(int(r, 508, 552), int(r, 660, 716), fx, 596,
        right ? 3 : -3, cap, 46);
      return {
        type: 'feature',
        frames: [f],
        texts: note ? [T(`n${k}-note`, note, 'caveat', 46, tx, 470, 28,
          { rotation: right ? -4 : 4 })] : [],
        paperOverride: null,
      };
    },

    // a tall narrow crop, generous margins, caption printed underneath
    portrait: (cap, note, k) => ({
      type: 'feature',
      frames: [bare(int(r, 404, 448), int(r, 840, 900), 540, 578, 0, cap, 50)],
      texts: note ? [T(`n${k}-note`, note, 'caveat', 42, 540, 1156, 28)] : [],
      paperOverride: null,
    }),

    // tilted hard into a corner, the note answers from the far one
    corner: (cap, note, k) => ({
      type: 'feature',
      frames: [bare(int(r, 596, 648), int(r, 730, 786), 452, 500, -9, cap, 46)],
      texts: note ? [T(`n${k}-note`, note, 'caveat', 48, 748, 1090, 28,
        { rotation: 4 })] : [],
      paperOverride: null,
    }),

    // one large, one small, overlapping at the corner
    stack: (cap, note, k) => ({
      type: 'collage',
      frames: [
        bare(int(r, 496, 536), int(r, 606, 652), 424, 520, -5, null),
        bare(int(r, 316, 348), int(r, 384, 420), 736, 872, 6, null),
      ],
      texts: [T(`h${k}-head`, cap, 'caveat', 50, 540, 160, 28)],
      paperOverride: null,
    }),

    // three in a band across the middle, like a contact sheet
    strip: (cap, note, k) => ({
      type: 'collage',
      frames: [
        bare(int(r, 268, 292), int(r, 322, 352), 258, 640, -4, null),
        bare(int(r, 268, 292), int(r, 322, 352), 540, 616, 3, null),
        bare(int(r, 268, 292), int(r, 322, 352), 822, 648, -2, null),
      ],
      texts: [T(`h${k}-head`, cap, 'caveat', 50, 540, 340, 28)],
      paperOverride: null,
    }),

    // three scattered down the page
    scatter: (cap, note, k) => {
      const spots = COLLAGE[k % COLLAGE.length];
      return {
        type: 'collage',
        frames: spots.map(([cx, cy, rot]) =>
          bare(int(r, 300, 352), int(r, 364, 424), cx, cy, rot, null)),
        texts: [T(`h${k}-head`, cap, 'caveat', 50, 540, 152, 28)],
        paperOverride: null,
      };
    },
  };

  const rhythm = (d.rhythm ? RHYTHMS[d.rhythm] : one(r, RHYTHMS));

  rhythm.forEach((name, k) => {
    const cap = d.caps[k % d.caps.length];
    const note = d.notes ? d.notes[k % d.notes.length] : null;
    const built = RECIPES[name](cap, note, k);
    const stk = d.sticker && k % 2 === 1 && name === 'polaroid'
      ? stickers(d.sticker, ART_CORNER, r, 1) : [];
    const multi = built.frames && built.frames.length > 1;
    slides.push({
      type: built.type,
      paper: built.paperOverride
        ? { ...built.paperOverride, tint }
        // pages alternate stock inside a template, so no two in a row match
        : { style: k % 3 === 2 ? altPaper : pagePaper, stains: stain(pagePaper), tint },
      ...(built.frame ? { frame: built.frame } : { frames: built.frames }),
      texts: built.texts,
      ephemera: [],
      stickers: stk,
      accents: name === 'bleed' ? []
        : accents(motif, CORNERS, r, multi ? 1 : (d.sticker ? 1 : 2), artBox(stk)),
    });
  });

  /* ---- duo ---- */
  if (d.duo) {
    const [head, note, a, b] = d.duo;
    const n = photo;
    const duoFrame = (idx, cx, cy, rot, tape, id, text) => ({
      photo_index: idx,
      photo_w: int(r, 452, 482), photo_h: int(r, 610, 646),
      center: [cx, cy], rotation: rot, mount: 'tape', tape_colors: [tape],
      caption: CAP(id, text, 'caveat', 46, 10),
    });
    slides.push({
      type: 'duo',
      paper: { style: pagePaper, stains: 0, tint },
      frames: [
        duoFrame(n + 1, int(r, 344, 372), int(r, 524, 552), -6, tapes[0], 'd-cap-a', a),
        duoFrame(n + 2, int(r, 696, 716), int(r, 786, 812), 5, tapes[1 % tapes.length], 'd-cap-b', b),
      ],
      texts: [
        T('d-head', head, 'caveat', 48, 540, 158, 28),
        T('d-note', note, 'caveat', 44, 540, 1204, 28),
      ],
      accents: accents(motif, CORNERS, r, 2),
    });
  }

  /* ---- closing ---- */
  const c = d.close;
  const keepPhoto = c.keep ? (c.keepPhoto || 1) : null;
  const keepSize = int(r, 266, 296);
  const keepX = int(r, 686, 718);
  const reserved = [
    [80, 656, 352, 774],                      // the two side-note lines
    ...ephBox(c.eph, 540, 1068),
    ...(c.keep
      ? [[keepX - keepSize / 2 - 34, 700 - keepSize / 2 - 34,
        keepX + keepSize / 2 + 34, 700 + keepSize / 2 + 120]]
      : []),
  ];
  const zStk = stickers(d.sticker, ART_OPEN, r, 1, reserved);
  slides.push({
    type: 'closing',
    paper: { style: closePaper, stains: stain(closePaper), tint },
    texts: [
      T('z-big', c.big, 'special_elite', int(r, 104, 118), 540, 268, 6, { transform: 'upper' }),
      T('z-sub', c.sub, 'caveat', 50, 540, 376, 26),
      T('z-side-1', c.side[0], 'caveat', 40, 212, 690, 15, { rotation: -3 }),
      T('z-side-2', c.side[1], 'caveat', 40, 212, 742, 15, { rotation: -3 }),
      T('z-foot', c.foot, 'special_elite', 26, 540, 1224, 32),
    ],
    keepsake: c.keep
      ? {
        user_photo: keepPhoto,
        size: keepSize,
        center: [keepX, 700],
        rotation: +num(r, -5, 5).toFixed(1),
        caption: CAP('z-keep', c.keep, 'caveat', 42, 22),
      }
      : null,
    ephemera: ephemera(c.eph, 'z', 540, 1068, r),
    stickers: zStk,
    accents: accents(motif, OPEN, r, d.sticker ? 2 : 4, [...reserved, ...artBox(zStk)]),
  });

  return {
    template: {
      id: d.id,
      name: d.name,
      tagline: d.tag,
      category: d.cat,
      photo_count: photo + (d.duo ? 2 : 0),
      occasions: d.occ,
      preview_brief: d.pv,
      language: d.lang || 'en',
      tone: d.tone || 'refined',
    },
    slides,
  };
}
