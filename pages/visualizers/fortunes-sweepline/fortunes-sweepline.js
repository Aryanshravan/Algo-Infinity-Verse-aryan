document.addEventListener('DOMContentLoaded', () => {
  initSweepline();
});

// ==========================================
// 1. STATE & CONSTANTS
// ==========================================
let state = {
  sites: [],
  sweepX: 0,
  isPlaying: false,
  showAllParabolas: true,
  showEmptyCircles: false,

  // Canvas
  w: 800,
  h: 600,

  animFrame: null,
};

// DOM
const els = {
  cvs: document.getElementById('slCanvas'),
  lblX: document.getElementById('lblSweepX'),
  btnPlay: document.getElementById('btnPlayPause'),
  iconPlay: document.getElementById('iconPlay'),
  sliderTime: document.getElementById('sliderTime'),

  btnRand: document.getElementById('btnRandom'),
  btnClear: document.getElementById('btnClear'),

  tglPara: document.getElementById('tglPara'),
  tglCircle: document.getElementById('tglCircle'),

  tooltip: document.getElementById('mathTooltip'),
};

let ctx;

// ==========================================
// 2. INITIALIZATION & INPUT
// ==========================================
function initSweepline() {
  ctx = els.cvs.getContext('2d');

  els.sliderTime.max = state.w;

  // Events
  els.btnRand.addEventListener('click', () => {
    for (let i = 0; i < 10; i++) {
      state.sites.push({
        x: 50 + Math.random() * (state.w - 100),
        y: 50 + Math.random() * (state.h - 100),
        color: `hsl(${Math.random() * 360}, 70%, 50%)`,
      });
    }
    state.sites.sort((a, b) => a.x - b.x); // Sort by X
    render();
  });

  els.btnClear.addEventListener('click', () => {
    state.sites = [];
    state.sweepX = 0;
    els.sliderTime.value = 0;
    render();
  });

  els.cvs.addEventListener('click', (e) => {
    const rect = els.cvs.getBoundingClientRect();
    state.sites.push({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      color: `hsl(${Math.random() * 360}, 70%, 50%)`,
    });
    state.sites.sort((a, b) => a.x - b.x);
    render();
  });

  els.sliderTime.addEventListener('input', (e) => {
    state.sweepX = parseFloat(e.target.value);
    if (state.isPlaying) togglePlay(); // pause if scrubbing manually
    render();
  });

  els.btnPlay.addEventListener('click', togglePlay);

  els.tglPara.addEventListener('change', (e) => {
    state.showAllParabolas = e.target.checked;
    render();
  });

  els.tglCircle.addEventListener('change', (e) => {
    state.showEmptyCircles = e.target.checked;
    render();
  });

  // Tooltip logic
  els.cvs.addEventListener('mousemove', (e) => {
    const rect = els.cvs.getBoundingClientRect();
    const mx = e.clientX - rect.left;

    // If mouse is near the sweepline, show tooltip
    if (Math.abs(mx - state.sweepX) < 50 && state.sites.length > 0) {
      els.tooltip.classList.add('visible');
    } else {
      els.tooltip.classList.remove('visible');
    }
  });
  els.cvs.addEventListener('mouseout', () => els.tooltip.classList.remove('visible'));

  els.btnRand.click(); // Start with some sites
}

function togglePlay() {
  state.isPlaying = !state.isPlaying;
  els.iconPlay.className = state.isPlaying ? 'fas fa-pause' : 'fas fa-play';

  if (state.isPlaying) {
    if (state.sweepX >= state.w) {
      state.sweepX = 0;
      els.sliderTime.value = 0;
    }
    loop();
  } else {
    cancelAnimationFrame(state.animFrame);
  }
}

function loop() {
  if (!state.isPlaying) return;

  state.sweepX += 2; // speed
  if (state.sweepX > state.w) {
    state.sweepX = state.w;
    togglePlay();
  }

  els.sliderTime.value = state.sweepX;
  render();

  state.animFrame = requestAnimationFrame(loop);
}

