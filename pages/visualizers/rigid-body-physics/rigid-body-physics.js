/**
 * rigid-body-physics.js
 * 2D Impulse-based Rigid Body Physics Engine Visualizer
 */

document.addEventListener('DOMContentLoaded', () => {
  initPhysicsSandbox();
});

// ==========================================
// 1. 2D VECTOR MATH LIBRARY
// ==========================================

class Vec2 {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  set(x, y) {
    this.x = x;
    this.y = y;
    return this;
  }

  clone() {
    return new Vec2(this.x, this.y);
  }

  add(v) {
    return new Vec2(this.x + v.x, this.y + v.y);
  }

  sub(v) {
    return new Vec2(this.x - v.x, this.y - v.y);
  }

  mult(n) {
    return new Vec2(this.x * n, this.y * n);
  }

  dot(v) {
    return this.x * v.x + this.y * v.y;
  }

  cross(v) {
    return this.x * v.y - this.y * v.x;
  }

  crossScalar(s) {
    return new Vec2(-s * this.y, s * this.x);
  }

  lenSq() {
    return this.x * this.x + this.y * this.y;
  }

  len() {
    return Math.sqrt(this.lenSq());
  }

  normalize() {
    const l = this.len();
    if (l === 0) return new Vec2(0, 0);
    return new Vec2(this.x / l, this.y / l);
  }

  perp() {
    return new Vec2(-this.y, this.x);
  }
}

// ==========================================
// 2. RIGID BODY REPRESENTATION
// ==========================================

class Body {
  constructor(options = {}) {
    this.position = options.position || new Vec2(0, 0);
    this.velocity = options.velocity || new Vec2(0, 0);
    this.angularVelocity = options.angularVelocity || 0;
    this.angle = options.angle || 0;

    this.type = options.type || 'circle'; // 'circle' or 'polygon'
    this.isStatic = options.isStatic || false;

    this.radius = options.radius || 0;
    this.vertices = options.vertices || []; // Relative to position
    this.normals = []; // Face normals

    this.restitution = options.restitution !== undefined ? options.restitution : 0.5;
    this.friction = options.friction !== undefined ? options.friction : 0.3;

    this.mass = 0;
    this.invMass = 0;
    this.inertia = 0;
    this.invInertia = 0;

    this.calculateMassProperties();
    if (this.type === 'polygon') {
      this.calculateNormals();
    }
  }

  calculateMassProperties() {
    if (this.isStatic) {
      this.mass = 0;
      this.invMass = 0;
      this.inertia = 0;
      this.invInertia = 0;
      return;
    }

    const density = 1.0;
    if (this.type === 'circle') {
      this.mass = Math.PI * this.radius * this.radius * density;
      this.invMass = 1.0 / this.mass;
      this.inertia = 0.5 * this.mass * this.radius * this.radius;
      this.invInertia = 1.0 / this.inertia;
    } else if (this.type === 'polygon') {
      // Compute centroid, mass, and inertia of polygon
      let area = 0;
      let I = 0;
      let c = new Vec2(0, 0);

      const count = this.vertices.length;
      for (let i = 0; i < count; i++) {
        const p1 = this.vertices[i];
        const p2 = this.vertices[(i + 1) % count];

        const d = p1.cross(p2);
        area += d * 0.5;

        c.x += ((p1.x + p2.x) * d) / 6.0;
        c.y += ((p1.y + p2.y) * d) / 6.0;
      }

      // Adjust vertices relative to centroid
      if (area > 0) {
        c.mult(1.0 / area);
        for (let i = 0; i < count; i++) {
          this.vertices[i] = this.vertices[i].sub(c);
        }

        this.mass = area * density;
        this.invMass = 1.0 / this.mass;

        // Inertia of polygon
        for (let i = 0; i < count; i++) {
          const p1 = this.vertices[i];
          const p2 = this.vertices[(i + 1) % count];
          const num = p1.cross(p2);
          const den = p1.lenSq() + p1.dot(p2) + p2.lenSq();
          I += (num * den) / 12.0;
        }
        this.inertia = I * density;
        this.invInertia = 1.0 / this.inertia;
      }
    }
  }

