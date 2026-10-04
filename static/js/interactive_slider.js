/**
 * Interpolation slider gallery.
 * Samples are organized into GROUPS (one per task, e.g. "Continuous Editing").
 * Each group renders as its own CAROUSEL showing SAMPLES_PER_PAGE cards at a time
 * and paging through the rest with dot navigation. The groups sit side by side, so
 * with 2 tasks × 2 cards-per-page you get 4 cards in a row. Add more examples to a
 * group and its carousel gains extra pages automatically.
 *
 * Each sample is a directory of numbered frames: alpha_00.jpg, alpha_01.jpg, ...
 * Frames are auto-discovered at load time. A sample whose directory has no frames
 * is dropped; a group left with no usable samples is skipped entirely.
 *
 * Sample fields:
 *   caption — text shown below the slider (e.g. the edit instruction / prompt).
 *             If omitted, the left/right endpoint labels are used instead.
 *   inputs  — which frames to show as input thumbnails: 'none' | 'first' | 'ends'
 */
const T2T_GROUPS = [
  {
    title: 'Continuous Editing',
    samples: [
      {
        dir: './static/images/interpolations_edit/origami/',
        prefix: 'alpha_', ext: '.jpg', pad: 2, maxProbe: 100,
        inputs: 'none',
        refs: [{ file: 'alpha_00.jpg' }],
        caption: 'Turn the white origami crane into a green origami dragon',
      },
      {
        dir: './static/images/interpolations_edit/grafity/',
        prefix: 'alpha_', ext: '.jpg', pad: 2, maxProbe: 100,
        inputs: 'none',
        refs: [{ file: 'alpha_00.jpg' }],
        caption: 'Erase the graffiti from the wall',
      },
      {
        dir: './static/images/interpolations_edit/bacon/',
        prefix: 'alpha_', ext: '.jpg', pad: 2, maxProbe: 100,
        inputs: 'none',
        refs: [{ file: 'alpha_00.jpg' }],
        caption: 'Make the bacon strips crisp and burnt',
      },
      {
        dir: './static/images/interpolations_edit/cat_short_hair/',
        prefix: 'alpha_', ext: '.jpg', pad: 2, maxProbe: 100,
        inputs: 'none',
        refs: [{ file: 'alpha_00.jpg' }],
        caption: 'Change the cat to be short-haired',
      },
    ],
  },
  {
    title: 'Continuous Blending',
    samples: [
      {
        dir: './static/images/interpolations_blend/farmer_lab/',
        prefix: 'alpha_', ext: '.jpg', pad: 3, maxProbe: 101,
        inputs: 'none',
        refs: [
          { file: 'image_0.jpg' },
          { file: 'image_1.jpg' },
        ],
      },
      {
        dir: './static/images/interpolations_blend/fire_marshmelow/',
        prefix: 'alpha_', ext: '.jpg', pad: 3, maxProbe: 101,
        inputs: 'none',
        refs: [
          { file: 'image_0.jpg' },
          { file: 'image_1.jpg' },
        ],
      },
      {
        dir: './static/images/interpolations_blend/monkey/',
        prefix: 'alpha_', ext: '.jpg', pad: 3, maxProbe: 101,
        inputs: 'none',
        refs: [
          { file: 'alpha_010.jpg' },
          { file: 'alpha_090.jpg' },
        ],
      },
      {
        dir: './static/images/interpolations_blend/lumberjack/',
        prefix: 'alpha_', ext: '.jpg', pad: 3, maxProbe: 101,
        inputs: 'none',
        refs: [
          { file: 'image_0.jpg' },
          { file: 'image_1.jpg' },
        ],
      },
    ],
  },
];

// How many cards each carousel shows per page.
const SAMPLES_PER_PAGE = 2;

// Build a URL for a raw file number (e.g. alpha_07.jpg).
function frameUrlFor(sample, fileNum) {
  return `${sample.dir}${sample.prefix}${String(fileNum).padStart(sample.pad, '0')}${sample.ext}`;
}

// Build a URL for the i-th usable frame (maps through the discovered frame list).
function frameUrl(sample, i) {
  return frameUrlFor(sample, sample.frames[i]);
}

function probeFrame(url) {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;
  });
}

