/**
 * octree-3d.js
 * Interactive 3D Octree Partitioning & Ray-Casting Sandbox
 */

document.addEventListener('DOMContentLoaded', () => {
  initOctreeSandbox();
});

// ==========================================
// 1. 3D MATH & PROJECTION ENGINE
// ==========================================

class Point3D {
  constructor(x = 0, y = 0, z = 0) {
    this.x = x;
    this.y = y;
    this.z = z;
  }
}

class Box3D {
  constructor(cx, cy, cz, size) {
    this.cx = cx; // Center X
    this.cy = cy; // Center Y
    this.cz = cz; // Center Z
    this.h = size / 2; // Half size
  }

  contains(pt) {
    return (
      pt.x >= this.cx - this.h &&
      pt.x <= this.cx + this.h &&
      pt.y >= this.cy - this.h &&
      pt.y <= this.cy + this.h &&
      pt.z >= this.cz - this.h &&
      pt.z <= this.cz + this.h
    );
  }
}

// Global Camera rotation settings
let cameraYaw = 0.5;
let cameraPitch = 0.5;
let cameraDistance = 300;

function project3D(pt, width, height) {
  // 1. Apply camera rotations
  const cosY = Math.cos(cameraYaw);
  const sinY = Math.sin(cameraYaw);
  const cosP = Math.cos(cameraPitch);
  const sinP = Math.sin(cameraPitch);

  // Orbit rotation around center (0,0,0)
  let x1 = pt.x * cosY - pt.z * sinY;
  let z1 = pt.x * sinY + pt.z * cosY;

  let y2 = pt.y * cosP - z1 * sinP;
  let z2 = pt.y * sinP + z1 * cosP;

  // 2. Perspective Projection
  const fov = 400; // Focal length
  const zOffset = z2 + cameraDistance;

  if (zOffset <= 10) return null; // Behind camera

  const screenX = (x1 * fov) / zOffset + width / 2;
  const screenY = (y2 * fov) / zOffset + height / 2;

  return { x: screenX, y: screenY, depth: zOffset };
}

// ==========================================
// 2. OCTREE DATA STRUCTURE
// ==========================================

class Octree {
  constructor(boundary, capacity, depth = 0, maxDepth = 4) {
    this.boundary = boundary;
    this.capacity = capacity;
    this.depth = depth;
    this.maxDepth = maxDepth;
    this.points = [];
    this.divided = false;
    this.octants = [];
  }

  subdivide() {
    const cx = this.boundary.cx;
    const cy = this.boundary.cy;
    const cz = this.boundary.cz;
    const h = this.boundary.h;
    const nh = h / 2; // Quarter size of parent

    // Create 8 sub-octants
    this.octants.push(
      new Octree(
        new Box3D(cx - nh, cy - nh, cz - nh, h),
        this.capacity,
        this.depth + 1,
        this.maxDepth
      )
    );
    this.octants.push(
      new Octree(
        new Box3D(cx + nh, cy - nh, cz - nh, h),
        this.capacity,
        this.depth + 1,
        this.maxDepth
      )
    );
    this.octants.push(
      new Octree(
        new Box3D(cx - nh, cy + nh, cz - nh, h),
        this.capacity,
        this.depth + 1,
        this.maxDepth
      )
    );
    this.octants.push(
      new Octree(
        new Box3D(cx + nh, cy + nh, cz - nh, h),
        this.capacity,
        this.depth + 1,
        this.maxDepth
      )
    );
    this.octants.push(
      new Octree(
        new Box3D(cx - nh, cy - nh, cz + nh, h),
        this.capacity,
        this.depth + 1,
        this.maxDepth
      )
    );
    this.octants.push(
      new Octree(
        new Box3D(cx + nh, cy - nh, cz + nh, h),
        this.capacity,
        this.depth + 1,
        this.maxDepth
      )
    );
    this.octants.push(
      new Octree(
        new Box3D(cx - nh, cy + nh, cz + nh, h),
        this.capacity,
        this.depth + 1,
        this.maxDepth
      )
    );
    this.octants.push(
      new Octree(
        new Box3D(cx + nh, cy + nh, cz + nh, h),
        this.capacity,
        this.depth + 1,
        this.maxDepth
      )
    );

    this.divided = true;

    // Redistribute parent points
    for (const pt of this.points) {
      this.insertToOctants(pt);
    }
    this.points = [];
  }

  insertToOctants(pt) {
    for (const oct of this.octants) {
      if (oct.insert(pt)) return true;
    }
    return false;
  }

  insert(pt) {
    if (!this.boundary.contains(pt)) return false;

    if (!this.divided) {
      if (this.points.length < this.capacity || this.depth >= this.maxDepth) {
        this.points.push(pt);
        return true;
      }
      this.subdivide();
    }

    return this.insertToOctants(pt);
  }