  calculateNormals() {
    this.normals = [];
    const count = this.vertices.length;
    for (let i = 0; i < count; i++) {
      const p1 = this.vertices[i];
      const p2 = this.vertices[(i + 1) % count];
      const edge = p2.sub(p1);
      this.normals.push(edge.perp().normalize());
    }
  }

  getTransformedVertices() {
    const cos = Math.cos(this.angle);
    const sin = Math.sin(this.angle);
    return this.vertices.map(
      (v) =>
        new Vec2(
          this.position.x + (v.x * cos - v.y * sin),
          this.position.y + (v.x * sin + v.y * cos)
        )
    );
  }

  getTransformedNormals() {
    const cos = Math.cos(this.angle);
    const sin = Math.sin(this.angle);
    return this.normals.map((n) => new Vec2(n.x * cos - n.y * sin, n.x * sin + n.y * cos));
  }

  applyImpulse(impulse, contactVector) {
    if (this.isStatic) return;

    this.velocity = this.velocity.add(impulse.mult(this.invMass));
    this.angularVelocity += this.invInertia * contactVector.cross(impulse);
  }
}

// ==========================================
// 3. COLLISION MANIFOLD GENERATOR
// ==========================================

class Manifold {
  constructor(bodyA, bodyB) {
    this.bodyA = bodyA;
    this.bodyB = bodyB;
    this.penetration = 0;
    this.normal = new Vec2(0, 0);
    this.contacts = []; // Array of contact Vec2 points
  }
}

// SAT helper to project vertices onto an axis
function projectVertices(vertices, axis) {
  let min = vertices[0].dot(axis);
  let max = min;
  for (let i = 1; i < vertices.length; i++) {
    const proj = vertices[i].dot(axis);
    if (proj < min) min = proj;
    if (proj > max) max = proj;
  }
  return { min, max };
}

// SAT polygon vs polygon
function collidePolygons(m) {
  const bodyA = m.bodyA;
  const bodyB = m.bodyB;
  const ptsA = bodyA.getTransformedVertices();
  const ptsB = bodyB.getTransformedVertices();
  const normalsA = bodyA.getTransformedNormals();
  const normalsB = bodyB.getTransformedNormals();

  let overlap = Infinity;
  let collisionNormal = null;

  // Check normals of A
  for (const n of normalsA) {
    const projA = projectVertices(ptsA, n);
    const projB = projectVertices(ptsB, n);

    if (projA.max < projB.min || projB.max < projA.min) return false;

    const o = Math.min(projA.max, projB.max) - Math.max(projA.min, projB.min);
    if (o < overlap) {
      overlap = o;
      collisionNormal = n;
    }
  }

  // Check normals of B
  for (const n of normalsB) {
    const projA = projectVertices(ptsA, n);
    const projB = projectVertices(ptsB, n);

    if (projA.max < projB.min || projB.max < projA.min) return false;

    const o = Math.min(projA.max, projB.max) - Math.max(projA.min, projB.min);
    if (o < overlap) {
      overlap = o;
      collisionNormal = n;
    }
  }

  // Ensure normal points from A to B
  const d = bodyB.position.sub(bodyA.position);
  if (d.dot(collisionNormal) < 0) {
    collisionNormal = collisionNormal.mult(-1);
  }

  m.normal = collisionNormal;
  m.penetration = overlap;

  // Simple contact point generation: average overlapping vertices
  const contacts = [];
  const projB = projectVertices(ptsB, collisionNormal);
  const projA = projectVertices(ptsA, collisionNormal);

  for (const pA of ptsA) {
    const dotVal = pA.dot(collisionNormal);
    if (projB.min <= dotVal + 0.1 && dotVal <= projB.max + 0.1) {
      contacts.push(pA);
    }
  }
  for (const pB of ptsB) {
    const dotVal = pB.dot(collisionNormal);
    if (projA.min <= dotVal + 0.1 && dotVal <= projA.max + 0.1) {
      contacts.push(pB);
    }
  }

  m.contacts = contacts.slice(0, 2); // Limit to 2 contact points
  return true;
}

