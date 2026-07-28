const U = document.getElementById.bind(document);
const C = document.createElement.bind(document);

let points = [];
let triangles = [];
let animFrame = null;
let state = {
  running: false,
  mode: 'IDLE',
  gen: null,
  flips: 0,
  speed: 5,
  mouseX: -1,
  mouseY: -1,
};

const EPSILON = 1e-9;

class Vertex {
  constructor(x, y, id = -1) {
    this.x = x;
    this.y = y;
    this.id = id;
  }
}

class Triangle {
  constructor(a, b, c) {
    this.a = a;
    this.b = b;
    this.c = c;
    this.edges = [
      [a, b],
      [b, c],
      [c, a],
    ];
    this.circumcenter = null;
    this.circumradius = 0;
    this.calcCircumcircle();
  }

  calcCircumcircle() {
    let ax = this.a.x,
      ay = this.a.y;
    let bx = this.b.x,
      by = this.b.y;
    let cx = this.c.x,
      cy = this.c.y;

    let d = 2 * (ax * (by - cy) + bx * (cy - ay) + cx * (ay - by));
    if (Math.abs(d) < EPSILON) {
      this.circumcenter = new Vertex(0, 0);
      this.circumradius = 0;
      return;
    }

    let ux =
      ((ax * ax + ay * ay) * (by - cy) +
        (bx * bx + by * by) * (cy - ay) +
        (cx * cx + cy * cy) * (ay - by)) /
      d;
    let uy =
      ((ax * ax + ay * ay) * (cx - bx) +
        (bx * bx + by * by) * (ax - cx) +
        (cx * cx + cy * cy) * (bx - ax)) /
      d;

    this.circumcenter = new Vertex(ux, uy);
    let dx = ux - ax;
    let dy = uy - ay;
    this.circumradius = Math.sqrt(dx * dx + dy * dy);
  }

  inCircumcircle(v) {
    if (!this.circumcenter) return false;
    let dx = this.circumcenter.x - v.x;
    let dy = this.circumcenter.y - v.y;
    let dist = Math.sqrt(dx * dx + dy * dy);
    return dist <= this.circumradius + EPSILON;
  }

  containsVertex(v) {
    return (
      (this.a.x === v.x && this.a.y === v.y) ||
      (this.b.x === v.x && this.b.y === v.y) ||
      (this.c.x === v.x && this.c.y === v.y)
    );
  }

  sharesEdge(other) {
    let shared = 0;
    if (other.containsVertex(this.a)) shared++;
    if (other.containsVertex(this.b)) shared++;
    if (other.containsVertex(this.c)) shared++;
    return shared === 2;
  }
}

function initHeroCanvas() {
  const c = U('dtHeroCanvas');
  if (!c) return;
  const ctx = c.getContext('2d');
  let t = 0;

  let pts = [];
  for (let i = 0; i < 30; i++) {
    pts.push({
      x: Math.random() * c.parentElement.clientWidth,
      y: Math.random() * c.parentElement.clientHeight,
      vx: (Math.random() - 0.5) * 1,
      vy: (Math.random() - 0.5) * 1,
    });
  }

  function resize() {
    c.width = c.parentElement.clientWidth;
    c.height = c.parentElement.clientHeight;
  }
  window.addEventListener('resize', resize);
  resize();

  function draw() {
    ctx.clearRect(0, 0, c.width, c.height);

    pts.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0 || p.x > c.width) p.vx *= -1;
      if (p.y < 0 || p.y > c.height) p.vy *= -1;
    });

    ctx.strokeStyle = 'rgba(14,165,233,0.1)';
    ctx.lineWidth = 1;
    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        let dx = pts[i].x - pts[j].x;
        let dy = pts[i].y - pts[j].y;
        if (dx * dx + dy * dy < 15000) {
          ctx.beginPath();
          ctx.moveTo(pts[i].x, pts[i].y);
          ctx.lineTo(pts[j].x, pts[j].y);
          ctx.stroke();
        }
      }
    }
    requestAnimationFrame(draw);
  }
  draw();
}

function logMsg(msg, type = 'info') {
  const lc = U('dtLogConsole');
  if (!lc) return;
  let d = C('div');
  d.className = 'log-entry ' + type;
  d.innerHTML = msg;
  lc.appendChild(d);
  lc.scrollTop = lc.scrollHeight;
}

function updateStatus(msg, cls = '') {
  const sb = U('dtStatus');
  const sm = U('statusMsg');
  if (!sb || !sm) return;
  sb.className = 'dt-status-bar ' + cls;
  sm.innerHTML = msg;
}

function getCanvasDims() {
  const cvs = U('geometryCanvas');
  return { w: cvs.clientWidth, h: cvs.clientHeight };
}