  countTotalNodes() {
    if (!this.divided) return 1;
    let count = 1;
    for (const oct of this.octants) {
      count += oct.countTotalNodes();
    }
    return count;
  }

  countMaxDepth() {
    if (!this.divided) return this.depth;
    let maxD = this.depth;
    for (const oct of this.octants) {
      maxD = Math.max(maxD, oct.countMaxDepth());
    }
    return maxD;
  }
}

// Ray-box intersection (Slab method)
function intersectRayBox(rayOrigin, rayDir, box) {
  const minX = box.cx - box.h;
  const maxX = box.cx + box.h;
  const minY = box.cy - box.h;
  const maxY = box.cy + box.h;
  const minZ = box.cz - box.h;
  const maxZ = box.cz + box.h;

  let tmin = (minX - rayOrigin.x) / (rayDir.x || 0.0001);
  let tmax = (maxX - rayOrigin.x) / (rayDir.x || 0.0001);

  if (tmin > tmax) [tmin, tmax] = [tmax, tmin];

  let tymin = (minY - rayOrigin.y) / (rayDir.y || 0.0001);
  let tymax = (maxY - rayOrigin.y) / (rayDir.y || 0.0001);

  if (tymin > tymax) [tymin, tymax] = [tymax, tymin];

  if (tmin > tymax || tymin > tmax) return false;

  if (tymin > tmin) tmin = tymin;
  if (tymax < tmax) tmax = tymax;

  let tzmin = (minZ - rayOrigin.z) / (rayDir.z || 0.0001);
  let tzmax = (maxZ - rayOrigin.z) / (rayDir.z || 0.0001);

  if (tzmin > tzmax) [tzmin, tzmax] = [tzmax, tzmin];

  if (tmin > tzmax || tzmin > tmax) return false;

  return true;
}

// Traverse octree to find intersected boxes
function queryRayIntersection(octree, rayOrigin, rayDir, resultList) {
  if (!intersectRayBox(rayOrigin, rayDir, octree.boundary)) return;

  resultList.push(octree);

  if (octree.divided) {
    for (const oct of octree.octants) {
      queryRayIntersection(oct, rayOrigin, rayDir, resultList);
    }
  }
}

// ==========================================
// 3. GRAPHICS INTERFACE & SIMULATOR SETUP
// ==========================================

const els = {
  canvas: document.getElementById('octreeCanvas'),
  wrapper: document.getElementById('canvasWrapper'),
  pointPreset: document.getElementById('pointPreset'),
  capacitySlider: document.getElementById('capacitySlider'),
  capacityVal: document.getElementById('capacityVal'),
  depthSlider: document.getElementById('depthSlider'),
  depthVal: document.getElementById('depthVal'),
  showBoxesToggle: document.getElementById('showBoxesToggle'),
  showRayToggle: document.getElementById('showRayToggle'),
  rotateToggle: document.getElementById('rotateToggle'),
  randomizeBtn: document.getElementById('randomizeBtn'),
  clearBtn: document.getElementById('clearBtn'),
  pointsStat: document.getElementById('pointsStat'),
  nodesStat: document.getElementById('nodesStat'),
  activeDepthStat: document.getElementById('activeDepthStat'),
};

let ctx;
let points = [];
let octreeRoot = null;
let _animId = null;
let lastTime = performance.now();

// Mouse dragging state
let isDragging = false;
let startMousePos = { x: 0, y: 0 };
let currentRay = null; // { origin, dir }

function initOctreeSandbox() {
  ctx = els.canvas.getContext('2d');
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  bindEvents();
  generateCloud();

  _animId = requestAnimationFrame(octreeLoop);
}

function resizeCanvas() {
  const rect = els.wrapper.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  els.canvas.width = rect.width * dpr;
  els.canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);
}

function bindEvents() {
  els.capacitySlider.addEventListener('input', (e) => {
    els.capacityVal.textContent = e.target.value;
    rebuildOctree();
  });

  els.depthSlider.addEventListener('input', (e) => {
    els.depthVal.textContent = e.target.value;
    rebuildOctree();
  });

  els.pointPreset.addEventListener('change', generateCloud);
  els.randomizeBtn.addEventListener('click', generateCloud);
  els.clearBtn.addEventListener('click', () => {
    points = [];
    rebuildOctree();
  });

  // Rotation & zoom handlers
  els.canvas.addEventListener('mousedown', (e) => {
    isDragging = true;
    startMousePos = { x: e.clientX, y: e.clientY };
  });

  els.canvas.addEventListener('mousemove', handleMouseMove);

  window.addEventListener('mouseup', () => {
    isDragging = false;
  });

  els.canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    cameraDistance += e.deltaY * 0.2;
    cameraDistance = Math.max(100, Math.min(600, cameraDistance));
  });
}

