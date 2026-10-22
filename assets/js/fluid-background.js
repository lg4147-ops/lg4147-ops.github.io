/* Local-only sakura petals: no dependencies, network requests, storage, or telemetry. */
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
  const pixelBudget = 2800000;
  const pointerRadius = 125;
  const pointer = { x: 0, y: 0, strength: 0, active: false };
  const palettes = {
    light: ['#e6a0b8', '#edb3c7', '#d98ca8', '#f0c2d1'],
    dark: ['#e6a3bc', '#efb9cc', '#ce8eac', '#f1c7d7']
  };

  let width = 1;
  let height = 1;
  let petals = [];
  let colors = palettes.light;
  let frameId = 0;
  let lastFrame = 0;
  let lastUpdate = 0;
  let dirty = true;
  let suspended = false;

  function hidden() {
    return suspended || document.hidden || forcedColors.matches || printMode.matches;
  }

  function updatePalette() {
    colors = root.getAttribute('data-theme') === 'dark' ? palettes.dark : palettes.light;
  }

  function resetPetal(petal, initial) {
    petal.x = Math.random() * (width + 80) - 40;
    petal.y = initial ? Math.random() * height : -25 - Math.random() * 60;
    petal.size = 6 + Math.random() * 5;
    petal.fall = 20 + Math.random() * 20;
    petal.drift = -7 + Math.random() * 18;
    petal.phase = Math.random() * Math.PI * 2;
    petal.flutter = 0.65 + Math.random() * 0.75;
    petal.angle = Math.random() * Math.PI * 2;
    petal.spin = (Math.random() - 0.5) * 0.9;
    petal.alpha = 0.48 + Math.random() * 0.28;
    petal.color = Math.floor(Math.random() * palettes.light.length);
    petal.vx = 0;
    petal.vy = 0;
  }

  function sizePool() {
    // Fewer petals on phones, with a hard bound for large/high-DPI displays.
    const maximum = compactScreen.matches ? 24 : 64;
    const count = Math.min(maximum, Math.max(14, Math.round(width * height / 26000)));
    if (petals.length > count) petals.length = count;
    while (petals.length < count) {
      const petal = {};
      resetPetal(petal, true);
      petals.push(petal);
    }
  }

  function resize() {
    const oldWidth = width;
    const oldHeight = height;
    width = Math.max(1, window.innerWidth);
    height = Math.max(1, window.innerHeight);
    const ratio = Math.min(window.devicePixelRatio || 1, 1.75,
      Math.sqrt(pixelBudget / (width * height)));
    canvas.width = Math.max(1, Math.floor(width * ratio));
    canvas.height = Math.max(1, Math.floor(height * ratio));
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    // Preserve positions rather than reshuffling on mobile browser-chrome changes.
    petals.forEach(function (petal) {
      petal.x *= width / oldWidth;
      petal.y *= height / oldHeight;
    });
    sizePool();
    updatePalette();
    dirty = true;
    sync();
  }

  function advance(petal, elapsed) {
    petal.phase += petal.flutter * elapsed;
    const damping = Math.exp(-1.8 * elapsed);
    petal.vx *= damping;
    petal.vy *= damping;

    if (pointer.strength > 0.001) {
      const dx = petal.x - pointer.x;
      const dy = petal.y - pointer.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance < pointerRadius) {
        const influence = 1 - distance / pointerRadius;
        const force = 260 * influence * influence * pointer.strength;
        // A tiny breeze moves nearby petals away and gives them a gentle swirl.
        // The fallback direction keeps an exact pointer/petal overlap finite.
        const nx = distance > 0.1 ? dx / distance : Math.cos(petal.phase);
        const ny = distance > 0.1 ? dy / distance : Math.sin(petal.phase);
        petal.vx += (nx * force - ny * force * 0.22) * elapsed;
        petal.vy += (ny * force + nx * force * 0.22) * elapsed;
      }
    }

    petal.x += (petal.drift + Math.sin(petal.phase) * 13 + petal.vx) * elapsed;
    petal.y += (petal.fall + Math.cos(petal.phase * 0.7) * 4 + petal.vy) * elapsed;
    petal.angle += (petal.spin + petal.vx * 0.006) * elapsed;

    if (petal.y > height + 30) resetPetal(petal, false);
    // Horizontal wrap avoids abrupt changes to a petal's fall or color.
    if (petal.x > width + 40) petal.x = -40;
    else if (petal.x < -40) petal.x = width + 40;
  }

  function drawPetal(petal) {
    const scale = petal.size * (compactScreen.matches ? 0.82 : 1);
    ctx.save();
    ctx.translate(petal.x, petal.y);
    ctx.rotate(petal.angle);
    // Slow tumbling reveals the petal's edge without flashing or disappearing.
    ctx.scale(scale * (0.58 + Math.sin(petal.phase) * 0.27), scale);
    ctx.globalAlpha = petal.alpha;
    ctx.fillStyle = colors[petal.color];
    ctx.beginPath();
    ctx.moveTo(0, 0.92);
    ctx.bezierCurveTo(-0.28, 0.62, -0.88, 0.08, -0.66, -0.52);
    ctx.bezierCurveTo(-0.53, -0.94, -0.17, -0.99, 0, -0.64);
    // The shallow cleft at the rounded tip is characteristic of sakura petals.
    ctx.bezierCurveTo(0.20, -0.96, 0.57, -0.88, 0.68, -0.48);
    ctx.bezierCurveTo(0.88, 0.07, 0.30, 0.65, 0, 0.92);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = petal.alpha * 0.4;
    ctx.strokeStyle = '#fff7fb';
    ctx.lineWidth = 0.065;
    ctx.beginPath();
    ctx.moveTo(0, 0.68);
    ctx.quadraticCurveTo(-0.13, 0.05, 0, -0.45);
    ctx.stroke();
    ctx.restore();
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    petals.forEach(drawPetal);
    dirty = false;
  }

  function tick(now) {
    frameId = 0;
    if (hidden() || reducedMotion.matches) return;
    const interval = 1000 / (compactScreen.matches ? 20 : 30);
    if (!lastFrame || now - lastFrame >= interval) {
      // Never catch up elapsed time after a hidden tab or a slow frame.
      const elapsed = lastUpdate ? Math.min((now - lastUpdate) / 1000, 0.06) : 1 / 30;
      lastFrame = lastFrame ? now - (now - lastFrame) % interval : now;
      lastUpdate = now;
      pointer.strength += ((pointer.active ? 1 : 0) - pointer.strength) * (1 - Math.exp(-elapsed * 6));
      petals.forEach(function (petal) { advance(petal, elapsed); });
      draw();
    }
    frameId = window.requestAnimationFrame(tick);
  }

  function stop() {
    if (frameId) window.cancelAnimationFrame(frameId);
    frameId = 0;
    lastFrame = 0;
    lastUpdate = 0;
  }

  function releasePointer() { pointer.active = false; }

  function sync() {
    if (hidden()) {
      stop();
      return;
    }
    if (reducedMotion.matches) {
      stop();
      releasePointer();
      pointer.strength = 0;
      if (dirty) draw();
    } else if (!frameId) {
      frameId = window.requestAnimationFrame(tick);
    }
  }

  // Listen passively on the window: the canvas never blocks links or scrolling.
  window.addEventListener('pointermove', function (event) {
    if (reducedMotion.matches || hidden() || !finePointer.matches || event.pointerType === 'touch') return;
    pointer.x = event.clientX;
    pointer.y = event.clientY;
    pointer.active = true;
  }, { passive: true });
  root.addEventListener('pointerleave', releasePointer, { passive: true });
  window.addEventListener('pointercancel', releasePointer, { passive: true });
  window.addEventListener('blur', releasePointer);
  window.addEventListener('resize', resize, { passive: true });
  document.addEventListener('visibilitychange', function () {
    releasePointer();
    pointer.strength = 0;
    sync();
  });
  window.addEventListener('pagehide', function () {
    suspended = true;
    releasePointer();
    pointer.strength = 0;
    stop();
  });
  window.addEventListener('pageshow', function () { suspended = false; dirty = true; sync(); });

  [reducedMotion, compactScreen, finePointer, forcedColors, printMode].forEach(function (query) {
    const changed = function () { releasePointer(); pointer.strength = 0; resize(); };
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