// Discover which frames exist in a sample's directory.
// Primary: read a directory listing (dev servers and many hosts serve one) — one
// request, exact answer. Fallback: probe file numbers 0..maxProbe-1 by loading them
// (for hosts without listings, e.g. GitHub Pages).
async function discoverFrames(sample) {
  try {
    const res = await fetch(sample.dir, { cache: 'no-store' });
    if (res.ok) {
      const html = await res.text();
      const re = new RegExp(`${sample.prefix}(\\d+)\\${sample.ext}`, 'g');
      const nums = new Set();
      let m;
      while ((m = re.exec(html)) !== null) nums.add(parseInt(m[1], 10));
      if (nums.size) {
        sample.frames = [...nums].sort((a, b) => a - b);
        sample.numFrames = sample.frames.length;
        return;
      }
    }
  } catch (e) {
    // No listing available (e.g. GitHub Pages) — fall back to probing.
  }

  const max = sample.maxProbe || 100;
  const found = await Promise.all(
    Array.from({ length: max }, (_, n) => probeFrame(frameUrlFor(sample, n)))
  );
  sample.frames = found.map((ok, n) => (ok ? n : -1)).filter(n => n >= 0);
  sample.numFrames = sample.frames.length;
}

class InterpolationGallery {
  constructor(containerId, groups) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;
    this.groups = groups;
    // Flat list of every sample, with a stable global index for element IDs.
    this.samples = groups.flatMap(g => g.samples);
    // Global index at which each group's samples start.
    this.offsets = [];
    let acc = 0;
    for (const g of groups) { this.offsets.push(acc); acc += g.samples.length; }
    this.perPage = SAMPLES_PER_PAGE;
    this.pages = groups.map(() => 0); // current page per group
    this.totalPages = groups.map(g => Math.max(1, Math.ceil(g.samples.length / this.perPage)));
    this.preload();
    this.render();
    this.attach();
    this.samples.forEach((_, i) => this.setFrame(i, 0));
  }

  preload() {
    this.samples.forEach(s => {
      for (let i = 0; i < s.numFrames; i++) {
        const img = new Image();
        img.src = frameUrl(s, i);
      }
    });
  }

  render() {
    const carousels = this.groups.map((g, gi) => this.renderCarousel(g, gi)).join('');
    this.container.innerHTML = `<div class="interp-carousels">${carousels}</div>`;
  }

  renderCarousel(group, gi) {
    const total = this.totalPages[gi];
    const showNav = total > 1;
    let pagesHtml = '';
    for (let p = 0; p < total; p++) {
      const start = p * this.perPage;
      const items = group.samples.slice(start, start + this.perPage);
      pagesHtml += `<div class="interp-page">${items
        .map((s, k) => this.renderCard(s, this.offsets[gi] + start + k))
        .join('')}</div>`;
    }
    return `
      <div class="interp-group">
        ${group.title ? `<h3 class="interp-group-title">${group.title}</h3>` : ''}
        <div class="interp-viewport">
          <div class="interp-track" id="interpTrack_${gi}">${pagesHtml}</div>
        </div>
        ${showNav ? `<div class="interp-pagination" data-group="${gi}">${this.renderDots(gi, total)}</div>` : ''}
      </div>`;
  }

  renderDots(gi, total) {
    let html = '';
    for (let i = 0; i < total; i++) {
      html += `<button class="interp-dot${i === 0 ? ' active' : ''}" data-group="${gi}" data-page="${i}"></button>`;
    }
    return html;
  }

  renderCard(sample, index) {
    const firstUrl = frameUrl(sample, 0);
    return `
      <div class="interp-card">
        ${sample.title ? `<h4 class="interp-card-title">${sample.title}</h4>` : ''}
        <div class="interp-frame-container">
          <img class="interp-frame" id="interpFrame_${index}" src="${firstUrl}" alt="Interpolation frame">
        </div>
        <div class="interp-controls">
          <button class="interp-step decrement" data-i="${index}" data-d="-1" disabled>
            <i class="fas fa-minus"></i>
          </button>
          <input type="range" class="interp-slider"
                 id="interpSlider_${index}"
                 min="0" max="${sample.numFrames - 1}" step="1" value="0"
                 data-i="${index}">
          <button class="interp-step increment" data-i="${index}" data-d="1"${sample.numFrames <= 1 ? ' disabled' : ''}>
            <i class="fas fa-plus"></i>
          </button>
        </div>
        ${this.renderBelow(sample)}
      </div>
    `;
  }

  // Everything under the slider. Single reference (editing): image on the left,
  // caption text on the right. Two references (blending): both images in a row,
  // caption underneath.
  renderBelow(sample) {
    const hasRefs = sample.refs && sample.refs.length;
    if (!hasRefs && !sample.caption) return this.renderEndpoints(sample);
    const single = hasRefs && sample.refs.length === 1;
    const text = sample.caption ? `<p class="interp-caption-text">${sample.caption}</p>` : '';
    return `
      <div class="interp-below${single ? ' single' : ' multi'}">
        ${this.renderRefs(sample)}
        ${text}
      </div>
    `;
  }

  // Reference image(s) shown above the slider frame: the source (editing) or the
  // two images being blended. Files are relative to the sample's dir.
  renderRefs(sample) {
    if (!sample.refs || !sample.refs.length) return '';
    const single = sample.refs.length === 1;
    return `
      <div class="interp-refs${single ? ' single' : ''}">
        ${sample.refs.map(r => `
          <figure class="interp-ref">
            <img src="${sample.dir}${r.file}" alt="${r.label || 'Reference'}">
            ${r.label ? `<figcaption>${r.label}</figcaption>` : ''}
          </figure>`).join('')}
      </div>
    `;
  }

  renderEndpoints(sample) {
    return `
      <div class="interp-endpoints">
        <span class="interp-endpoint">${sample.left || ''}</span>
        <span class="interp-endpoint">${sample.right || ''}</span>
      </div>
    `;
  }

  renderInputThumbs(sample) {
    if (!sample.inputs || sample.inputs === 'none') return '';
    const idxs = sample.inputs === 'ends' && sample.numFrames > 1
      ? [0, sample.numFrames - 1]
      : [0];
    return `
      <div class="interp-input-thumbs">
        ${idxs.map(i => `
          <figure class="interp-input-thumb">
            <img src="${frameUrl(sample, i)}" alt="Input image">
            <figcaption>Input</figcaption>
          </figure>`).join('')}
      </div>
    `;
  }

  renderCaption(sample) {
    return `
      <div class="interp-caption">
        ${this.renderInputThumbs(sample)}
        <p class="interp-caption-text">${sample.caption}</p>
      </div>
    `;
  }

  attach() {
    this.container.querySelectorAll('.interp-pagination').forEach(pag => {
      pag.addEventListener('click', (e) => {
        if (e.target.classList.contains('interp-dot')) {
          this.goto(parseInt(e.target.dataset.group, 10), parseInt(e.target.dataset.page, 10));
        }
      });
    });

    this.samples.forEach((_, i) => {
      const slider = document.getElementById(`interpSlider_${i}`);
      if (slider) slider.addEventListener('input', (e) => this.setFrame(i, parseInt(e.target.value, 10)));
    });

    this.container.querySelectorAll('.interp-step').forEach(btn => {
      btn.addEventListener('click', () => {
        const i = parseInt(btn.dataset.i, 10);
        const d = parseInt(btn.dataset.d, 10);
        const slider = document.getElementById(`interpSlider_${i}`);
        const nextV = Math.min(Math.max(0, parseInt(slider.value, 10) + d), this.samples[i].numFrames - 1);
        slider.value = nextV;
        this.setFrame(i, nextV);
      });
    });
  }

  goto(groupIndex, pageIndex) {
    const total = this.totalPages[groupIndex];
    if (pageIndex < 0 || pageIndex >= total) return;
    this.pages[groupIndex] = pageIndex;
    const carousel = this.container.querySelectorAll('.interp-group')[groupIndex];
    if (!carousel) return;
    carousel.querySelector('.interp-track').style.transform = `translateX(-${pageIndex * 100}%)`;
    carousel.querySelectorAll('.interp-dot').forEach((d, i) => d.classList.toggle('active', i === pageIndex));
  }

  setFrame(sampleIndex, frameIndex) {
    const sample = this.samples[sampleIndex];
    const frame = document.getElementById(`interpFrame_${sampleIndex}`);
    if (!frame) return;
    frame.src = frameUrl(sample, frameIndex);

    const slider = document.getElementById(`interpSlider_${sampleIndex}`);
    if (slider) {
      const fill = sample.numFrames > 1 ? (frameIndex / (sample.numFrames - 1)) * 100 : 0;
      slider.style.background = `linear-gradient(to right, #1a63d8 0%, #1a63d8 ${fill}%, #e2e4e8 ${fill}%, #e2e4e8 100%)`;
    }
    const card = frame.closest('.interp-card');
    if (card) {
      const dec = card.querySelector('.interp-step.decrement');
      const inc = card.querySelector('.interp-step.increment');
      if (dec) dec.disabled = frameIndex === 0;
      if (inc) inc.disabled = frameIndex === sample.numFrames - 1;
    }
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  const allSamples = T2T_GROUPS.flatMap(g => g.samples);
  try {
    await Promise.all(allSamples.map(discoverFrames));
  } catch (e) {
    console.error('Interpolation gallery: frame discovery failed:', e);
  }
  // Drop empty samples, then drop groups left with no usable samples.
  const groups = T2T_GROUPS
    .map(g => ({ ...g, samples: g.samples.filter(s => s.numFrames > 0) }))
    .filter(g => g.samples.length > 0);
  if (!groups.length) {
    console.warn('Interpolation gallery: no frames found for any sample.');
  }
  new InterpolationGallery('interpolationGallery', groups);
});