function generateCloud() {
  const type = els.pointPreset.value;
  points = [];

  const numPoints = 120;
  const r = 80;

  if (type === 'sphere') {
    for (let i = 0; i < numPoints; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      points.push(
        new Point3D(
          r * Math.sin(phi) * Math.cos(theta),
          r * Math.sin(phi) * Math.sin(theta),
          r * Math.cos(phi)
        )
      );
    }
  } else if (type === 'cube') {
    for (let i = 0; i < numPoints; i++) {
      // Spawn points on outer surface of cube
      const face = Math.floor(Math.random() * 6);
      const u = (Math.random() - 0.5) * 2 * r;
      const v = (Math.random() - 0.5) * 2 * r;

      if (face === 0) points.push(new Point3D(-r, u, v));
      else if (face === 1) points.push(new Point3D(r, u, v));
      else if (face === 2) points.push(new Point3D(u, -r, v));
      else if (face === 3) points.push(new Point3D(u, r, v));
      else if (face === 4) points.push(new Point3D(u, v, -r));
      else points.push(new Point3D(u, v, r));
    }
  } else if (type === 'spiral') {
    for (let i = 0; i < numPoints; i++) {
      const t = (i / numPoints) * Math.PI * 6;
      const px = Math.cos(t) * r * 0.7;
      const py = (i / numPoints - 0.5) * 150;
      const pz = Math.sin(t) * r * 0.7;
      points.push(new Point3D(px, py, pz));
      // Double helix complement
      points.push(new Point3D(-px, py, -pz));
    }
  } else if (type === 'random') {
    // Spawn small gaussian clusters
    for (let c = 0; c < 3; c++) {
      const cx = (Math.random() - 0.5) * 120;
      const cy = (Math.random() - 0.5) * 120;
      const cz = (Math.random() - 0.5) * 120;
      for (let i = 0; i < 40; i++) {
        points.push(
          new Point3D(
            cx + (Math.random() - 0.5) * 30,
            cy + (Math.random() - 0.5) * 30,
            cz + (Math.random() - 0.5) * 30
          )
        );
      }
    }
  }

  rebuildOctree();
}

function rebuildOctree() {
  const capacity = parseInt(els.capacitySlider.value);
  const maxDepth = parseInt(els.depthSlider.value);

  // Center boundary box size 240
  const boundary = new Box3D(0, 0, 0, 240);
  octreeRoot = new Octree(boundary, capacity, 0, maxDepth);

  for (const pt of points) {
    octreeRoot.insert(pt);
  }

  // Telemetry updates
  els.pointsStat.textContent = points.length;
  els.nodesStat.textContent = octreeRoot.countTotalNodes();
  els.activeDepthStat.textContent = octreeRoot.countMaxDepth();
}

function handleMouseMove(e) {
  const rect = els.canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;

  if (isDragging) {
    const dx = e.clientX - startMousePos.x;
    const dy = e.clientY - startMousePos.y;
    startMousePos = { x: e.clientX, y: e.clientY };

    cameraYaw += dx * 0.007;
    cameraPitch = Math.max(
      -Math.PI / 2 + 0.1,
      Math.min(Math.PI / 2 - 0.1, cameraPitch + dy * 0.007)
    );
  }

  // Dynamic Ray casting origin and direction calculations
  if (els.showRayToggle.checked) {
    const dpr = window.devicePixelRatio || 1;
    const cw = els.canvas.width / dpr;
    const ch = els.canvas.height / dpr;

    // Trace a 3D ray from screen mouse position
    // Unproject 2D screen coordinate back to 3D space
    const cosY = Math.cos(-cameraYaw);
    const sinY = Math.sin(-cameraYaw);
    const cosP = Math.cos(-cameraPitch);
    const sinP = Math.sin(-cameraPitch);

    const screenNormX = (mx - cw / 2) / 400;
    const screenNormY = (my - ch / 2) / 400;

    // Approximate ray direction vectors based on inverse camera rotations
    const rx = screenNormX * cosY - screenNormY * sinP * sinY;
    const ry = screenNormY * cosP;
    const rz = screenNormX * sinY + screenNormY * sinP * cosY;

    // Add depth vector
    const dir = new Point3D(rx, ry, rz);
    const len = Math.sqrt(dir.x * dir.x + dir.y * dir.y + dir.z * dir.z);
    dir.x /= len;
    dir.y /= len;
    dir.z /= len;

    // Ray origin begins at camera position
    const camX = cameraDistance * Math.sin(cameraYaw) * Math.cos(cameraPitch);
    const camY = cameraDistance * Math.sin(cameraPitch);
    const camZ = cameraDistance * Math.cos(cameraYaw) * Math.cos(cameraPitch);

    currentRay = {
      origin: new Point3D(-camX, -camY, -camZ),
      dir,
    };
  } else {
    currentRay = null;
  }
}

