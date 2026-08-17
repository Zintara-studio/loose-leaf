# Loose Leaf

Scrapbook carousel maker, React + Vite. Pick one of 53 templates, drop in
photos, edit the words, download 1080x1350 JPEGs. Nothing uploads anywhere -
photos go straight into a canvas in the tab and come back out as files.

```
npm install
npm run dev        # the app
npm run validate   # check every template against the spec
npm run build
```

| file | what it is |
|---|---|
| `system-prompt.md` | the brief the Template Designer model writes templates against |
| `src/engine.js` | section 4 made literal - draws a slide onto a canvas. No React in it |
| `src/deck.js` | 50 templates as compact descriptors |
| `src/build.js` | expands a descriptor into section-6 JSON |
| `src/templates.js` | 3 hand-written raw templates + the built 50, in one array |
| `src/art/` | public-domain sticker artwork, see `art/CREDITS.txt` |
| `src/Page.jsx` | the one canvas component: hero, cards, thumbnails, preview |
| `src/Logo.jsx`, `public/favicon.svg` | the mark: a loose leaf held by a strip of tape |
| `src/Gallery.jsx`, `src/Editor.jsx` | the two views |
| `validate.js` | `npm run validate` - names the slot and the rule when one is off |
| `render-check.html` | open it with the dev server up: renders every page full size |

## How a template varies

The spec pins a single-polaroid page to one narrow window, which is why early
versions all looked alike. Templates now vary on six axes:

- **page archetype** - `single` (one polaroid), `full` (photo bleeds to the
  page edge with the caption on a scrim), `collage` (three scattered frames),
  `mixed`, plus an optional `duo` page
- **paper** - `plain` `ruled` `kraft` `grid` `dot`, each with a `tint`
  (cream, blush, sage, sky, butter, lilac) or dark stock (charcoal, ink,
  which flips the ink light)
- **photo shape** - `rect`, `arch`, `circle`
- **cover rhythm** - six layouts, typewriter or handwritten display face, and
  the small word and stats line are each optional
- **signature** - a paper slip, luggage tag, postmark, airmail stamp, or a
  piece of real artwork
- **motifs** - sixteen drawn accents, placed in margin zones that dodge
  whatever else is on the page

## Placing photos

Each slot in the editor says which page it lands on, so the choice is
informed before you upload. A photo can be dropped straight from the desktop
onto a specific slot, dragged between slots to move it, nudged with the
arrow controls, or removed. The bulk "Add photos" button just fills whatever
gaps are left, in order.

## Editing photos

The edit control on a filled slot opens crop, zoom, 90-degree rotation and
six tone presets (warm, faded, film, cool, mono). Zoom past 1x and the
preview can be dragged to reframe; panning is clamped to the slack the zoom
leaves, so an empty edge can never be exposed. The preview uses the engine's
own crop maths at the frame's real aspect, padding included, so it cannot
promise a framing the page will not give. Edits travel with the photo when
slots are swapped and are applied to the downloaded JPEGs.

## Artwork

`src/art/` holds public-domain botanical plates (Redoute, Thome) and
photochrom prints (Library of Congress). Botanicals are drawn with a multiply
blend so their white paper drops away; photographs get a perforated stamp
border instead. Everything is bundled locally, which keeps the canvas
same-origin so `toBlob` keeps working. Nothing is scraped from Pinterest or
any stock site - see `src/art/CREDITS.txt`.

## Adding a template

Paste a model's JSON into `RAW` in `src/templates.js`, or add a descriptor to
`src/deck.js`, then run `npm run validate`. It names the slot and the rule.
