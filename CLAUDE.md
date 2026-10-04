# CLAUDE.md

Project page for the paper **"Token-to-Token Alignment of Text Embeddings for Semantic Blending"** (arXiv 2606.24021 — Saar Huberman, Ron Mokady, Or Patashnik, Daniel Cohen-Or; Tel Aviv University + BRIA AI). This repo is on the `site` branch and hosts a static HTML/CSS/JS webpage intended for GitHub Pages.

Reference sites used as templates: [SliderEdit](https://armanzarei.github.io/SliderEdit/) (primary), [SAP](https://tdpc2025.github.io/SAP/) (author-block pattern), Nerfies / Academic Project Page Template (base structure).

## Structure

```
T2T/
├── index.html                       # single-page site
├── static/
│   ├── css/
│   │   ├── index.css                # main styles (Castoro serif headings, blue #1a63d8 accents)
│   │   └── interactive_slider.css   # slider gallery styles (adapted from SliderEdit)
│   ├── js/
│   │   ├── index.js                 # method-section tab switching + BibTeX copy button
│   │   └── interactive_slider.js    # interpolation gallery: two side-by-side carousels (T2T_GROUPS)
│   └── images/
│       ├── teaser.png               # hero teaser (cropped from paper page 1)
│       ├── method_high_level.svg    # overall method figure (converted from PDF)
│       ├── stractural_alignment.svg # Stage 1 diagram (typo carried from source: "stractural")
│       ├── embedding_alignment.svg  # Stage 2 diagram
│       └── interpolations/          # interactive slider samples
│           └── origami/             # each sample = its own subdir
│               ├── alpha_00.jpg     # numbered frames: alpha_00.jpg .. alpha_{N-1}.jpg
│               ├── alpha_01.jpg
│               └── ...
└── Aligned_Semantic_Blend_arxiv.pdf # source paper (used for figure extraction)
```

## Page sections (top to bottom)

1. **Hero** — title, authors with superscript affiliations (Saar dual-affiliated ¹Tel Aviv + ²BRIA), arXiv + Code buttons.
2. **Interactive Interpolation Gallery** — no section heading/subtitle (removed). Two carousels side by side, one per task (`Continuous Editing`, `Continuous Blending`). Each carousel shows `SAMPLES_PER_PAGE = 2` cards per page and gains **dot pagination** underneath once a group has >2 samples. So the default view is 4 cards in a row (2 per task); paging reveals examples 3–4. Nav arrows were intentionally omitted (they collide between the two side-by-side carousels) — dots only.
3. **Teaser** — static PNG cropped from paper Fig. 1 (Direct vs. Aligned interpolation).
4. **Abstract** — verbatim from the paper.
5. **Method** — high-level figure + caption at top, then a 2-button toggle (`Stage 1 / Stage 2`) that swaps between structural- and embedding-alignment panels.
6. **Results** — placeholder image blocks (semantic blending, continuous editing, comparisons). Not yet populated.
7. **BibTeX** — with copy-to-clipboard button.
8. **Footer** — template attribution.

## Adding an interpolation sample

The data model is `T2T_GROUPS` (an array of `{ title, samples: [...] }`), **not** a flat list. Each group renders as one carousel.

1. Create a subdirectory under `static/images/interpolations/` (e.g. `cat_to_tiger/`).
2. Drop numbered frames in it using the convention `alpha_00.jpg, alpha_01.jpg, ...` (zero-padded to width 2). **Keep frames ~256×256** (see resolution note below).
3. Push a new entry into the relevant group's `samples` array in `static/js/interactive_slider.js`:
   ```js
   {
     dir: './static/images/interpolations/cat_to_tiger/',
     prefix: 'alpha_', ext: '.jpg', pad: 2, maxProbe: 100,
     inputs: 'none',           // 'none' | 'first' | 'ends' — input thumbnails
     caption: 'A cat turning into a tiger',   // plain text; shown below the slider
   }
   ```
   (`caption` replaces the old `left`/`right` endpoint labels; omit it to fall back to `left`/`right`.)
4. Frame counts are **auto-discovered** at load (dir listing on the dev server, probe fallback on GitHub Pages) — no `numFrames` needed. Empty samples are dropped; a group left with no usable samples is skipped.
5. **Bump the asset version** (see below) so browsers fetch the change.

### Resolution note
All current frames are **256×256**. The bacon frames were downscaled to 256 in-place and the 1024px originals were **overwritten (lost)**. Cards display images at ~228px, so 256 is fine. If you ever want notably larger, crisp images, re-export frames at ~512px (then optimize — 1024px JPEGs were ~360 KB each and slowed the page badly; 256px are ~26 KB).

## Converting new figures from paper PDFs

The paper's LaTeX figures should always be shipped as SVG (converted from PDF) rather than PNG screenshots. `pdf2svg` is installed on the box:

```bash
pdf2svg /path/to/figure.pdf /home/ubuntu/T2T/static/images/figure.svg
```

For a specific page: `pdf2svg paper.pdf out.svg <page_num>`. To crop to a sub-region, edit the resulting SVG's `viewBox` attribute (format: `viewBox="x y width height"` in PDF points). Page 1 of the paper is 612×792 pt; measured regions live in `MEMORY.md` if needed later.

For the teaser: we detected the figure occupies roughly `viewBox="100 220 410 128"` on page 1.

## Development

```bash
# Serve locally (VS Code Remote will auto-forward the port)
python3 -m http.server 8000
```

Known quirk: when this Python server process is killed and restarted, VS Code's port forward often drops silently and the browser gets "stuck". Fix by starting the next server on a **different** port (8080 → 8090 → 8100 …) — VS Code re-detects new ports and re-forwards automatically.

### Cache-busting (IMPORTANT)
CSS/JS are included with a `?v=N` query string in `index.html` (e.g. `interactive_slider.js?v=8`). Browsers cache by full URL, so **editing a JS/CSS file without bumping `?v=N` shows no change** (a stale cache masquerades as "the site didn't update" / "I only see origami"). **Every time you edit a versioned asset, bump its `?v=` number** in `index.html`. Current versions: `index.css?v=14`, `interactive_slider.css?v=13`, `index.js?v=6`, `interactive_slider.js?v=35`. `index.html` itself has no version param, so edits to it show on a normal refresh.

## Style conventions

- **Headings:** Castoro serif (from Google Fonts).
- **Body:** Noto Sans.
- **Accent color:** `#1a63d8` (blue) — used for links, method-tab pills, slider fill, stage badges.
- **Card style:** white background, 16 px radius, subtle box-shadow.
- **Diagrams:** SVG whenever possible (LaTeX figures → `pdf2svg`).
- **Section container:** `is-max-desktop` (960 px) for most sections; widescreen or fluid only when explicitly needed.

## Open items

- Author link for Ron Mokady currently points to `rmokady.github.io` (from SAP). Verify.
- Code button is a non-clickable "Code (coming soon)" `<span class="... is-static-soon">`. Once the repo is public, turn it back into `<a href="REPO_URL" target="_blank" class="external-link button is-normal is-rounded is-dark">` with label "Code".
- Results section: **Continuous Blending** is a `synth-carousel` — slide `library` (moved from the top gallery): one row of `.synthesis-cell`s — `image1.jpg` (label "Input A" via `data-label`), frames `alpha_040`, `050`, `060`, `070` (4), `image2.jpg` ("Input B"); slide `blend_surf` (`image_1` = Input A, `image_2`–`image_5` frames, `image_6` = Input B; files are 1024px — consider downscaling); slide `gymnastic` (inputs from `gymnastic/refernce/image1.jpg` (A) and `image2.jpg` (B) — folder name typo is real; frames `image2`–`image5`; refs are 1024px). **Continuous Editing** is a `synth-carousel` (same component as Synthesis; frames in `.synthesis-cell`s, first = source `alpha_00` labelled "Input", instruction as figcaption below) — slides `sprout_flower`, `breadbox` (caption "Close the lid of the box" is a placeholder — confirm real instruction), `room_to_forest`; rows size to any frame count. Top gallery editing = origami, grafity, bacon, cat_short_hair. The third block is **Continuous Synthesis** — a one-at-a-time carousel (arrows + dots, logic in `index.js`) of 6-frame strips from `static/images/interpolations_synthesis/`.
- Filename `stractural_alignment.svg` carries a typo from the source PDF. Rename if the SVG is regenerated with correct spelling.
- **Gallery is running on SIMULATION data.** In `interactive_slider.js`:
  - The **`Continuous Blending` group reuses the editing frames** (origami/bacon) as placeholders — replace with real blending samples (their own frame dirs).
  - **Both groups are padded to 4 samples** with duplicate "example 3/4 (placeholder)" entries (marked `SIMULATION ONLY`) so the carousel's 2nd page + dots are visible for testing. Remove these duplicates and swap in the real examples.
  - Plan: **4 examples per task** (origami + bacon are the 2 real editing examples so far).
- Real captions for editing are set (plain text, no "Edit instruction:" prefix). Blending captions are still the generic placeholder line.
