/* Decorative emitting lines only: no dependencies, requests, storage, or telemetry. */
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
  const maxLines = 32;
  const maxTrail = 36;
  const sampleInterval = 0.05;
  const pointerRadius = 150;
  const maxSteer = 0.42;
  const pointer = { x: 0, y: 0, targetX: 0, targetY: 0, strength: 0, active: false };

  let width = 1;
  let height = 1;
  let lines = [];
  let frameId = 0;
  let lastFrame = 0;
  let lastUpdate = 0;
  let dirty = true;
  let suspended = false;
  let strokeColor;

  function staticMode() {
    return reducedMotion.matches || compactScreen.matches || !finePointer.matches;
  }

  function hidden() {
    return suspended || document.hidden || forcedColors.matches || printMode.matches;
  }

  function updatePalette() {
    strokeColor = root.getAttribute('data-theme') === 'dark'
      ? 'rgba(151, 193, 212, 0.38)' : 'rgba(77, 124, 153, 0.38)';
  }

  function sample(line) {
    line.trailX[line.next] = line.x;
    line.trailY[line.next] = line.y;
    line.next = (line.next + 1) % line.trailLength;
    line.count = Math.min(line.count + 1, line.trailLength);
  }

  function emit(line, prime) {
    // Every lifetime begins at a fresh position and direction, never in lanes.
    line.x = Math.random() * width;
    line.y = Math.random() * height;
    line.angle = Math.random() * Math.PI * 2;
    line.speed = 42 + Math.random() * 32;
    line.life = 5.5 + Math.random() * 3.5;
    line.age = prime ? 1 + Math.random() * (line.life - 2) : -Math.random() * 0.65;
    line.alpha = 0.65 + Math.random() * 0.35;
    line.width = 0.7 + Math.random() * 0.4;
    line.trailLength = 22 + Math.floor(Math.random() * (maxTrail - 21));
    line.side = Math.random() < 0.5 ? -1 : 1;
    line.steer = 0;
    line.sampleTime = 0;
    line.next = 0;
    line.count = 0;
    if (prime) {
      // A few already-travelling lines avoid a blank first frame; subsequent
      // emissions grow naturally from a point and fade out before respawning.
      const x = line.x;
      const y = line.y;
      for (let i = line.trailLength - 1; i >= 0; i--) {
        line.x = x - Math.cos(line.angle) * line.speed * sampleInterval * i;
        line.y = y - Math.sin(line.angle) * line.speed * sampleInterval * i;
        sample(line);
      }
      line.x = x;
      line.y = y;
    } else {
      sample(line);
    }
  }

  function createLines() {
    const count = Math.min(maxLines, Math.max(14, Math.ceil(width * height / 44000)));
    if (lines.length > count) lines.length = count;
    for (let i = lines.length; i < count; i++) {
      // Reused ring buffers bound memory throughout continuous emission.
      const line = { trailX: new Float32Array(maxTrail), trailY: new Float32Array(maxTrail) };
      emit(line, true);
      lines.push(line);
    }
  }

  function resize() {
    const oldWidth = width;
    const oldHeight = height;
    width = Math.max(1, window.innerWidth);
    height = Math.max(1, window.innerHeight);
    const ratio = Math.min(window.devicePixelRatio || 1, 1.5,
      Math.sqrt(pixelBudget / (width * height)));
    canvas.width = Math.max(1, Math.floor(width * ratio));
    canvas.height = Math.max(1, Math.floor(height * ratio));
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    // Preserve the composition when mobile browser chrome changes height;
    // a static fallback must not randomly reshuffle during touch scrolling.
    if (width !== oldWidth || height !== oldHeight) {
      const scaleX = width / oldWidth;
      const scaleY = height / oldHeight;
      lines.forEach(function (line) {
        line.x *= scaleX;
        line.y *= scaleY;
        for (let i = 0; i < maxTrail; i++) {
          line.trailX[i] *= scaleX;
          line.trailY[i] *= scaleY;
        }
      });
    }
    createLines();
    updatePalette();
    dirty = true;
    sync();
  }

  function advance(line, elapsed) {
    line.age += elapsed;
    if (line.age >= line.life || line.x < -150 || line.x > width + 150 ||
        line.y < -150 || line.y > height + 150) {
      emit(line, false);
      return;
    }
    if (line.age < 0) return;

    let targetSteer = 0;
    if (pointer.strength > 0.001) {
      const dx = line.x - pointer.x;
      const dy = line.y - pointer.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance < pointerRadius) {
        // A small local change of heading, not a drag or displacement of the
        // whole trail. The path already drawn stays behind the moving tip.
        const cross = Math.cos(line.angle) * dy - Math.sin(line.angle) * dx;
        const side = Math.abs(cross) < 1 ? line.side : (cross < 0 ? -1 : 1);
        const influence = 1 - distance / pointerRadius;
        targetSteer = side * maxSteer * influence * influence * pointer.strength;
      }
    }
    line.steer += (targetSteer - line.steer) * (1 - Math.exp(-elapsed * 4));
    const heading = line.angle + line.steer;
    line.x += Math.cos(heading) * line.speed * elapsed;
    line.y += Math.sin(heading) * line.speed * elapsed;
    line.sampleTime += elapsed;
    if (line.sampleTime >= sampleInterval) {
      line.sampleTime %= sampleInterval;
      sample(line);
    }
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = strokeColor;
    lines.forEach(function (line) {
      if (line.age < 0) return;
      const fade = Math.min(1, line.age / 0.8, (line.life - line.age) / 1.1);
      const oldest = (line.next - line.count + line.trailLength) % line.trailLength;
      ctx.lineWidth = line.width;
      // Small groups taper the short tail without allocating gradients or
      // new point arrays every frame. At most 32 lines and 36 points per line.
      for (let start = 0; start < line.count; start += 4) {
        const end = Math.min(start + 4, line.count);
        const first = (oldest + start) % line.trailLength;
        ctx.globalAlpha = line.alpha * fade * Math.pow((end + start + 1) / (2 * line.count + 1), 1.3);
        ctx.beginPath();
        ctx.moveTo(line.trailX[first], line.trailY[first]);
        for (let i = start + 1; i <= end; i++) {
          if (i === line.count) ctx.lineTo(line.x, line.y);
          else {
            const index = (oldest + i) % line.trailLength;
            ctx.lineTo(line.trailX[index], line.trailY[index]);
          }
        }
        ctx.stroke();
      }
    });
    ctx.globalAlpha = 1;
    dirty = false;
  }

  function tick(now) {
    frameId = 0;
    if (hidden() || staticMode()) return;
    if (!lastFrame || now - lastFrame >= frameInterval) {
      // Clamp slow frames and never catch up after a hidden tab.
      const elapsed = lastUpdate ? Math.min((now - lastUpdate) / 1000, 0.06) : 1 / 30;
      // Retain the fractional frame remainder on 60/120Hz displays.
      lastFrame = lastFrame ? now - (now - lastFrame) % frameInterval : now;
      lastUpdate = now;
      const follow = 1 - Math.exp(-elapsed * 7);
      pointer.x += (pointer.targetX - pointer.x) * follow;
      pointer.y += (pointer.targetY - pointer.y) * follow;
      pointer.strength += ((pointer.active ? 1 : 0) - pointer.strength) * (1 - Math.exp(-elapsed * 4));
      lines.forEach(function (line) { advance(line, elapsed); });
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
  root.addEventListener('pointerleave', releasePointer, { passive: true });
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
