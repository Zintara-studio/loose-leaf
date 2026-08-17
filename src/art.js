// art.js - the sticker catalogue: real public-domain artwork, bundled so the
// canvas stays same-origin and toBlob keeps working. See art/CREDITS.txt.

const urls = import.meta.glob('./art/*.jpg', {
  eager: true, query: '?url', import: 'default',
});

export const ART_URLS = Object.fromEntries(
  Object.entries(urls).map(([path, url]) => [path.match(/([^/]+)\.jpg$/)[1], url]),
);

export const ART_NAMES = Object.keys(ART_URLS).sort();

const loaded = {};

export function getArt(name) {
  return loaded[name];
}

// Decoded up front: the canvas draws synchronously and has no reflow, so a
// page painted before the art arrives would just be missing it.
export function artReady() {
  return Promise.all(ART_NAMES.map((name) => new Promise((resolve) => {
    const img = new Image();
    img.onload = () => { loaded[name] = img; resolve(); };
    img.onerror = resolve;
    img.src = ART_URLS[name];
  })));
}