function setupCanvas() {
  const cvs = U('geometryCanvas');
  let dims = getCanvasDims();
  cvs.width = dims.w;
  cvs.height = dims.h;

  points = [];
  triangles = [];
  state.flips = 0;

  let pad = 1000;
  let v1 = new Vertex(dims.w / 2, -dims.h * 50, -1);
  let v2 = new Vertex(-dims.w * 50, dims.h * 50, -2);
  let v3 = new Vertex(dims.w * 50, dims.h * 50, -3);

  let superTri = new Triangle(v1, v2, v3);
  triangles.push(superTri);

  drawGeometry();
}

function addPoint(x, y) {
  let v = new Vertex(x, y, points.length);
  points.push(v);

  U('statPts').innerText = points.length;

  if (!state.running) {
    state.gen = triangulateStepGen(v);
    startAnim();
  }
}

function* triangulateStepGen(v) {
  let badTriangles = [];
  for (let i = 0; i < triangles.length; i++) {
    if (triangles[i].inCircumcircle(v)) {
      badTriangles.push(triangles[i]);
    }
  }

  let polygon = [];
  for (let i = 0; i < badTriangles.length; i++) {
    let bt = badTriangles[i];
    for (let j = 0; j < 3; j++) {
      let edge = bt.edges[j];
      let isShared = false;
      for (let k = 0; k < badTriangles.length; k++) {
        if (i === k) continue;
        let ot = badTriangles[k];
        for (let m = 0; m < 3; m++) {
          let oEdge = ot.edges[m];
          if (
            (edge[0] === oEdge[0] && edge[1] === oEdge[1]) ||
            (edge[0] === oEdge[1] && edge[1] === oEdge[0])
          ) {
            isShared = true;
            break;
          }
        }
        if (isShared) break;
      }
      if (!isShared) polygon.push(edge);
    }
  }

  triangles = triangles.filter((t) => !badTriangles.includes(t));

  for (let i = 0; i < polygon.length; i++) {
    let newTri = new Triangle(polygon[i][0], polygon[i][1], v);
    triangles.push(newTri);
  }

  state.flips += Math.max(0, badTriangles.length - 1);
  U('statTris').innerText = triangles.length;
  U('statFlips').innerText = state.flips;

  logMsg(
    `Inserted point ${v.id}. Removed ${badTriangles.length} violating triangles, added ${polygon.length} new triangles.`,
    'info'
  );

  drawGeometry();
  yield;

  state.mode = 'IDLE';
  state.running = false;
}

