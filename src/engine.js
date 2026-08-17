// engine.js - draws one template slide onto a 1080x1350 canvas.
// This is section 4 of system-prompt.md, made literal. No render library and
// no React: it is pure canvas drawing, so the view layer never touches it.

import { getArt } from './art.js';

const W = 1080, H = 1350;
const INK = '#2f2a26', FAINT = '#8d8175';

const FACE = {
  caveat:        ['400', '"Caveat", cursive'],
  special_elite: ['400', '"Special Elite", monospace'],
  kalam:         ['400', '"Kalam", cursive'],
  kalam_bold:    ['700', '"Kalam", cursive'],
};

// Paper stock. Dark tints flip the ink so text stays readable.
const TINT = {
  cream: '#faf6ee', blush: '#f8e8e4', sage: '#e7efe3', sky: '#e2ecf4',
  butter: '#fbf0d6', lilac: '#eee8f5', charcoal: '#332f2b', ink: '#2a303a',
};
const DARK = new Set(['charcoal', 'ink']);
const LIGHT_INK = '#f3ece0';

const TAPE = {
  pink: '#f2c9ce', sage: '#c9dbc8', mustard: '#f5e3ae',
  sky: '#c8dceb', lilac: '#dcd2ea',
};

const RAD = Math.PI / 180;

const STICKER_H = 300;   // height of a cutout at scale 1
const STAMP_W = 230;     // width of a framed stamp at scale 1