// Circle vs Circle
function collideCircles(m) {
  const bodyA = m.bodyA;
  const bodyB = m.bodyB;
  const d = bodyB.position.sub(bodyA.position);
  const distSq = d.lenSq();
  const radiusSum = bodyA.radius + bodyB.radius;

  if (distSq > radiusSum * radiusSum) return false;

  const dist = Math.sqrt(distSq);
  if (dist !== 0) {
    m.normal = d.mult(1.0 / dist);
    m.penetration = radiusSum - dist;
    m.contacts = [bodyA.position.add(m.normal.mult(bodyA.radius))];
  } else {
    m.normal = new Vec2(1, 0); // Arbitrary normal
    m.penetration = radiusSum;
    m.contacts = [bodyA.position.clone()];
  }

  return true;
}

// Circle vs Polygon
function collideCirclePolygon(m) {
  const circle = m.bodyA.type === 'circle' ? m.bodyA : m.bodyB;
  const poly = m.bodyA.type === 'polygon' ? m.bodyA : m.bodyB;
  const pts = poly.getTransformedVertices();
  const normals = poly.getTransformedNormals();

  let separation = -Infinity;
  let faceNormal = null;

  for (let i = 0; i < pts.length; i++) {
    const n = normals[i];
    const s = circle.position.sub(pts[i]).dot(n);
    if (s > circle.radius) return false; // No collision

    if (s > separation) {
      separation = s;
      faceNormal = n;
    }
  }

  if (separation < 0) {
    // Circle center is inside polygon
    m.normal = faceNormal.mult(m.bodyA === circle ? -1 : 1);
    m.penetration = circle.radius - separation;
    m.contacts = [circle.position.sub(m.normal.mult(circle.radius))];
    return true;
  }

  // Check vertex regions
  m.normal = faceNormal.mult(m.bodyA === circle ? -1 : 1);
  m.penetration = circle.radius - separation;
  m.contacts = [circle.position.sub(m.normal.mult(circle.radius))];
  return true;
}

function generateManifold(bodyA, bodyB) {
  const m = new Manifold(bodyA, bodyB);
  let success = false;

  if (bodyA.type === 'circle' && bodyB.type === 'circle') {
    success = collideCircles(m);
  } else if (bodyA.type === 'polygon' && bodyB.type === 'polygon') {
    success = collidePolygons(m);
  } else {
    success = collideCirclePolygon(m);
  }

  return success ? m : null;
}

// ==========================================
// 4. IMPULSE RESOLUTION SOLVER
// ==========================================

function resolveCollision(m) {
  const bodyA = m.bodyA;
  const bodyB = m.bodyB;
  const normal = m.normal;

  const restitution = Math.min(bodyA.restitution, bodyB.restitution);
  const friction = Math.min(bodyA.friction, bodyB.friction);

  for (const contact of m.contacts) {
    const ra = contact.sub(bodyA.position);
    const rb = contact.sub(bodyB.position);

    // Relative velocity
    const rva = bodyA.velocity.add(ra.perp().mult(bodyA.angularVelocity));
    const rvb = bodyB.velocity.add(rb.perp().mult(bodyB.angularVelocity));
    const rv = rvb.sub(rva);

    // Velocity along normal
    const velAlongNormal = rv.dot(normal);

    // Do not resolve if velocities are separating
    if (velAlongNormal > 0) continue;

    // Normal Impulse Scalar
    const raCrossN = ra.cross(normal);
    const rbCrossN = rb.cross(normal);
    const invMassSum =
      bodyA.invMass +
      bodyB.invMass +
      raCrossN * raCrossN * bodyA.invInertia +
      rbCrossN * rbCrossN * bodyB.invInertia;

    if (invMassSum === 0) continue;

    let j = (-(1.0 + restitution) * velAlongNormal) / invMassSum;
    j /= m.contacts.length;

    // Apply normal impulse
    const impulse = normal.mult(j);
    bodyA.applyImpulse(impulse.mult(-1), ra);
    bodyB.applyImpulse(impulse, rb);

    // Friction impulse resolution
    const tangent = rv.sub(normal.mult(rv.dot(normal))).normalize();
    const velAlongTangent = rv.dot(tangent);

    const raCrossT = ra.cross(tangent);
    const rbCrossT = rb.cross(tangent);
    const invMassSumT =
      bodyA.invMass +
      bodyB.invMass +
      raCrossT * raCrossT * bodyA.invInertia +
      rbCrossT * rbCrossT * bodyB.invInertia;

    if (invMassSumT === 0) continue;

    let jt = -velAlongTangent / invMassSumT;
    jt /= m.contacts.length;

    // Clamp friction impulse using Coulomb's Law
    const maxFriction = j * friction;
    jt = Math.max(-maxFriction, Math.min(maxFriction, jt));

    const frictionImpulse = tangent.mult(jt);
    bodyA.applyImpulse(frictionImpulse.mult(-1), ra);
    bodyB.applyImpulse(frictionImpulse, rb);
  }
}

