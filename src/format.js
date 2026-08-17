// format.js - the page sizes, and the band inside each one that content is
// allowed to use. Shared by the engine, the builder and the validator so
// they cannot drift apart.
//
// Every format is 1080 wide, so only vertical space differs. Stories are
// 1920 tall but Instagram covers roughly the top and bottom 260px with its
// own UI, which is why the story band is only a little taller than the
// post band rather than half as tall again.

export const FORMATS = {
  post: { size: [1080, 1350], band: [60, 1290], label: 'carousel 4:5' },
  story: { size: [1080, 1920], band: [268, 1652], label: 'story 9:16' },
  square: { size: [1080, 1080], band: [52, 1028], label: 'square 1:1' },
};

export const REF = 'post';
export const DEFAULT_FORMAT = REF;

const height = (f) => {
  const [a, b] = (FORMATS[f] || FORMATS[REF]).band;
  return b - a;
};

// how much taller or shorter this format's band is than the reference
export const scaleY = (f) => height(f) / height(REF);

// a y written in post space, moved into another format's band
export const mapY = (f, y) =>
  FORMATS[f].band[0] + (y - FORMATS[REF].band[0]) * scaleY(f);

export const sizeOfFormat = (f) => (FORMATS[f] || FORMATS[REF]).size;