// Seeded per slide so stains and paper fibre stay put between repaints.
function seeded(n) {
  let t = (n | 0) * 1831565813 + 0x6d2b79f5;
  return () => {
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ---------- paper ---------- */

function ring(ctx, x, y, r, a) {
  ctx.save();
  ctx.strokeStyle = `rgba(146,108,66,${a})`;
  ctx.lineWidth = 10;
  ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.stroke();
  ctx.globalAlpha = 0.55; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(x, y, r - 10, 0, 7); ctx.stroke();
  ctx.restore();
}

function paper(ctx, spec, rnd) {
  const style = (spec && spec.style) || 'plain';
  const stains = (spec && spec.stains) || 0;
  const tint = (spec && spec.tint) || 'cream';
  const dark = DARK.has(tint);

  ctx.fillStyle = style === 'kraft' ? '#d7bf9f' : (TINT[tint] || TINT.cream);
  ctx.fillRect(0, 0, W, H);

  if (style === 'kraft') {
    for (let i = 0; i < 2400; i++) {
      ctx.fillStyle = rnd() > 0.5 ? 'rgba(118,92,62,.10)' : 'rgba(255,247,232,.13)';
      ctx.fillRect(rnd() * W, rnd() * H, 2, 2);
    }
  }

  if (style === 'ruled') {
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = dark ? 'rgba(240,235,225,.13)' : '#c6d5e0';
    for (let y = 152; y < H - 40; y += 56) {
      ctx.beginPath(); ctx.moveTo(58, y); ctx.lineTo(W - 58, y); ctx.stroke();
    }
    ctx.strokeStyle = dark ? 'rgba(226,160,160,.3)' : '#e8c2c2';
    ctx.beginPath(); ctx.moveTo(112, 44); ctx.lineTo(112, H - 44); ctx.stroke();
  }

  if (style === 'grid') {
    ctx.lineWidth = 1;
    ctx.strokeStyle = dark ? 'rgba(240,235,225,.10)' : '#d9dfdc';
    for (let x = 60; x <= W - 60; x += 48) {
      ctx.beginPath(); ctx.moveTo(x, 60); ctx.lineTo(x, H - 60); ctx.stroke();
    }
    for (let y = 60; y <= H - 60; y += 48) {
      ctx.beginPath(); ctx.moveTo(60, y); ctx.lineTo(W - 60, y); ctx.stroke();
    }
  }

  if (style === 'dot') {
    ctx.fillStyle = dark ? 'rgba(240,235,225,.16)' : '#d0d7d2';
    for (let y = 72; y <= H - 60; y += 46) {
      for (let x = 72; x <= W - 60; x += 46) {
        ctx.beginPath(); ctx.arc(x, y, 2, 0, 7); ctx.fill();
      }
    }
  }

  for (let i = 0; i < stains; i++) {
    ring(ctx, 130 + rnd() * (W - 260), 130 + rnd() * (H - 260), 58 + rnd() * 70, 0.07 + rnd() * 0.05);
  }
}

/* ---------- text ---------- */

function resolve(slot, values) {
  let s = values && slot.slot_id in values ? values[slot.slot_id] : slot.text;
  if (s == null) s = '';
  return slot.transform === 'upper' ? s.toUpperCase() : s;
}

let PAGE_INK = INK;

function text(ctx, slot, x, y, values) {
  if (!slot) return;
  const s = resolve(slot, values);
  if (!s.trim()) return;
  const face = FACE[slot.font] || FACE.caveat;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate((slot.rotation || 0) * RAD);
  ctx.font = `${face[0]} ${slot.size}px ${face[1]}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = slot.ink || PAGE_INK;
  if ('letterSpacing' in ctx && slot.transform === 'upper') {
    ctx.letterSpacing = Math.max(1, slot.size * 0.045).toFixed(1) + 'px';
  }
  ctx.fillText(s, 0, 0);
  ctx.restore();
}

/* ---------- photo frames ---------- */

// rect | arch (rounded top, like a doorway) | circle
function shapePath(ctx, x, y, w, h, shape) {
  ctx.beginPath();
  if (shape === 'circle') {
    ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, 7);
  } else if (shape === 'arch') {
    const r = w / 2;
    ctx.moveTo(x, y + h);
    ctx.lineTo(x, y + r);
    ctx.arc(x + r, y + r, r, Math.PI, 0);
    ctx.lineTo(x + w, y + h);
    ctx.closePath();
  } else {
    ctx.rect(x, y, w, h);
  }
}

function cover(ctx, img, x, y, w, h, shape) {
  ctx.save();
  shapePath(ctx, x, y, w, h, shape);
  ctx.clip();
  const s = Math.max(w / img.width, h / img.height);
  const dw = img.width * s, dh = img.height * s;
  ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
  ctx.restore();
}

function placeholder(ctx, x, y, w, h, n, shape) {
  ctx.save();
  ctx.fillStyle = '#ece5da';
  shapePath(ctx, x, y, w, h, shape); ctx.fill();
  ctx.strokeStyle = '#d3c8b8';
  ctx.lineWidth = 2;
  ctx.setLineDash([10, 9]);
  shapePath(ctx, x + 10, y + 10, w - 20, h - 20, shape); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = '#bcae9c';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = `400 ${Math.min(w, h) * 0.34}px "Special Elite", monospace`;
  ctx.fillText(String(n), x + w / 2, y + h / 2 - h * 0.04);
  ctx.font = '400 26px "Special Elite", monospace';
  ctx.fillText('YOUR PHOTO', x + w / 2, y + h / 2 + h * 0.2);
  ctx.restore();
}

function tapeStrip(ctx, x, y, deg, color) {
  ctx.save();
  ctx.translate(x, y); ctx.rotate(deg * RAD);
  ctx.globalAlpha = 0.84;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(-72, -20); ctx.lineTo(72, -23); ctx.lineTo(74, 20); ctx.lineTo(-74, 17);
  ctx.closePath(); ctx.fill();
  ctx.globalAlpha = 0.2; ctx.fillStyle = '#fff';
  ctx.fillRect(-70, -15, 140, 7);
  ctx.restore();
}

function photoCorner(ctx, x, y, sx, sy) {
  ctx.save();
  ctx.fillStyle = 'rgba(52,42,34,.74)';
  ctx.beginPath();
  ctx.moveTo(x, y); ctx.lineTo(x + 58 * sx, y); ctx.lineTo(x, y + 58 * sy);
  ctx.closePath(); ctx.fill();
  ctx.restore();
}

// rect is the image area, so photo corners grip the photo, not the card lip.
function mount(ctx, f, w, h, rect) {
  const m = f.mount || 'none';
  if (m === 'tape') {
    const c = f.tape_colors && f.tape_colors.length ? f.tape_colors : ['sky'];
    tapeStrip(ctx, -w / 2 + 8, -h / 2 + 6, -34, TAPE[c[0]] || TAPE.sky);
    tapeStrip(ctx, w / 2 - 8, -h / 2 + 6, 34, TAPE[c[1 % c.length]] || TAPE.sky);
  } else if (m === 'photo_corners') {
    const [x, y, iw, ih] = rect;
    photoCorner(ctx, x, y, 1, 1);
    photoCorner(ctx, x + iw, y, -1, 1);
    photoCorner(ctx, x, y + ih, 1, -1);
    photoCorner(ctx, x + iw, y + ih, -1, -1);
  }
}

function frame(ctx, f, img, values) {
  const style = f.style || 'polaroid';
  const shape = f.shape || 'rect';

  // full: the photo is the page. Caption sits on a band along the bottom.
  if (style === 'full') {
    if (img) cover(ctx, img, 0, 0, W, H, 'rect');
    else placeholder(ctx, 0, 0, W, H, f.photo_index, 'rect');
    const band = ctx.createLinearGradient(0, H - 420, 0, H);
    band.addColorStop(0, 'rgba(24,20,16,0)');
    band.addColorStop(1, 'rgba(24,20,16,.72)');
    ctx.fillStyle = band;
    ctx.fillRect(0, H - 420, W, 420);
    text(ctx, f.caption && { ...f.caption, ink: '#fdf8ee' }, W / 2, H - 150, values);
    return;
  }

  const w = f.photo_w, h = f.photo_h;
  ctx.save();
  ctx.translate(f.center[0], f.center[1]);
  ctx.rotate((f.rotation || 0) * RAD);

  // bare: a thin white edge, no bottom lip, caption printed underneath
  const pad = style === 'bare' ? Math.round(w * 0.026) : Math.round(w * 0.036);
  const strip = style === 'bare' ? pad : Math.round(h * 0.145);

  ctx.save();
  ctx.shadowColor = 'rgba(58,44,30,.24)';
  ctx.shadowBlur = 24;
  ctx.shadowOffsetY = 10;
  ctx.fillStyle = '#fffdf7';
  shapePath(ctx, -w / 2, -h / 2, w, h + (style === 'bare' ? 0 : 0), shape);
  ctx.fill();
  ctx.restore();

  const rect = [-w / 2 + pad, -h / 2 + pad, w - pad * 2, h - pad - strip];
  if (img) cover(ctx, img, rect[0], rect[1], rect[2], rect[3], shape);
  else placeholder(ctx, rect[0], rect[1], rect[2], rect[3], f.photo_index, shape);

  if (shape === 'rect') mount(ctx, f, w, h, rect);
  text(ctx, f.caption, 0,
    style === 'bare' ? h / 2 + 44 : h / 2 - strip / 2, values);
  ctx.restore();
}

function keepsake(ctx, k, img, values) {
  const s = k.size, lip = 40, pad = 16;
  ctx.save();
  ctx.translate(k.center[0], k.center[1]);
  ctx.rotate((k.rotation || 0) * RAD);

  ctx.save();
  ctx.shadowColor = 'rgba(58,44,30,.22)';
  ctx.shadowBlur = 18; ctx.shadowOffsetY = 7;
  ctx.fillStyle = '#fffdf7';
  ctx.fillRect(-s / 2 - pad, -s / 2 - pad, s + pad * 2, s + pad * 2 + lip);
  ctx.restore();

  if (img) cover(ctx, img, -s / 2, -s / 2, s, s, k.shape);
  else placeholder(ctx, -s / 2, -s / 2, s, s, k.user_photo || '?', k.shape);

  text(ctx, k.caption, 0, s / 2 + pad + lip / 2 + 34, values);
  ctx.restore();
}

/* ---------- accents ---------- */
// Each draws inside roughly a 40-unit box centred on the origin.

function star(ctx) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 ? 8 : 20, a = (i * 36 - 90) * RAD;
    ctx[i ? 'lineTo' : 'moveTo'](Math.cos(a) * r, Math.sin(a) * r);
  }
  ctx.closePath(); ctx.fill();
}

function sparkle(ctx) {
  ctx.beginPath();
  ctx.moveTo(0, -22); ctx.quadraticCurveTo(3, -3, 22, 0);
  ctx.quadraticCurveTo(3, 3, 0, 22); ctx.quadraticCurveTo(-3, 3, -22, 0);
  ctx.quadraticCurveTo(-3, -3, 0, -22);
  ctx.fill();
}

function heart(ctx) {
  ctx.beginPath();
  ctx.moveTo(0, 20);
  ctx.bezierCurveTo(-26, 2, -16, -20, 0, -8);
  ctx.bezierCurveTo(16, -20, 26, 2, 0, 20);
  ctx.fill();
}

function paper_plane(ctx) {
  ctx.beginPath();
  ctx.moveTo(-22, -12); ctx.lineTo(24, 2); ctx.lineTo(-4, 8);
  ctx.lineTo(-6, 20); ctx.lineTo(-12, 6);
  ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-22, -12); ctx.lineTo(-4, 8);
  ctx.lineWidth = 1.5; ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.stroke();
}

function dashed_trail(ctx) {
  ctx.beginPath();
  ctx.setLineDash([9, 8]);
  ctx.lineWidth = 3; ctx.lineCap = 'round';
  ctx.moveTo(-30, 10);
  ctx.bezierCurveTo(-10, -22, 10, 26, 30, -8);
  ctx.stroke();
  ctx.setLineDash([]);
}

function cloud(ctx) {
  ctx.beginPath();
  ctx.arc(-12, 3, 12, 0, 7);
  ctx.arc(2, -6, 16, 0, 7);
  ctx.arc(18, 4, 11, 0, 7);
  ctx.rect(-12, 3, 30, 12);
  ctx.fill();
}

function sun(ctx) {
  ctx.beginPath(); ctx.arc(0, 0, 11, 0, 7); ctx.fill();
  ctx.lineWidth = 3; ctx.lineCap = 'round';
  for (let i = 0; i < 8; i++) {
    const a = i * 45 * RAD;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * 17, Math.sin(a) * 17);
    ctx.lineTo(Math.cos(a) * 24, Math.sin(a) * 24);
    ctx.stroke();
  }
}

function music_notes(ctx) {
  ctx.lineWidth = 3;
  [[-14, 10], [12, 4]].forEach(([x, y]) => {
    ctx.beginPath(); ctx.ellipse(x, y, 8, 6, -0.3, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x + 7, y - 2); ctx.lineTo(x + 7, y - 24); ctx.stroke();
  });
  ctx.beginPath(); ctx.moveTo(-7, -26); ctx.lineTo(19, -20);
  ctx.lineWidth = 5; ctx.stroke();
}

function arrow(ctx) {
  ctx.lineWidth = 3; ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-26, 8);
  ctx.quadraticCurveTo(0, -22, 24, 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(24, 2); ctx.lineTo(12, -2);
  ctx.moveTo(24, 2); ctx.lineTo(18, 13);
  ctx.stroke();
}

function coffee_ring(ctx) {
  ctx.lineWidth = 7;
  ctx.beginPath(); ctx.arc(0, 0, 24, 0, 7); ctx.stroke();
  ctx.lineWidth = 2.5; ctx.globalAlpha *= 0.6;
  ctx.beginPath(); ctx.arc(0, 0, 17, 0.4, 5.4); ctx.stroke();
}

function flower(ctx) {
  for (let i = 0; i < 6; i++) {
    const a = i * 60 * RAD;
    ctx.beginPath();
    ctx.ellipse(Math.cos(a) * 13, Math.sin(a) * 13, 10, 6.5, a, 0, 7);
    ctx.fill();
  }
  ctx.save();
  ctx.fillStyle = '#efd291';
  ctx.beginPath(); ctx.arc(0, 0, 6.5, 0, 7); ctx.fill();
  ctx.restore();
}

function leaf(ctx) {
  ctx.lineWidth = 2.5; ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(1, 24); ctx.quadraticCurveTo(-4, 2, 2, -24);
  ctx.stroke();
  for (let i = 0; i < 3; i++) {
    const y = 13 - i * 13, s = i % 2 ? 1 : -1;
    ctx.beginPath();
    ctx.ellipse(s * 10, y, 10, 5.5, s * 0.55, 0, 7);
    ctx.fill();
  }
}

function butterfly(ctx) {
  [-1, 1].forEach((s) => {
    ctx.beginPath(); ctx.ellipse(s * 12, -8, 12, 9, s * -0.5, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.ellipse(s * 10, 9, 9, 6.5, s * 0.45, 0, 7); ctx.fill();
  });
  ctx.save();
  ctx.fillStyle = 'rgba(62,52,44,.8)';
  ctx.beginPath(); ctx.ellipse(0, 0, 2.5, 14, 0, 0, 7); ctx.fill();
  ctx.restore();
}

function snowflake(ctx) {
  ctx.lineWidth = 2.5; ctx.lineCap = 'round';
  for (let i = 0; i < 6; i++) {
    ctx.save(); ctx.rotate(i * 60 * RAD);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -22); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, -13); ctx.lineTo(-6, -19);
    ctx.moveTo(0, -13); ctx.lineTo(6, -19);
    ctx.stroke();
    ctx.restore();
  }
}

function wave(ctx) {
  ctx.lineWidth = 3; ctx.lineCap = 'round';
  for (let k = 0; k < 2; k++) {
    const y = k * 12 - 6;
    ctx.beginPath();
    ctx.moveTo(-25, y);
    ctx.bezierCurveTo(-13, y - 9, -5, y + 9, 5, y);
    ctx.bezierCurveTo(14, y - 8, 20, y + 4, 25, y - 2);
    ctx.stroke();
  }
}

function moon(ctx) {
  ctx.beginPath();
  ctx.arc(0, 0, 21, Math.PI * 0.42, Math.PI * 1.58);
  ctx.arc(-9, 0, 18, Math.PI * 1.5, Math.PI * 0.5, true);
  ctx.closePath();
  ctx.fill();
}

const ACCENTS = {
  star: [star, '#e8c86a', 'fill'],
  sparkle: [sparkle, '#d9b9e0', 'fill'],
  heart: [heart, '#e9a7b0', 'fill'],
  paper_plane: [paper_plane, '#93aec4', 'fill'],
  dashed_trail: [dashed_trail, '#a8998a', 'stroke'],
  cloud: [cloud, '#cddfec', 'fill'],
  sun: [sun, '#eec96b', 'both'],
  music_notes: [music_notes, '#8f8477', 'both'],
  arrow: [arrow, '#8f8477', 'stroke'],
  coffee_ring: [coffee_ring, 'rgba(150,110,66,.45)', 'stroke'],
  flower: [flower, '#eab4c1', 'fill'],
  leaf: [leaf, '#9dbd97', 'both'],
  butterfly: [butterfly, '#d3bfe4', 'fill'],
  snowflake: [snowflake, '#b6d3e6', 'stroke'],
  wave: [wave, '#a4c3d6', 'stroke'],
  moon: [moon, '#e3ca8e', 'fill'],
};

// Accent paths are drawn in a ~44 unit box; BASE lifts that to something
// that reads on a 1080 page at the spec's scale range of 0.5-2.5.
const BASE = 2.1;

function accent(ctx, a) {
  const def = ACCENTS[a.type];
  if (!def) return;
  const s = (a.scale || 1) * BASE;
  ctx.save();
  ctx.translate(a.center[0], a.center[1]);
  ctx.rotate((a.rotation || 0) * RAD);
  ctx.scale(s, s);
  ctx.fillStyle = def[1];
  ctx.strokeStyle = def[1];
  def[0](ctx);
  ctx.restore();
}

/* ---------- ephemera ---------- */

function luggage_tag(ctx, e, values) {
  const w = 250, h = 122, notch = 30;
  ctx.save();
  ctx.shadowColor = 'rgba(58,44,30,.2)'; ctx.shadowBlur = 12; ctx.shadowOffsetY = 5;
  ctx.fillStyle = '#efe0c4';
  ctx.beginPath();
  ctx.moveTo(-w / 2 + notch, -h / 2);
  ctx.lineTo(w / 2, -h / 2); ctx.lineTo(w / 2, h / 2); ctx.lineTo(-w / 2 + notch, h / 2);
  ctx.lineTo(-w / 2, 0);
  ctx.closePath(); ctx.fill();
  ctx.restore();

  ctx.strokeStyle = 'rgba(90,72,50,.45)';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([6, 5]);
  ctx.strokeRect(-w / 2 + notch + 6, -h / 2 + 9, w - notch - 18, h - 18);
  ctx.setLineDash([]);

  ctx.beginPath(); ctx.arc(-w / 2 + notch - 4, 0, 9, 0, 7);
  ctx.fillStyle = '#c9b492'; ctx.fill();
  ctx.beginPath(); ctx.arc(-w / 2 + notch - 4, 0, 9, 0, 7);
  ctx.strokeStyle = 'rgba(80,62,42,.5)'; ctx.lineWidth = 2; ctx.stroke();

  const mid = notch / 2;                 // centre of the writable area
  const hasCode = resolve(e.code || {}, values).trim();
  text(ctx, e.code, mid, hasCode ? -22 : 0, values);
  text(ctx, e.line, mid, hasCode ? 26 : 0, values);
}

function postmark(ctx, e, values) {
  ctx.strokeStyle = 'rgba(78,62,48,.6)';
  ctx.lineWidth = 4;
  ctx.beginPath(); ctx.arc(0, 0, 78, 0, 7); ctx.stroke();
  ctx.lineWidth = 2.5;
  ctx.setLineDash([7, 7]);
  ctx.beginPath(); ctx.arc(0, 0, 64, 0, 7); ctx.stroke();
  ctx.setLineDash([]);
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(-64, -26); ctx.lineTo(64, -26);
  ctx.moveTo(-64, 26); ctx.lineTo(64, 26); ctx.stroke();

  const code = e.code && { ...e.code, ink: 'rgba(78,62,48,.78)' };
  const date = e.date && { ...e.date, ink: 'rgba(78,62,48,.78)' };
  text(ctx, code, 0, 0, values);
  text(ctx, date, 0, 46, values);
}

function paper_slip(ctx, e, values) {
  const w = 330, h = 70;
  ctx.save();
  ctx.shadowColor = 'rgba(58,44,30,.16)'; ctx.shadowBlur = 10; ctx.shadowOffsetY = 4;
  ctx.fillStyle = '#fcf8f0';
  ctx.fillRect(-w / 2, -h / 2, w, h);
  ctx.restore();
  ctx.strokeStyle = 'rgba(120,100,78,.5)';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([5, 5]);
  ctx.strokeRect(-w / 2 + 7, -h / 2 + 7, w - 14, h - 14);
  ctx.setLineDash([]);
  text(ctx, e.line, 0, 0, values);
}

// A stamp blank: white card with the perforations punched out of it.
function perforate(ctx, w, h, s) {
  ctx.save();
  ctx.fillStyle = '#fdfaf3';
  ctx.beginPath(); ctx.rect(-w / 2, -h / 2, w, h); ctx.fill();
  ctx.globalCompositeOperation = 'destination-out';
  for (let x = -w / 2; x <= w / 2; x += s) {
    ctx.beginPath(); ctx.arc(x, -h / 2, s * 0.42, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.arc(x, h / 2, s * 0.42, 0, 7); ctx.fill();
  }
  for (let y = -h / 2; y <= h / 2; y += s) {
    ctx.beginPath(); ctx.arc(-w / 2, y, s * 0.42, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.arc(w / 2, y, s * 0.42, 0, 7); ctx.fill();
  }
  ctx.restore();
}

function airmail_stamp(ctx) {
  const w = 150, h = 178, s = 11;
  perforate(ctx, w, h, s);

  ctx.save();
  ctx.beginPath(); ctx.rect(-w / 2 + 9, -h / 2 + 9, w - 18, h - 18); ctx.clip();
  for (let i = -18; i < 22; i++) {
    ctx.fillStyle = i % 2 ? '#dba7a7' : '#9db6cd';
    ctx.save(); ctx.translate(i * 14, 0); ctx.rotate(-38 * RAD);
    ctx.fillRect(-4, -160, 7, 320);
    ctx.restore();
  }
  ctx.fillStyle = '#fdfaf3';
  ctx.fillRect(-w / 2 + 22, -h / 2 + 22, w - 44, h - 44);
  ctx.restore();

  ctx.strokeStyle = 'rgba(110,90,70,.45)';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(-w / 2 + 22, -h / 2 + 22, w - 44, h - 44);
}

const EPHEMERA = { luggage_tag, postmark, paper_slip, airmail_stamp };

function ephemera(ctx, e, values) {
  const draw = EPHEMERA[e.type];
  if (!draw) return;
  ctx.save();
  ctx.translate(e.center[0], e.center[1]);
  ctx.rotate((e.rotation || 0) * RAD);
  draw(ctx, e, values);
  ctx.restore();
}

/* ---------- stickers ---------- */

// Cutout: the botanical plates are ink on white, so a multiply blend drops
// the paper away and leaves the drawing on whatever the page already is.
// Stamp: a photograph gets a perforated white border instead, because
// multiplying a photograph would only make a dark smudge.
function sticker(ctx, s) {
  const img = getArt(s.art);
  if (!img || !img.width) return;

  ctx.save();
  ctx.translate(s.center[0], s.center[1]);
  ctx.rotate((s.rotation || 0) * RAD);
  const scale = s.scale || 1;

  if (s.style === 'stamp') {
    const w = STAMP_W * scale;
    const h = w * (img.height / img.width) + 26 * scale;
    const pad = 11 * scale;
    ctx.save();
    ctx.shadowColor = 'rgba(58,44,30,.22)';
    ctx.shadowBlur = 14 * scale;
    ctx.shadowOffsetY = 5 * scale;
    perforate(ctx, w, h, 11 * scale);
    ctx.restore();
    perforate(ctx, w, h, 11 * scale);
    cover(ctx, img, -w / 2 + pad, -h / 2 + pad, w - pad * 2, h - pad * 2 - 14 * scale);
  } else {
    const h = STICKER_H * scale;
    const w = h * (img.width / img.height);
    ctx.globalCompositeOperation = 'multiply';
    ctx.drawImage(img, -w / 2, -h / 2, w, h);
  }
  ctx.restore();
}

/* ---------- slide ---------- */

function pageNumber(ctx, n, total) {
  ctx.save();
  ctx.font = '400 22px "Special Elite", monospace';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = PAGE_INK === INK ? 'rgba(120,108,96,.75)' : 'rgba(243,236,224,.6)';
  ctx.fillText(`${n} / ${total}`, W / 2, 1318);
  ctx.restore();
}

// opts: { photos: {1: HTMLImageElement}, values: {slot_id: string},
//         index, total }
function renderSlide(ctx, slide, opts) {
  opts = opts || {};
  const photos = opts.photos || {};
  const values = opts.values;
  const index = opts.index || 0;
  const total = opts.total || 1;
  const rnd = seeded(index + 1);

  PAGE_INK = DARK.has(slide.paper && slide.paper.tint) ? LIGHT_INK : INK;
  ctx.save();
  paper(ctx, slide.paper, rnd);
  (slide.texts || []).forEach((t) => text(ctx, t, t.center[0], t.center[1], values));
  if (slide.frame) frame(ctx, slide.frame, photos[slide.frame.photo_index], values);
  (slide.frames || []).forEach((f) => frame(ctx, f, photos[f.photo_index], values));
  if (slide.keepsake) keepsake(ctx, slide.keepsake, photos[slide.keepsake.user_photo], values);
  (slide.ephemera || []).forEach((e) => ephemera(ctx, e, values));
  (slide.stickers || []).forEach((k) => sticker(ctx, k));
  (slide.accents || []).forEach((a) => accent(ctx, a));
  pageNumber(ctx, index + 1, total);
  ctx.restore();
  PAGE_INK = INK;
}

function paint(canvas, slide, opts, scale) {
  scale = scale || 1;
  canvas.width = Math.round(W * scale);
  canvas.height = Math.round(H * scale);
  const ctx = canvas.getContext('2d');
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  renderSlide(ctx, slide, opts);
}

function toBlob(slide, opts) {
  const c = document.createElement('canvas');
  paint(c, slide, opts, 1);
  return new Promise((res) => c.toBlob(res, 'image/jpeg', 0.92));
}

// Every editable slot on a slide, so the editor can build its inputs.
function editableSlots(slide) {
  const out = [];
  const add = (s) => { if (s && s.editable) out.push(s); };
  (slide.texts || []).forEach(add);
  if (slide.frame) add(slide.frame.caption);
  (slide.frames || []).forEach((f) => add(f.caption));
  if (slide.keepsake) add(slide.keepsake.caption);
  (slide.ephemera || []).forEach((e) => {
    ['code', 'line', 'date'].forEach((k) => add(e[k]));
  });
  return out;
}

function fontsReady() {
  if (!document.fonts) return Promise.resolve();
  return Promise.all([
    document.fonts.load('400 80px "Caveat"'),
    document.fonts.load('400 80px "Special Elite"'),
    document.fonts.load('400 80px "Kalam"'),
    document.fonts.load('700 80px "Kalam"'),
  ]).catch(() => {});
}

export { W, H, renderSlide, paint, toBlob, editableSlots, fontsReady, TAPE };