// ==========================================
// 3D DRAWING & PERSPECTIVE RENDERER
// ==========================================

function drawCube(box, color, isHighlighted = false) {
  const cx = box.cx;
  const cy = box.cy;
  const cz = box.cz;
  const h = box.h;

  // Define 8 vertices of cube
  const vertices = [
    new Point3D(cx - h, cy - h, cz - h),
    new Point3D(cx + h, cy - h, cz - h),
    new Point3D(cx + h, cy + h, cz - h),
    new Point3D(cx - h, cy + h, cz - h),
    new Point3D(cx - h, cy - h, cz + h),
    new Point3D(cx + h, cy - h, cz + h),
    new Point3D(cx + h, cy + h, cz + h),
    new Point3D(cx - h, cy + h, cz + h),
  ];

  const rect = els.wrapper.getBoundingClientRect();
  const proj = vertices.map((v) => project3D(v, rect.width, rect.height));

  if (proj.some((p) => p === null)) return; // Pruned if behind camera

  // 12 edges connecting the 8 vertices
  const edges = [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 0],
    [4, 5],
    [5, 6],
    [6, 7],
    [7, 4],
    [0, 4],
    [1, 5],
    [2, 6],
    [3, 7],
  ];

  ctx.beginPath();
  for (const [start, end] of edges) {
    ctx.moveTo(proj[start].x, proj[start].y);
    ctx.lineTo(proj[end].x, proj[end].y);
  }
  ctx.strokeStyle = color;
  ctx.lineWidth = isHighlighted ? 2.0 : 0.8;
  ctx.stroke();
}

function renderOctreeNode(node, intersectedNodes) {
  const isIntersected = intersectedNodes.includes(node);

  if (els.showBoxesToggle.checked) {
    let color = 'rgba(255, 255, 255, 0.08)';
    if (isIntersected) {
      color = '#e6baff'; // Purple highlight
    } else {
      // Gradient based on depth
      const colors = ['#f43f5e', '#fb923c', '#fbbf24', '#34d399', '#60a5fa', '#a78bfa'];
      color = colors[node.depth % colors.length] + '26'; // 15% opacity
    }
    drawCube(node.boundary, color, isIntersected);
  }

  if (node.divided) {
    for (const oct of node.octants) {
      renderOctreeNode(oct, intersectedNodes);
    }
  }
}

function drawWorld() {
  const rect = els.wrapper.getBoundingClientRect();
  ctx.clearRect(0, 0, rect.width, rect.height);

  if (!octreeRoot) return;

  // Determine ray intersections
  let intersectedNodes = [];
  if (currentRay) {
    queryRayIntersection(octreeRoot, currentRay.origin, currentRay.dir, intersectedNodes);
  }

  // 1. Draw Bounding Box Hierarchy
  renderOctreeNode(octreeRoot, intersectedNodes);

  // 2. Draw Points (sorted by depth for simple painter's algorithm sorting)
  const projectedPoints = points
    .map((p, idx) => {
      const proj = project3D(p, rect.width, rect.height);
      return { proj, idx, pt: p };
    })
    .filter((item) => item.proj !== null);

  // Sort by depth (far to near)
  projectedPoints.sort((a, b) => b.proj.depth - a.proj.depth);

  projectedPoints.forEach((item) => {
    const { x, y } = item.proj;

    // Check if this point resides in any intersected octree node
    let pointHighlighted = false;
    if (currentRay && intersectedNodes.length > 0) {
      // Find deep leaf node holding this point
      const leaf = intersectedNodes.find((n) => !n.divided && n.boundary.contains(item.pt));
      if (leaf) pointHighlighted = true;
    }

    ctx.beginPath();
    ctx.arc(x, y, pointHighlighted ? 4 : 2, 0, Math.PI * 2);
    ctx.fillStyle = pointHighlighted ? '#f43f5e' : '#e6baff'; // Red if hit
    ctx.fill();
  });
}

function octreeLoop(timestamp) {
  const dt = (timestamp - lastTime) / 1000;
  lastTime = timestamp;

  if (els.rotateToggle.checked && !isDragging) {
    cameraYaw += dt * 0.12; // Slow orbit rotation
  }

  drawWorld();

  _animId = requestAnimationFrame(octreeLoop);
}
