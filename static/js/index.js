document.addEventListener('DOMContentLoaded', () => {
  const tabs = document.querySelectorAll('.method-tab');
  const panels = document.querySelectorAll('.method-panel');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab;
      tabs.forEach(t => t.classList.toggle('is-active', t === tab));
      panels.forEach(p => p.classList.toggle('is-active', p.dataset.panel === target));
    });
  });

  document.querySelectorAll('.synth-carousel').forEach(initSynthCarousel);
});

function initSynthCarousel(root) {
  const track = root.querySelector('.synth-track');
  const slides = track.children;
  const dotsEl = root.querySelector('.synth-dots');
  let index = 0;

  // A single slide needs no navigation.
  if (slides.length < 2) {
    root.querySelectorAll('.synth-arrow').forEach(b => { b.hidden = true; });
    return;
  }

  const dots = Array.from(slides, (_, i) => {
    const dot = document.createElement('button');
    dot.className = 'synth-dot';
    dot.setAttribute('aria-label', `Show sequence ${i + 1}`);
    dot.addEventListener('click', () => go(i));
    dotsEl.appendChild(dot);
    return dot;
  });

  function go(i) {
    index = (i + slides.length) % slides.length;
    track.style.transform = `translateX(-${index * 100}%)`;
    dots.forEach((d, j) => d.classList.toggle('active', j === index));
  }

  root.querySelector('.synth-prev').addEventListener('click', () => go(index - 1));
  root.querySelector('.synth-next').addEventListener('click', () => go(index + 1));

  let startX = null;
  track.addEventListener('touchstart', e => { startX = e.touches[0].clientX; }, { passive: true });
  track.addEventListener('touchend', e => {
    if (startX === null) return;
    const dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) > 40) go(index + (dx < 0 ? 1 : -1));
    startX = null;
  });

  go(0);
}

function copyBibtex() {
  const code = document.getElementById('bibtex-block').innerText;
  const label = document.getElementById('copy-label');
  navigator.clipboard.writeText(code).then(() => {
    const original = label.textContent;
    label.textContent = 'Copied!';
    setTimeout(() => { label.textContent = original; }, 1500);
  }).catch(() => {
    label.textContent = 'Copy failed';
  });
}