// ==========================================
// 3. CORE GEOMETRY MATH (FRAME BY FRAME)
// ==========================================
// To support perfectly scrubbing forwards AND backwards in time smoothly without managing
// complex O(N log N) event queues (which are hard to rewind), we calculate the valid
// geometric state of the beachline dynamically for the current SweepX.

function getParabolaX(focusX, focusY, sweepX, y) {
  if (Math.abs(focusX - sweepX) < 0.1) return focusX; // degenerate line
  // x = (y - yf)^2 / 2(xf - sweepX) + (xf + sweepX) / 2
  // But since sweepline is scanning right, focusX < sweepX.
  // So xf - sweepX is negative. This means parabola opens to the left (X is smaller).
  return Math.pow(y - focusY, 2) / (2 * (focusX - sweepX)) + (focusX + sweepX) / 2;
}

// ==========================================
// 4. RENDERING ENGINE
// ==========================================
function render() {
  ctx.clearRect(0, 0, state.w, state.h);
  els.lblX.textContent = state.sweepX.toFixed(1);

  // Draw Voronoi Edges
  drawVoronoiEdges();

  // Draw Beachline and Parabolas
  drawBeachline();

  // Draw Circle Events
  if (state.showEmptyCircles) {
    drawCircleEvents();
  }

  // Draw Sweepline
  ctx.strokeStyle = '#00f0ff'; // Cyan
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(state.sweepX, 0);
  ctx.lineTo(state.sweepX, state.h);
  ctx.stroke();

  // Draw Sites
  state.sites.forEach((s) => {
    ctx.fillStyle = s.color;
    ctx.beginPath();
    ctx.arc(s.x, s.y, 4, 0, Math.PI * 2);
    ctx.fill();

    // Site processed?
    if (s.x < state.sweepX) {
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  });
}

function drawBeachline() {
  // Only consider sites to the left of the sweepline
  const activeSites = state.sites.filter((s) => s.x < state.sweepX);
  if (activeSites.length === 0) return;

  // For every Y pixel (0 to H), find which site has the MAXIMUM X (right-most boundary)
  // This forms the true "Beachline" envelope.

  ctx.strokeStyle = '#d946ef'; // Magenta
  ctx.lineWidth = 3;
  ctx.shadowColor = '#d946ef';
  ctx.shadowBlur = 10;

  ctx.beginPath();
  let started = false;

  for (let y = 0; y <= state.h; y += 2) {
    let maxX = -Infinity;

    for (let i = 0; i < activeSites.length; i++) {
      const s = activeSites[i];
      const px = getParabolaX(s.x, s.y, state.sweepX, y);
      if (px > maxX) {
        maxX = px;
      }
    }

    if (!started) {
      ctx.moveTo(maxX, y);
      started = true;
    } else {
      ctx.lineTo(maxX, y);
    }
  }
  ctx.stroke();

  // Reset shadow
  ctx.shadowBlur = 0;

  // Draw full parabolas (faded)
  if (state.showAllParabolas) {
    ctx.lineWidth = 1;
    activeSites.forEach((s) => {
      ctx.strokeStyle = `rgba(255, 255, 255, 0.15)`;
      ctx.beginPath();
      let pStarted = false;
      for (let y = 0; y <= state.h; y += 4) {
        const px = getParabolaX(s.x, s.y, state.sweepX, y);
        if (px < -100) continue; // cull far left
        if (!pStarted) {
          ctx.moveTo(px, y);
          pStarted = true;
        } else {
          ctx.lineTo(px, y);
        }
      }
      ctx.stroke();
    });
  }
}

function drawVoronoiEdges() {
  // A true frame-by-frame edge tracer requires tracking history.
  // Since we are scrubbing time dynamically, we will use a naive rasterization approach
  // for visual demonstration: we evaluate the beachline break points across time (from 0 to sweepX)

  if (state.sites.length < 2) return;
  if (state.sweepX < 5) return;

  // We will render points where the closest site transitions (i.e. equidistant points)
  // To do this smoothly without lag, we render the Voronoi approximation directly.
  // For every pixel (x,y) up to sweepX, does it lie on an edge?
  // Doing this per-pixel is O(W * H * N), too slow for JS.

  // Better visual approach for the "trail":
  // We simulate the history by stepping through sweeping X in large chunks and drawing the breakpoints.

  ctx.fillStyle = '#10b981'; // Lime

  // Sample history
  const step = 4;
  for (let sx = 0; sx <= state.sweepX; sx += step) {
    const sites = state.sites.filter((s) => s.x < sx);
    if (sites.length < 2) continue;

    // Find breakpoints at this historical sweepline
    let prevOwner = -1;
    for (let y = 0; y <= state.h; y += step) {
      let maxX = -Infinity;
      let owner = -1;

      for (let i = 0; i < sites.length; i++) {
        const s = sites[i];
        const px = getParabolaX(s.x, s.y, sx, y);
        if (px > maxX) {
          maxX = px;
          owner = i;
        }
      }

      // If owner changed, this is a breakpoint (Voronoi edge)
      if (prevOwner !== -1 && owner !== prevOwner) {
        ctx.fillRect(maxX - 1, y - 1, 2, 2);
      }
      prevOwner = owner;
    }
  }
}

function drawCircleEvents() {
  // Visualizing empty circles that touch the sweepline
  // A circle through 3 sites is empty if no other site is inside it.
  // Its rightmost point touches the sweepline.

  ctx.strokeStyle = 'rgba(245, 158, 11, 0.4)'; // Warning Orange
  ctx.lineWidth = 1;

  const N = state.sites.length;
  for (let i = 0; i < N; i++) {
    for (let j = i + 1; j < N; j++) {
      for (let k = j + 1; k < N; k++) {
        const s1 = state.sites[i];
        const s2 = state.sites[j];
        const s3 = state.sites[k];

        // Calculate circumcenter
        const d = 2 * (s1.x * (s2.y - s3.y) + s2.x * (s3.y - s1.y) + s3.x * (s1.y - s2.y));
        if (Math.abs(d) < 0.1) continue; // Collinear

        const cx =
          ((s1.x * s1.x + s1.y * s1.y) * (s2.y - s3.y) +
            (s2.x * s2.x + s2.y * s2.y) * (s3.y - s1.y) +
            (s3.x * s3.x + s3.y * s3.y) * (s1.y - s2.y)) /
          d;
        const cy =
          ((s1.x * s1.x + s1.y * s1.y) * (s3.x - s2.x) +
            (s2.x * s2.x + s2.y * s2.y) * (s1.x - s3.x) +
            (s3.x * s3.x + s3.y * s3.y) * (s2.x - s1.x)) /
          d;

        const r = Math.sqrt((cx - s1.x) ** 2 + (cy - s1.y) ** 2);

        // Event X is the rightmost point of the circle
        const eventX = cx + r;

        // Is it a valid empty circle?
        let empty = true;
        for (let m = 0; m < N; m++) {
          if (m === i || m === j || m === k) continue;
          const sm = state.sites[m];
          const dist = Math.sqrt((cx - sm.x) ** 2 + (cy - sm.y) ** 2);
          if (dist < r - 0.1) {
            empty = false;
            break;
          }
        }

        // If it's a valid circle event, and it hasn't completely passed yet
        if (empty && eventX >= state.sweepX - 20 && eventX <= state.w + 100) {
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.stroke();

          // Draw center vertex
          if (eventX <= state.sweepX) {
            ctx.fillStyle = '#f59e0b';
            ctx.beginPath();
            ctx.arc(cx, cy, 3, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
    }
  }
}
