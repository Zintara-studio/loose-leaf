// templates.js - the gallery.
//
// The three below are written out as raw slots: that is exactly the JSON
// shape of system-prompt.md section 6, so model output drops in unchanged.
// The other fifty live in deck.js as compact descriptors and are expanded by
// build.js into the same shape. Both kinds end up in one array.

import { DECK } from './deck.js';
import { build } from './build.js';

const T = (slot_id, text, font, size, cx, cy, max_chars, o) => Object.assign({
  slot_id, text, font, size, center: [cx, cy], rotation: 0,
  max_chars, editable: true, transform: 'none',
}, o);

// Frame, keepsake and ephemera captions sit at [0,0]; the engine places them.
const CAP = (slot_id, text, font, size, max_chars, o) =>
  T(slot_id, text, font, size, 0, 0, max_chars, o);

const A = (type, cx, cy, scale, rotation) =>
  ({ type, center: [cx, cy], scale, rotation: rotation || 0 });

const F = (photo_index, w, h, cx, cy, rotation, mount, tape_colors, caption) =>
  ({ photo_index, photo_w: w, photo_h: h, center: [cx, cy], rotation, mount, tape_colors, caption });

const RAW = [

/* ------------------------------------------------------------------ */
{
  template: {
    id: 'monsoon-cafe-diary-v1',
    name: 'The Monsoon Cafe Diary',
    tagline: 'one wet week, kept at a corner table.',
    category: ['cafe', 'journal', 'rain'],
    photo_count: 6,
    occasions: ['rainy days', 'cafe afternoons', 'slow weekends'],
    preview_brief: 'six rain-lit cafe photos: a fogged window, two cups, a book left open, a wet street, an empty chair, one soft candid.',
    language: 'en',
    tone: 'refined',
  },
  slides: [
    { type: 'cover',
      paper: { style: 'kraft', stains: 0 },   // the ring is the signature accent here
      texts: [
        T('c-the', 'the', 'caveat', 46, 540, 286, 6),
        T('c-title-1', 'monsoon', 'special_elite', 100, 540, 404, 9, { transform: 'upper' }),
        T('c-title-2', 'diary', 'special_elite', 100, 540, 524, 9, { transform: 'upper' }),
        T('c-sub', 'kept at a corner table', 'caveat', 52, 540, 628, 26),
        T('c-stats', 'six cups, one long week', 'special_elite', 26, 540, 696, 32),
        T('c-quote', 'the rain took its time.', 'caveat', 46, 540, 1168, 38),
      ],
      ephemera: [
        { type: 'paper_slip', center: [540, 880], rotation: -2,
          line: CAP('c-slip', 'table for one, twice', 'special_elite', 26, 26, { transform: 'upper' }) },
      ],
      accents: [
        A('cloud', 846, 300, 1.3), A('coffee_ring', 236, 772, 1.5),
        A('coffee_ring', 880, 1000, 1.1, 12), A('sparkle', 178, 214, 0.9, 8),
      ] },

    { type: 'photo',
      paper: { style: 'ruled', stains: 1 },
      frame: F(1, 760, 890, 556, 646, -3, 'tape', ['sky', 'pink'],
        CAP('p1-cap', 'opened at ten, unhurried.', 'caveat', 60, 26)),
      texts: [
        T('p1-label', 'study i', 'special_elite', 26, 172, 1146, 20, { rotation: -4, editable: false }),
        T('p1-note', 'the street kept dripping.', 'caveat', 44, 566, 1214, 28),
      ],
      ephemera: [],
      accents: [A('coffee_ring', 906, 1096, 1.0), A('dashed_trail', 124, 268, 1.2, -10)] },

    { type: 'photo',
      paper: { style: 'ruled', stains: 0 },
      frame: F(2, 740, 880, 544, 642, 2.5, 'tape', ['mustard', 'sage'],
        CAP('p2-cap', 'the second cup was better.', 'caveat', 58, 26)),
      texts: [T('p2-note', 'no one hurried us.', 'caveat', 46, 540, 1206, 24)],
      ephemera: [],
      accents: [A('sparkle', 928, 232, 1.0), A('cloud', 140, 1128, 1.0)] },

    { type: 'photo',
      paper: { style: 'ruled', stains: 1 },
      frame: F(3, 770, 900, 552, 652, -1.5, 'tape', ['lilac', 'sky'],
        CAP('p3-cap', 'the window did the work.', 'caveat', 60, 26)),
      texts: [T('p3-note', 'steam, then more steam.', 'caveat', 44, 540, 1214, 28)],
      ephemera: [],
      accents: [A('coffee_ring', 922, 236, 1.2)] },

    { type: 'photo',
      paper: { style: 'ruled', stains: 0 },
      frame: F(4, 750, 880, 548, 640, 3, 'tape', ['pink'],
        CAP('p4-cap', 'we ordered again, slowly.', 'caveat', 58, 26)),
      texts: [T('p4-note', 'the good kind of stuck.', 'caveat', 44, 540, 1202, 28)],
      ephemera: [],
      accents: [A('dashed_trail', 906, 1140, 1.3, 14), A('star', 136, 240, 0.9)] },

    { type: 'duo',
      paper: { style: 'ruled', stains: 0 },
      frames: [
        F(5, 470, 630, 360, 540, -6, 'tape', ['sage'],
          CAP('d-cap-a', 'before', 'caveat', 46, 10)),
        F(6, 470, 630, 706, 800, 5, 'tape', ['sky'],
          CAP('d-cap-b', 'after', 'caveat', 46, 10)),
      ],
      texts: [
        T('d-head', 'two of the same window', 'caveat', 48, 540, 158, 28),
        T('d-note', 'one of them is honest.', 'caveat', 44, 540, 1204, 28),
      ],
      accents: [A('coffee_ring', 160, 1132, 1.1), A('sparkle', 930, 258, 0.9)] },

    { type: 'closing',
      paper: { style: 'plain', stains: 1 },
      texts: [
        T('z-big', 'kept', 'special_elite', 116, 540, 268, 6, { transform: 'upper' }),
        T('z-sub', 'and worth the damp.', 'caveat', 50, 540, 372, 26),
        T('z-side-1', 'the good part:', 'caveat', 40, 206, 690, 15, { rotation: -3 }),
        T('z-side-2', 'we stayed on.', 'caveat', 40, 206, 742, 15, { rotation: -3 }),
        T('z-foot', 'made on paper, mostly.', 'special_elite', 26, 540, 1226, 32),
      ],
      keepsake: { user_photo: 2, size: 280, center: [704, 700], rotation: 4,
        caption: CAP('z-keep', 'one more, quietly.', 'caveat', 42, 22) },
      ephemera: [
        { type: 'paper_slip', center: [540, 1074], rotation: 1.5,
          line: CAP('z-slip', 'end of the wet week', 'special_elite', 26, 26, { transform: 'upper' }) },
      ],
      accents: [
        A('coffee_ring', 886, 296, 1.3), A('cloud', 172, 1044, 1.0),
        A('sparkle', 906, 880, 0.9),
      ] },
  ],
},

/* ------------------------------------------------------------------ */
{
  template: {
    id: 'film-roll-minimal-v1',
    name: 'Film Roll',
    tagline: 'six frames, nothing spare.',
    category: ['minimal', 'film', 'journal'],
    photo_count: 6,
    occasions: ['any week', 'city walks', 'quiet days'],
    preview_brief: 'six muted 35mm-looking photos: a doorway, a shadow on a wall, a bus window, a hand, a street corner, one blurred candid.',
    language: 'en',
    tone: 'minimal',
  },
  slides: [
    { type: 'cover',
      paper: { style: 'plain', stains: 0 },
      texts: [
        T('c-the', 'the', 'caveat', 40, 540, 320, 6),
        T('c-title-1', 'film', 'special_elite', 118, 540, 442, 9, { transform: 'upper' }),
        T('c-title-2', 'roll', 'special_elite', 118, 540, 570, 9, { transform: 'upper' }),
        T('c-sub', 'thirty six, minus thirty', 'caveat', 44, 540, 674, 26),
        T('c-stats', 'iso 400, mostly', 'special_elite', 24, 540, 732, 32),
        T('c-quote', 'nothing here needs a caption.', 'caveat', 40, 540, 1178, 38),
      ],
      ephemera: [
        { type: 'paper_slip', center: [540, 900], rotation: 0,
          line: CAP('c-slip', 'roll 01 / developed', 'special_elite', 24, 26, { transform: 'upper' }) },
      ],
      accents: [A('star', 890, 300, 0.8), A('dashed_trail', 190, 1000, 1.4, 6)] },

    ...[
      [1, 'morning.', 0], [2, 'the long way.', -1], [3, 'still there.', 1],
      [4, 'waiting, again.', -1.5], [5, 'half past four.', 1.5], [6, 'last frame.', 0],
    ].map(([n, cap, rot]) => ({
      type: 'photo',
      paper: { style: 'plain', stains: 0 },
      frame: F(n, 780, 900, 540, 650, rot, 'photo_corners', [],
        CAP(`p${n}-cap`, cap, 'caveat', 56, 26)),
      texts: [],
      ephemera: [
        { type: 'paper_slip', center: [540, 1184], rotation: 0,
          line: CAP(`p${n}-slip`, `frame 0${n}`, 'special_elite', 24, 26, { transform: 'upper' }) },
      ],
      accents: [],
    })),

    { type: 'closing',
      paper: { style: 'plain', stains: 0 },
      texts: [
        T('z-big', 'fin', 'special_elite', 122, 540, 300, 6, { transform: 'upper' }),
        T('z-sub', 'roll ends here.', 'caveat', 48, 540, 410, 26),
        T('z-side-1', 'kept the six.', 'caveat', 38, 246, 672, 15),
        T('z-side-2', 'lost the rest.', 'caveat', 38, 246, 720, 15),
        T('z-foot', 'printed small, on purpose.', 'special_elite', 24, 540, 1200, 32),
      ],
      keepsake: null,
      ephemera: [
        { type: 'paper_slip', center: [540, 940], rotation: 0,
          line: CAP('z-slip', 'end of roll', 'special_elite', 24, 26, { transform: 'upper' }) },
      ],
      accents: [A('star', 844, 976, 0.8)] },
  ],
},

/* ------------------------------------------------------------------ */
{
  template: {
    id: 'kraft-birthday-v1',
    name: 'Kraft Birthday',
    tagline: 'a year, taped to brown paper.',
    category: ['birthday', 'party'],
    photo_count: 6,
    occasions: ['birthdays', 'parties', 'milestones'],
    preview_brief: 'six warm indoor party photos: a cake, hands clapping, paper decorations, a full table, a doorway, one laughing candid.',
    language: 'en',
    tone: 'playful',
  },
  slides: [
    { type: 'cover',
      paper: { style: 'kraft', stains: 1 },
      texts: [
        T('c-the', 'the', 'caveat', 48, 540, 278, 6),
        T('c-title-1', 'another', 'special_elite', 92, 540, 394, 9, { transform: 'upper' }),
        T('c-title-2', 'round', 'special_elite', 92, 540, 510, 9, { transform: 'upper' }),
        T('c-sub', 'one whole lap of the sun', 'caveat', 52, 540, 616, 26),
        T('c-stats', 'candles: enough', 'special_elite', 26, 540, 684, 32),
        T('c-quote', 'same cake, different year.', 'caveat', 46, 540, 1172, 38),
      ],
      ephemera: [
        { type: 'luggage_tag', center: [842, 894], rotation: -8,
          code: CAP('c-tag-code', '', 'special_elite', 30, 3, { transform: 'upper' }),
          line: CAP('c-tag-line', 'one more lap', 'special_elite', 24, 12, { transform: 'upper' }) },
      ],
      accents: [
        A('star', 206, 326, 1.1), A('sparkle', 886, 266, 1.0),
        A('music_notes', 180, 760, 1.0, -8), A('heart', 268, 1046, 0.9),
        A('sun', 942, 1092, 1.0),
      ] },

    ...[
      [1, 760, 880, 552, 644, -3, ['mustard', 'pink'], 'cake first, talk later.', 'the plan, roughly.',
        [A('star', 922, 230, 0.9), A('sparkle', 140, 1114, 0.9)]],
      [2, 740, 870, 546, 644, 2.5, ['sky', 'sage'], 'someone lit something.', 'it went well, mostly.',
        [A('music_notes', 928, 1122, 1.0, 10)]],
      [3, 770, 890, 556, 648, -2, ['lilac'], 'the good chair.', 'held all evening.',
        [A('heart', 142, 244, 0.9), A('sun', 926, 236, 0.9)]],
      [4, 750, 880, 540, 640, 3.5, ['pink', 'mustard'], 'loud, in a nice way.', 'no complaints filed.',
        [A('sparkle', 930, 1116, 1.0), A('star', 136, 1130, 0.8)]],
      [5, 760, 890, 552, 646, -1.5, ['sage', 'sky'], 'we sang, roughly.', 'twice, for the record.',
        [A('music_notes', 148, 252, 1.1, -12)]],
      [6, 745, 875, 544, 642, 2, ['mustard'], 'still going, later.', 'nobody checked a clock.',
        [A('paper_plane', 924, 244, 1.0, -14), A('heart', 150, 1120, 0.9)]],
    ].map(([n, w, h, cx, cy, rot, tape, cap, note, accents]) => ({
      type: 'photo',
      paper: { style: 'ruled', stains: n % 3 === 0 ? 1 : 0 },
      frame: F(n, w, h, cx, cy, rot, 'tape', tape, CAP(`p${n}-cap`, cap, 'caveat', 58, 26)),
      texts: [T(`p${n}-note`, note, 'caveat', 44, 540, 1204, 28)],
      ephemera: [],
      accents,
    })),

    { type: 'closing',
      paper: { style: 'kraft', stains: 1 },
      texts: [
        T('z-big', 'again', 'special_elite', 112, 540, 264, 6, { transform: 'upper' }),
        T('z-sub', 'same time next year.', 'caveat', 50, 540, 368, 26),
        T('z-side-1', 'no notes.', 'caveat', 40, 216, 648, 15, { rotation: -4 }),
        T('z-side-2', 'more of this.', 'caveat', 40, 216, 700, 15, { rotation: -4 }),
        T('z-foot', 'taped down, on purpose.', 'special_elite', 26, 540, 1218, 32),
      ],
      keepsake: { user_photo: 1, size: 290, center: [702, 700], rotation: -3,
        caption: CAP('z-keep', 'keep this one.', 'caveat', 42, 22) },
      ephemera: [
        { type: 'luggage_tag', center: [246, 1024], rotation: 6,
          code: CAP('z-tag-code', '', 'special_elite', 30, 3, { transform: 'upper' }),
          line: CAP('z-tag-line', 'same again', 'special_elite', 24, 12, { transform: 'upper' }) },
      ],
      accents: [
        A('sun', 906, 306, 1.1), A('star', 176, 286, 0.9),
        A('sparkle', 900, 1004, 0.9), A('music_notes', 420, 1108, 0.9),
      ] },
  ],
},

];

export const TEMPLATES = [...RAW, ...DECK.map(build)];
