/* Decorative angular polylines only: no dependencies, requests, storage, or telemetry. */
(function () {
  'use strict';

  const canvas = document.getElementById('fluid-canvas');
  if (!canvas || !window.matchMedia || !window.requestAnimationFrame) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const compactScreen = window.matchMedia('(max-width: 767px)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const forcedColors = window.matchMedia('(forced-colors: active)');
  const printMode = window.matchMedia('print');
  const root = document.documentElement;
  const frameInterval = 1000 / 30;
  const pixelBudget = 2800000;
  const cycle = Math.PI * 200;
  const pointer = { x: 0, y: 0, targetX: 0, targetY: 0, strength: 0, active: false };

  let width = 1;
  let height = 1;
  let paths = [];
  let phase = 0;
  let frameId = 0;
  let lastFrame = 0;
  let dirty = true;
  let suspended = false;
  let dark = root.getAttribute('data-theme') === 'dark';
  let gradient;

  function staticMode() {
    return reducedMotion.matches || compactScreen.matches || !finePointer.matches;
  }

  function hidden() {
    return suspended || document.hidden || forcedColors.matches || printMode.matches;
  }

  function updatePalette() {
    dark = root.getAttribute('data-theme') === 'dark';
    const color = dark ? '151, 193, 212' : '77, 124, 153';
    gradient = ctx.createLinearGradient(0, 0, width, 0);
    gradient.addColorStop(0, 'rgba(' + color + ', 0)');
    gradient.addColorStop(0.10, 'rgba(' + color + ', 0.34)');
    gradient.addColorStop(0.54, 'rgba(' + color + ', 0.22)');
    gradient.addColorStop(0.90, 'rgba(' + color + ', 0.40)');
    gradient.addColorStop(1, 'rgba(' + color + ', 0.10)');
  }

  function resize() {
    width = Math.max(1, window.innerWidth);
    height = Math.max(1, window.innerHeight);
    // Bound both retina work and canvas memory, including very large monitors.
    const ratio = Math.min(window.devicePixelRatio || 1, 1.5,
      Math.sqrt(pixelBudget / (width * height)));
    canvas.width = Math.max(1, Math.floor(width * ratio));
    canvas.height = Math.max(1, Math.floor(height * ratio));
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    createPaths();
    updatePalette();
    dirty = true;
    sync();
  }

  function createPaths() {
    // Seeded, irregular walks: each one has its own direction and sharp turns.
    // Keeping a stable seed avoids a distracting reshuffle when resizing.
    let seed = 4147;
    function random() {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    }
    const count = Math.min(34, Math.max(15, Math.ceil(width * height / 34000)));
    const scale = Math.min(1.2, Math.max(0.65, width / 1200));
    paths = [];
    for (let i = 0; i < count; i++) {
      let x = random() * width;
      let y = random() * height;
      let angle = random() * Math.PI * 2;
      const points = [];
      const corners = 3 + Math.floor(random() * 4);
      for (let j = 0; j < corners; j++) {
        points.push({ x: x, y: y, phase: random() * Math.PI * 2 });
        // Alternate broad and tight bends rather than smooth or parallel lanes.
        angle += (random() - 0.5) * Math.PI * 1.35;
        const length = (65 + random() * 115) * scale;
        let nextX = x + Math.cos(angle) * length;
        let nextY = y + Math.sin(angle) * length;
        if (nextX < -40 || nextX > width + 40) {
          angle = Math.PI - angle;
          nextX = x + Math.cos(angle) * length;
        }
        if (nextY < -40 || nextY > height + 40) {
          angle = -angle;
          nextY = y + Math.sin(angle) * length;
        }
        x = nextX;
        y = nextY;
      }
      paths.push({ points: points, alpha: 0.46 + random() * 0.32, width: 0.65 + random() * 0.4 });
    }
  }

  function pointAt(point) {
    // Vertices drift slowly, while the segments between them stay straight.
    let x = point.x + Math.sin(phase * 0.09 + point.phase) * 8;
    let y = point.y + Math.cos(phase * 0.07 + point.phase) * 7;
    if (pointer.strength > 0.001) {
      const dx = x - pointer.x;
      const dy = y - pointer.y;
      const influence = Math.exp(-(dx * dx + dy * dy) / (150 * 150)) * pointer.strength;
      x += (8 - dy * 0.055) * influence;
      y += (dy * 0.20 + dx * 0.075) * influence;
    }
    return { x: x, y: y };
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'miter';
    ctx.miterLimit = 2;
    ctx.strokeStyle = gradient;
    paths.forEach(function (path) {
      ctx.lineWidth = path.width;
      ctx.globalAlpha = path.alpha;
      ctx.beginPath();
      path.points.forEach(function (vertex, index) {
        const point = pointAt(vertex);
        if (index === 0) ctx.moveTo(point.x, point.y);
        else ctx.lineTo(point.x, point.y);
      });
      ctx.stroke();
    });
    ctx.globalAlpha = 1;
    dirty = false;
  }

  function tick(now) {
    frameId = 0;
    if (hidden() || staticMode()) return;
    if (!lastFrame || now - lastFrame >= frameInterval) {
      // No big time jump after a paused tab or a slow frame.
      const elapsed = lastFrame ? Math.min((now - lastFrame) / 1000, 0.06) : 1 / 30;
      lastFrame = now;
      phase = (phase + elapsed) % cycle;
      const follow = 1 - Math.exp(-elapsed * 7);
      pointer.x += (pointer.targetX - pointer.x) * follow;
      pointer.y += (pointer.targetY - pointer.y) * follow;
      pointer.strength += ((pointer.active ? 1 : 0) - pointer.strength) * (1 - Math.exp(-elapsed * 4));
      draw();
    }
    frameId = window.requestAnimationFrame(tick);
  }

  function stop() {
    if (frameId) window.cancelAnimationFrame(frameId);
    frameId = 0;
    lastFrame = 0;
  }

  function sync() {
    if (hidden()) {
      stop();
      return;
    }
    if (staticMode()) {
      stop();
      pointer.active = false;
      pointer.strength = 0;
      if (dirty) draw();
    } else if (!frameId) {
      frameId = window.requestAnimationFrame(tick);
    }
  }

  function releasePointer() { pointer.active = false; }

  // Observe the page, never intercept its links, selection, or touch scrolling.
  window.addEventListener('pointermove', function (event) {
    if (staticMode() || hidden() || event.pointerType === 'touch') return;
    pointer.targetX = event.clientX;
    pointer.targetY = event.clientY;
    if (!pointer.active) {
      pointer.x = event.clientX;
      pointer.y = event.clientY;
    }
    pointer.active = true;
  }, { passive: true });
  document.documentElement.addEventListener('pointerleave', releasePointer, { passive: true });
  window.addEventListener('pointercancel', releasePointer, { passive: true });
  window.addEventListener('blur', releasePointer);
  window.addEventListener('resize', resize, { passive: true });
  document.addEventListener('visibilitychange', function () {
    releasePointer();
    pointer.strength = 0;
    sync();
  });
  window.addEventListener('pagehide', function () { suspended = true; stop(); });
  window.addEventListener('pageshow', function () { suspended = false; dirty = true; sync(); });

  [reducedMotion, compactScreen, finePointer, forcedColors, printMode].forEach(function (query) {
    const changed = function () { dirty = true; sync(); };
    if (query.addEventListener) query.addEventListener('change', changed);
    else if (query.addListener) query.addListener(changed);
  });
  if (window.MutationObserver) {
    new MutationObserver(function () {
      updatePalette();
      dirty = true;
      sync();
    }).observe(root, { attributes: true, attributeFilter: ['data-theme'] });
  }
  resize();
}());