// Positional Correction (prevents sinking/jittering due to numerical drift)
function positionalCorrection(m) {
  const percent = 0.2; // Penetration percentage to correct
  const slop = 0.01; // Penetration allowance
  const sumInvMass = m.bodyA.invMass + m.bodyB.invMass;
  if (sumInvMass === 0) return;
  const correction = m.normal.mult((Math.max(m.penetration - slop, 0) / sumInvMass) * percent);

  if (!m.bodyA.isStatic) m.bodyA.position = m.bodyA.position.sub(correction.mult(m.bodyA.invMass));
  if (!m.bodyB.isStatic) m.bodyB.position = m.bodyB.position.add(correction.mult(m.bodyB.invMass));
}

// ==========================================
// 5. PHYSICS WORLD & ENGINE LOOP
// ==========================================

const els = {
  canvas: document.getElementById('physicsCanvas'),
  wrapper: document.getElementById('canvasWrapper'),
  gravitySlider: document.getElementById('gravitySlider'),
  gravityVal: document.getElementById('gravityVal'),
  restitutionSlider: document.getElementById('restitutionSlider'),
  restitutionVal: document.getElementById('restitutionVal'),
  frictionSlider: document.getElementById('frictionSlider'),
  frictionVal: document.getElementById('frictionVal'),
  showContactsToggle: document.getElementById('showContactsToggle'),
  showVelocitiesToggle: document.getElementById('showVelocitiesToggle'),
  wireframeToggle: document.getElementById('wireframeToggle'),
  spawnCircleBtn: document.getElementById('spawnCircleBtn'),
  spawnBoxBtn: document.getElementById('spawnBoxBtn'),
  spawnTriangleBtn: document.getElementById('spawnTriangleBtn'),
  clearBtn: document.getElementById('clearBtn'),
  presetStackBtn: document.getElementById('presetStackBtn'),
  fpsStat: document.getElementById('fpsStat'),
  bodiesStat: document.getElementById('bodiesStat'),
  contactsStat: document.getElementById('contactsStat'),
};

let ctx;
let bodies = [];
let _animId = null;
let lastTime = performance.now();
let dragJoint = null; // Mouse joint representation

let resizeTimeout = null;

function initPhysicsSandbox() {
  ctx = els.canvas.getContext('2d');
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  bindEvents();
  spawnStaticBorders();

  // Start loop
  _animId = requestAnimationFrame(physicsLoop);
}

function resizeCanvas() {
  const rect = els.wrapper.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  els.canvas.width = rect.width * dpr;
  els.canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);

  if (resizeTimeout) clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    // Remove old borders and recreate them
    bodies = bodies.filter((b) => !b.isBorder);
    spawnStaticBorders();
  }, 150);
}