function drawGeometry() {
  const cvs = U('geometryCanvas');
  const ctx = cvs.getContext('2d');
  ctx.clearRect(0, 0, cvs.width, cvs.height);

  let dims = getCanvasDims();

  let renderTris = triangles.filter((t) => {
    return t.a.id >= 0 && t.b.id >= 0 && t.c.id >= 0;
  });

  if (U('chkVoronoi').checked) {
    ctx.strokeStyle = '#8b5cf6';
    ctx.lineWidth = 1.5;

    for (let i = 0; i < renderTris.length; i++) {
      for (let j = i + 1; j < renderTris.length; j++) {
        if (renderTris[i].sharesEdge(renderTris[j])) {
          ctx.beginPath();
          ctx.moveTo(renderTris[i].circumcenter.x, renderTris[i].circumcenter.y);
          ctx.lineTo(renderTris[j].circumcenter.x, renderTris[j].circumcenter.y);
          ctx.stroke();
        }
      }
    }

    ctx.fillStyle = '#8b5cf6';
    for (let i = 0; i < renderTris.length; i++) {
      if (
        renderTris[i].circumcenter.x > -100 &&
        renderTris[i].circumcenter.y > -100 &&
        renderTris[i].circumcenter.x < dims.w + 100 &&
        renderTris[i].circumcenter.y < dims.h + 100
      ) {
        ctx.beginPath();
        ctx.arc(renderTris[i].circumcenter.x, renderTris[i].circumcenter.y, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  ctx.strokeStyle = '#0ea5e9';
  ctx.lineWidth = 1;

  renderTris.forEach((t) => {
    ctx.beginPath();
    ctx.moveTo(t.a.x, t.a.y);
    ctx.lineTo(t.b.x, t.b.y);
    ctx.lineTo(t.c.x, t.c.y);
    ctx.closePath();
    ctx.stroke();
  });

  let showCirc = U('chkCircumcircles').checked;

  if (showCirc || state.mouseX !== -1) {
    renderTris.forEach((t) => {
      let dx = state.mouseX - t.circumcenter.x;
      let dy = state.mouseY - t.circumcenter.y;
      let dist = Math.sqrt(dx * dx + dy * dy);

      if (showCirc || dist <= t.circumradius) {
        ctx.strokeStyle =
          dist <= t.circumradius && state.mouseX !== -1
            ? 'rgba(236,72,153,0.8)'
            : 'rgba(14,165,233,0.2)';
        ctx.fillStyle =
          dist <= t.circumradius && state.mouseX !== -1 ? 'rgba(236,72,153,0.1)' : 'transparent';
        ctx.beginPath();
        ctx.arc(t.circumcenter.x, t.circumcenter.y, t.circumradius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fill();
      }
    });
  }

  ctx.fillStyle = '#fff';
  points.forEach((p) => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
    ctx.fill();
  });
}

function animLoop() {
  if (!state.running) return;

  if (state.gen) {
    let res = state.gen.next();
    if (res.done) state.running = false;
  }

  if (state.running) {
    let speed = 101 - parseInt(U('speedSlider').value);
    setTimeout(() => {
      animFrame = requestAnimationFrame(animLoop);
    }, speed * 2);
  }
}

function startAnim() {
  if (animFrame) cancelAnimationFrame(animFrame);
  state.running = true;
  animLoop();
}

U('geometryCanvas').addEventListener('click', (e) => {
  let rect = e.target.getBoundingClientRect();
  let x = e.clientX - rect.left;
  let y = e.clientY - rect.top;
  addPoint(x, y);
});

U('geometryCanvas').addEventListener('mousemove', (e) => {
  let rect = e.target.getBoundingClientRect();
  state.mouseX = e.clientX - rect.left;
  state.mouseY = e.clientY - rect.top;
  if (!state.running) drawGeometry();
});

U('geometryCanvas').addEventListener('mouseleave', () => {
  state.mouseX = -1;
  state.mouseY = -1;
  if (!state.running) drawGeometry();
});

U('btnTriangulate').addEventListener('click', () => {
  U('dtLogConsole').innerHTML = '';
  setupCanvas();
  let n = parseInt(U('sliderPts').value);
  let dims = getCanvasDims();

  let autoPts = [];
  for (let i = 0; i < n; i++) {
    autoPts.push({
      x: 20 + Math.random() * (dims.w - 40),
      y: 20 + Math.random() * (dims.h - 40),
    });
  }

  function* autoGen() {
    for (let i = 0; i < autoPts.length; i++) {
      let p = autoPts[i];
      let v = new Vertex(p.x, p.y, points.length);
      points.push(v);
      U('statPts').innerText = points.length;

      let badTriangles = [];
      for (let j = 0; j < triangles.length; j++) {
        if (triangles[j].inCircumcircle(v)) {
          badTriangles.push(triangles[j]);
        }
      }

      let polygon = [];
      for (let j = 0; j < badTriangles.length; j++) {
        let bt = badTriangles[j];
        for (let k = 0; k < 3; k++) {
          let edge = bt.edges[k];
          let isShared = false;
          for (let m = 0; m < badTriangles.length; m++) {
            if (j === m) continue;
            let ot = badTriangles[m];
            for (let l = 0; l < 3; l++) {
              let oEdge = ot.edges[l];
              if (
                (edge[0] === oEdge[0] && edge[1] === oEdge[1]) ||
                (edge[0] === oEdge[1] && edge[1] === oEdge[0])
              ) {
                isShared = true;
                break;
              }
            }
            if (isShared) break;
          }
          if (!isShared) polygon.push(edge);
        }
      }

      triangles = triangles.filter((t) => !badTriangles.includes(t));

      for (let j = 0; j < polygon.length; j++) {
        let newTri = new Triangle(polygon[j][0], polygon[j][1], v);
        triangles.push(newTri);
      }

      state.flips += Math.max(0, badTriangles.length - 1);
      U('statTris').innerText = triangles.length;
      U('statFlips').innerText = state.flips;

      logMsg(`Inserted auto-point ${v.id}. Retriangulated region.`, 'purple');

      drawGeometry();
      yield;
    }
    updateStatus('Auto-Triangulation Complete.', 'done');
    state.mode = 'DONE';
  }

  updateStatus('Auto generating random points...', 'warn');
  state.gen = autoGen();
  startAnim();
});

U('btnClear').addEventListener('click', () => {
  setupCanvas();
  U('dtLogConsole').innerHTML = '';
  updateStatus('Canvas cleared. Ready for manual clicks.');
  U('statPts').innerText = '0';
  U('statTris').innerText = '0';
  U('statFlips').innerText = '0';
});

U('sliderPts').addEventListener('input', (e) => {
  U('lblPts').innerText = e.target.value;
});
U('chkCircumcircles').addEventListener('change', drawGeometry);
U('chkVoronoi').addEventListener('change', drawGeometry);

document.addEventListener('DOMContentLoaded', () => {
  initHeroCanvas();
  setupCanvas();
});
