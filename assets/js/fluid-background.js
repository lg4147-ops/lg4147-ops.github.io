/* Decorative streamlines only: no dependencies, requests, storage, or telemetry. */
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
  let lineCount = 16;
  let segments = 60;
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
    lineCount = Math.min(26, Math.max(12, Math.ceil(height / 42)));
    segments = Math.min(110, Math.max(40, Math.ceil(width / 20)));
    updatePalette();
    dirty = true;
    sync();
  }

  function pointAt(x, lane) {
    const spacing = (height + 260) / (lineCount - 1);
    const origin = lane * spacing - 100;
    const scale = Math.min(1, width / 1000);
    // Shared long waves keep neighboring lines coherent, like a slow current.
    let y = origin - (x / width - 0.5) * 115 * scale
      + Math.sin(x / width * 5.0 + origin * 0.0016 - phase * 0.07) * 48 * scale
      + Math.sin(x / width * 9.0 - origin * 0.0012 + phase * 0.11) * 15 * scale;
    let px = x;
    if (pointer.strength > 0.001) {
      const dx = x - pointer.x;
      const dy = y - pointer.y;
      const influence = Math.exp(-(dx * dx + dy * dy) / (150 * 150)) * pointer.strength;
      // A small, smooth eddy rather than a push or a trail. Displacement is bounded.
      px += (8 - dy * 0.055) * influence;
      y += (dy * 0.20 + dx * 0.075) * influence;
    }
    return { x: px, y: y };
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = gradient;
    const left = -35;
    const span = width + 70;
    for (let lane = 0; lane < lineCount; lane++) {
      ctx.lineWidth = lane % 4 === 0 ? 1 : 0.7;
      ctx.globalAlpha = lane % 4 === 0 ? 0.9 : 0.64;
      ctx.beginPath();
      for (let step = 0; step <= segments; step++) {
        const point = pointAt(left + span * step / segments, lane);
        if (step === 0) ctx.moveTo(point.x, point.y);
        else ctx.lineTo(point.x, point.y);
      }
      ctx.stroke();
      // Short, soft accents moving along the same curves suggest fluid transport.
      if (!staticMode() && lane % 3 === 0) {
        const progress = (phase / cycle * 14 + lane * 0.173) % 1;
        const center = left + span * progress;
        const length = Math.min(105, width * 0.10);
        const color = dark ? '171, 208, 222' : '90, 143, 170';
        const accent = ctx.createLinearGradient(center - length, 0, center + length, 0);
        accent.addColorStop(0, 'rgba(' + color + ', 0)');
        accent.addColorStop(0.5, 'rgba(' + color + ', 0.30)');
        accent.addColorStop(1, 'rgba(' + color + ', 0)');
        ctx.strokeStyle = accent;
        ctx.lineWidth = 1.25;
        ctx.globalAlpha = 0.8;
        ctx.beginPath();
        for (let step = 0; step <= 12; step++) {
          const point = pointAt(center - length + 2 * length * step / 12, lane);
          if (step === 0) ctx.moveTo(point.x, point.y);
          else ctx.lineTo(point.x, point.y);
        }
        ctx.stroke();
        ctx.strokeStyle = gradient;
      }
    }
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