function bindEvents() {
  els.gravitySlider.addEventListener('input', (e) => {
    els.gravityVal.textContent = parseFloat(e.target.value).toFixed(1) + ' m/s²';
  });

  els.restitutionSlider.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    els.restitutionVal.textContent = val.toFixed(2);
    bodies.forEach((b) => {
      if (!b.isStatic) b.restitution = val;
    });
  });

  els.frictionSlider.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    els.frictionVal.textContent = val.toFixed(2);
    bodies.forEach((b) => {
      if (!b.isStatic) b.friction = val;
    });
  });

  els.spawnCircleBtn.addEventListener('click', () => spawnShape('circle'));
  els.spawnBoxBtn.addEventListener('click', () => spawnShape('box'));
  els.spawnTriangleBtn.addEventListener('click', () => spawnShape('triangle'));
  els.clearBtn.addEventListener('click', clearWorld);
  els.presetStackBtn.addEventListener('click', spawnPresetStack);

  els.canvas.addEventListener('mousedown', handleMouseDown);
  els.canvas.addEventListener('mousemove', handleMouseMove);
  els.canvas.addEventListener('mouseup', handleMouseUp);
}

function spawnStaticBorders() {
  const rect = els.wrapper.getBoundingClientRect();
  const thickness = 40;

  // Floor
  const floor = new Body({
    position: new Vec2(rect.width / 2, rect.height + thickness / 2 - 10),
    vertices: [
      new Vec2(-rect.width / 2, -thickness / 2),
      new Vec2(rect.width / 2, -thickness / 2),
      new Vec2(rect.width / 2, thickness / 2),
      new Vec2(-rect.width / 2, thickness / 2),
    ],
    type: 'polygon',
    isStatic: true,
  });
  floor.isBorder = true;
  bodies.push(floor);

  // Ceil
  const ceil = new Body({
    position: new Vec2(rect.width / 2, -thickness / 2 + 10),
    vertices: [
      new Vec2(-rect.width / 2, -thickness / 2),
      new Vec2(rect.width / 2, -thickness / 2),
      new Vec2(rect.width / 2, thickness / 2),
      new Vec2(-rect.width / 2, thickness / 2),
    ],
    type: 'polygon',
    isStatic: true,
  });
  ceil.isBorder = true;
  bodies.push(ceil);

  // Left Wall
  const leftWall = new Body({
    position: new Vec2(-thickness / 2 + 10, rect.height / 2),
    vertices: [
      new Vec2(-thickness / 2, -rect.height / 2),
      new Vec2(thickness / 2, -rect.height / 2),
      new Vec2(thickness / 2, rect.height / 2),
      new Vec2(-thickness / 2, rect.height / 2),
    ],
    type: 'polygon',
    isStatic: true,
  });
  leftWall.isBorder = true;
  bodies.push(leftWall);

  // Right Wall
  const rightWall = new Body({
    position: new Vec2(rect.width + thickness / 2 - 10, rect.height / 2),
    vertices: [
      new Vec2(-thickness / 2, -rect.height / 2),
      new Vec2(thickness / 2, -rect.height / 2),
      new Vec2(thickness / 2, rect.height / 2),
      new Vec2(-thickness / 2, rect.height / 2),
    ],
    type: 'polygon',
    isStatic: true,
  });
  rightWall.isBorder = true;
  bodies.push(rightWall);
}

function spawnShape(shapeType, x, y, isStatic = false) {
  const rect = els.wrapper.getBoundingClientRect();
  const px = x !== undefined && x !== null ? x : rect.width / 2 + (Math.random() - 0.5) * 60;
  const py = y !== undefined && y !== null ? y : rect.height / 3 + (Math.random() - 0.5) * 30;

  const rest = parseFloat(els.restitutionSlider.value);
  const fric = parseFloat(els.frictionSlider.value);

  let b;
  if (shapeType === 'circle') {
    b = new Body({
      position: new Vec2(px, py),
      radius: 20 + Math.random() * 10,
      type: 'circle',
      restitution: rest,
      friction: fric,
      isStatic,
    });
  } else if (shapeType === 'box') {
    const w = 40 + Math.random() * 20;
    const h = 40 + Math.random() * 20;
    b = new Body({
      position: new Vec2(px, py),
      vertices: [
        new Vec2(-w / 2, -h / 2),
        new Vec2(w / 2, -h / 2),
        new Vec2(w / 2, h / 2),
        new Vec2(-w / 2, h / 2),
      ],
      type: 'polygon',
      restitution: rest,
      friction: fric,
      isStatic,
    });
  } else if (shapeType === 'triangle') {
    const r = 25 + Math.random() * 10;
    b = new Body({
      position: new Vec2(px, py),
      vertices: [new Vec2(0, -r), new Vec2(r * 0.86, r * 0.5), new Vec2(-r * 0.86, r * 0.5)],
      type: 'polygon',
      restitution: rest,
      friction: fric,
      isStatic,
    });
  }

  if (b) bodies.push(b);
}

function clearWorld() {
  bodies = [];
  spawnStaticBorders();
}

function spawnPresetStack() {
  clearWorld();
  const rect = els.wrapper.getBoundingClientRect();
  const startX = rect.width / 2;
  const floorY = rect.height - 40;

  // Spawn bottom static anchor/box
  spawnShape('box', startX, floorY - 30, true);

  // Spawn stacking boxes
  for (let i = 0; i < 5; i++) {
    spawnShape('box', startX + (Math.random() - 0.5) * 4, floorY - 90 - i * 55);
  }
}

// ==========================================
// USER INTERACTIVE DRAG ACTION
// ==========================================

function getMouseCoords(e) {
  const rect = els.canvas.getBoundingClientRect();
  return {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top,
  };
}

function handleMouseDown(e) {
  const mouse = getMouseCoords(e);
  const mv = new Vec2(mouse.x, mouse.y);

  // If shift is held, spawn static shape
  if (e.shiftKey) {
    spawnShape(Math.random() > 0.5 ? 'box' : 'circle', mouse.x, mouse.y, true);
    return;
  }

  // Try hit body
  for (const b of bodies) {
    if (b.isStatic) continue;

    if (b.type === 'circle') {
      const d = b.position.sub(mv).len();
      if (d <= b.radius) {
        dragJoint = { body: b, localOffset: mv.sub(b.position) };
        return;
      }
    } else if (b.type === 'polygon') {
      // SAT inside test
      const pts = b.getTransformedVertices();
      let inside = true;
      for (let i = 0; i < pts.length; i++) {
        const p1 = pts[i];
        const p2 = pts[(i + 1) % pts.length];
        const edge = p2.sub(p1);
        const toMouse = mv.sub(p1);
        if (edge.cross(toMouse) < 0) {
          inside = false;
          break;
        }
      }
      if (inside) {
        // Store offset relative to body space
        const cos = Math.cos(-b.angle);
        const sin = Math.sin(-b.angle);
        const rel = mv.sub(b.position);
        const local = new Vec2(rel.x * cos - rel.y * sin, rel.x * sin + rel.y * cos);
        dragJoint = { body: b, localOffset: local };
        return;
      }
    }
  }
}

function handleMouseMove(e) {
  if (dragJoint) {
    const mouse = getMouseCoords(e);
    const mv = new Vec2(mouse.x, mouse.y);
    const b = dragJoint.body;

    // Retrieve offset in world space
    const cos = Math.cos(b.angle);
    const sin = Math.sin(b.angle);
    const worldOffset = new Vec2(
      dragJoint.localOffset.x * cos - dragJoint.localOffset.y * sin,
      dragJoint.localOffset.x * sin + dragJoint.localOffset.y * cos
    );

    const targetPos = mv.sub(worldOffset);

    // Pseudo-joint spring pull
    b.velocity = targetPos.sub(b.position).mult(15.0);
  }
}

function handleMouseUp() {
  dragJoint = null;
}

// ==========================================
// CORE PHYSICS SIMULATION LOOP
// ==========================================

function updatePhysics(dt) {
  const gravityValue = parseFloat(els.gravitySlider.value);
  const gravity = new Vec2(0, gravityValue * 20); // Scale for visual effect

  // 1. Integration (apply gravity)
  for (const b of bodies) {
    if (b.isStatic) continue;
    b.velocity = b.velocity.add(gravity.mult(dt));
    b.position = b.position.add(b.velocity.mult(dt));
    b.angle += b.angularVelocity * dt;
  }

  // 2. Collision manifold checks & broad-phase
  const manifolds = [];
  let checks = 0;

  for (let i = 0; i < bodies.length; i++) {
    for (let j = i + 1; j < bodies.length; j++) {
      const bodyA = bodies[i];
      const bodyB = bodies[j];

      if (bodyA.isStatic && bodyB.isStatic) continue;

      checks++;
      const m = generateManifold(bodyA, bodyB);
      if (m) {
        manifolds.push(m);
      }
    }
  }

  // 3. Resolve Velocities & Contacts (impulse steps)
  const iterations = 8;
  for (let iter = 0; iter < iterations; iter++) {
    for (const m of manifolds) {
      resolveCollision(m);
    }
  }

  // 4. Resolve Penetration Sinking
  for (const m of manifolds) {
    positionalCorrection(m);
  }

  // Update statistics
  els.bodiesStat.textContent = bodies.filter((b) => !b.isStatic).length;
  els.contactsStat.textContent = checks;
}

function drawWorld() {
  const rect = els.wrapper.getBoundingClientRect();
  ctx.clearRect(0, 0, rect.width, rect.height);

  const wireframe = els.wireframeToggle.checked;
  const showVel = els.showVelocitiesToggle.checked;
  const showContacts = els.showContactsToggle.checked;

  for (const b of bodies) {
    ctx.save();

    if (b.isStatic) {
      ctx.fillStyle = '#1e293b';
      ctx.strokeStyle = '#64748b';
    } else {
      ctx.fillStyle = wireframe ? 'transparent' : 'rgba(59, 130, 246, 0.2)';
      ctx.strokeStyle = '#3b82f6';
    }
    ctx.lineWidth = 2;

    if (b.type === 'circle') {
      ctx.beginPath();
      ctx.arc(b.position.x, b.position.y, b.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Draw alignment/rotation line
      ctx.beginPath();
      ctx.moveTo(b.position.x, b.position.y);
      ctx.lineTo(
        b.position.x + Math.cos(b.angle) * b.radius,
        b.position.y + Math.sin(b.angle) * b.radius
      );
      ctx.strokeStyle = '#60a5fa';
      ctx.stroke();
    } else if (b.type === 'polygon') {
      const pts = b.getTransformedVertices();
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) {
        ctx.lineTo(pts[i].x, pts[i].y);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    // Optional Velocity Vector representation
    if (showVel && !b.isStatic && b.velocity.lenSq() > 1.0) {
      ctx.beginPath();
      ctx.moveTo(b.position.x, b.position.y);
      ctx.lineTo(b.position.x + b.velocity.x * 0.2, b.position.y + b.velocity.y * 0.2);
      ctx.strokeStyle = '#ef4444';
      ctx.stroke();
    }

    ctx.restore();
  }

  // Render Contact Manifolds & contact normals
  if (showContacts) {
    let activeContacts = [];
    // Perform manifold check once again for visual feedback
    for (let i = 0; i < bodies.length; i++) {
      for (let j = i + 1; j < bodies.length; j++) {
        const m = generateManifold(bodies[i], bodies[j]);
        if (m) {
          activeContacts.push(m);
        }
      }
    }

    for (const m of activeContacts) {
      for (const pt of m.contacts) {
        // Draw normal vector
        ctx.beginPath();
        ctx.moveTo(pt.x, pt.y);
        ctx.lineTo(pt.x + m.normal.x * 15, pt.y + m.normal.y * 15);
        ctx.strokeStyle = '#fbbf24'; // Yellow
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Draw contact point
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#fbbf24';
        ctx.fill();
      }
    }
  }
}

function physicsLoop(timestamp) {
  let dt = (timestamp - lastTime) / 1000;
  lastTime = timestamp;

  // Cap dt to avoid instability on frame lags
  if (dt > 0.1) dt = 0.1;

  // Fixed timestep update
  updatePhysics(dt);
  drawWorld();

  // FPS Telemetry
  const fps = Math.round(1 / dt);
  if (timestamp % 200 < 20) {
    els.fpsStat.textContent = isFinite(fps) ? fps : 60;
  }

  _animId = requestAnimationFrame(physicsLoop);
}
