const U = document.getElementById.bind(document);
const C = document.createElement.bind(document);

const DAYS = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const DOOM_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = [
  '',
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

let targetDate = new Date();
let animTimer = null;
let currentDayIdx = -1;

function initHeroCanvas() {
  const c = U('zelHeroCanvas');
  if (!c) return;
  const ctx = c.getContext('2d');
  let t = 0;
  function resize() {
    c.width = c.parentElement.clientWidth;
    c.height = c.parentElement.clientHeight;
  }
  window.addEventListener('resize', resize);
  resize();
  function draw() {
    ctx.clearRect(0, 0, c.width, c.height);
    t += 0.02;
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(245,158,11,0.15)';

    let cx = c.width / 2;
    let cy = c.height / 2;

    for (let i = 0; i < 7; i++) {
      let r = 80 + i * 20;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();

      let ang = t * (1 - i * 0.1) + (i * Math.PI) / 3;
      let px = cx + Math.cos(ang) * r;
      let py = cy + Math.sin(ang) * r;

      ctx.fillStyle = i % 2 === 0 ? '#f59e0b' : '#ef4444';
      ctx.beginPath();
      ctx.arc(px, py, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    requestAnimationFrame(draw);
  }
  draw();
}

function parseInputDate() {
  let val = U('datePicker').value;
  if (!val) return null;
  let parts = val.split('-');
  let y = parseInt(parts[0], 10);
  let m = parseInt(parts[1], 10);
  let d = parseInt(parts[2], 10);
  return { y, m, d };
}

function getZellerData(y, m, d) {
  let q = d;
  let M = m;
  let Y = y;
  if (M === 1 || M === 2) {
    M += 12;
    Y -= 1;
  }
  let K = Y % 100;
  let J = Math.floor(Y / 100);

  let t1 = q;
  let t2 = Math.floor((13 * (M + 1)) / 5);
  let t3 = K;
  let t4 = Math.floor(K / 4);
  let t5 = Math.floor(J / 4);
  let t6 = 2 * J;

  let sum = t1 + t2 + t3 + t4 + t5 - t6;
  let h = ((sum % 7) + 7) % 7;

  return { q, M, Y, K, J, t1, t2, t3, t4, t5, t6, sum, h };
}

function getDoomData(y, m, d) {
  let c = Math.floor(y / 100);
  let yy = y % 100;

  let cAnchor = (5 * (c % 4) + 2) % 7;
  let a = Math.floor(yy / 12);
  let b = yy % 12;
  let c2 = Math.floor(b / 4);
  let yAnchor = (cAnchor + a + b + c2) % 7;

  let isLeap = y % 4 === 0 && (y % 100 !== 0 || y % 400 === 0);

  let dDay = 0;
  if (m === 4) dDay = 4;
  else if (m === 6) dDay = 6;
  else if (m === 8) dDay = 8;
  else if (m === 10) dDay = 10;
  else if (m === 12) dDay = 12;
  else if (m === 5) dDay = 9;
  else if (m === 9) dDay = 5;
  else if (m === 7) dDay = 11;
  else if (m === 11) dDay = 7;
  else if (m === 3) dDay = 14;
  else if (m === 1) dDay = isLeap ? 4 : 3;
  else if (m === 2) dDay = isLeap ? 29 : 28;

  let diff = d - dDay;
  let w = (((yAnchor + diff) % 7) + 7) % 7;

  return { c, yy, cAnchor, a, b, c2, yAnchor, isLeap, dDay, diff, w };
}

function clearPanel(panelId) {
  U(panelId).innerHTML = '';
}

function addStep(panelId, idx, desc, val, hlClass = '') {
  let cont = U(panelId);
  let d = C('div');
  d.className = 'z-step';
  d.style.animationDelay = idx * 0.4 + 's';

  let n = C('div');
  n.className = 'z-step-num' + (panelId === 'doomSteps' ? ' z-step-doom-num' : '');
  n.innerText = idx;

  let t = C('div');
  t.className = 'z-step-desc';
  t.innerHTML = desc;

  let v = C('div');
  v.className = 'z-step-val ' + hlClass;
  v.innerText = val;

  d.appendChild(n);
  d.appendChild(t);
  d.appendChild(v);
  cont.appendChild(d);
}

function showResult(boxId, numId, dayId, num, dayName, isZeller = true) {
  let box = U(boxId);
  let c = U(numId);
  let d = U(dayId);

  box.style.borderColor = isZeller ? '#f59e0b' : '#8b5cf6';
  box.style.background = isZeller ? 'rgba(245,158,11,0.2)' : 'rgba(139,92,246,0.2)';

  c.innerText = num;
  d.innerText = dayName;
}

function runComputation() {
  let date = parseInputDate();
  if (!date) return;

  U('statDate').innerText = `${MONTHS[date.m]} ${date.d}, ${date.y}`;
  U('statZeller').innerText = '?';
  U('statDoomsday').innerText = '?';

  let jsD = new Date(date.y, date.m - 1, date.d);
  let jsDay = DOOM_DAYS[jsD.getDay()];
  U('statJS').innerText = jsDay;

  clearPanel('zellerSteps');
  clearPanel('doomSteps');

  U('zellerResultBox').style.background = 'rgba(245,158,11,0.1)';
  U('zellerResultBox').style.borderColor = 'rgba(245,158,11,0.4)';
  U('zellerResNum').innerText = '?';
  U('zellerResDay').innerText = 'Computing...';

  U('doomResultBox').style.background = 'rgba(139,92,246,0.1)';
  U('doomResultBox').style.borderColor = 'rgba(139,92,246,0.4)';
  U('doomResNum').innerText = '?';
  U('doomResDay').innerText = 'Computing...';

  let zd = getZellerData(date.y, date.m, date.d);

  addStep('zellerSteps', 1, `Day of month (q)`, zd.q);
  addStep(
    'zellerSteps',
    2,
    `Month adjustment (m). Jan/Feb become 13/14 of prev year.`,
    `M = ${zd.M}`
  );
  addStep('zellerSteps', 3, `Year of century (K = ${zd.Y} % 100)`, `K = ${zd.K}`);
  addStep('zellerSteps', 4, `Zero-indexed century (J = ${zd.Y} / 100)`, `J = ${zd.J}`);
  addStep('zellerSteps', 5, `⌊13(m+1)/5⌋`, zd.t2);
  addStep(
    'zellerSteps',
    6,
    `Leap year adjustments: ⌊K/4⌋ + ⌊J/4⌋ - 2J`,
    `${zd.t4} + ${zd.t5} - ${zd.t6}`
  );
  addStep('zellerSteps', 7, `Sum all terms`, `Sum = ${zd.sum}`);
  addStep('zellerSteps', 8, `h = Sum mod 7. (0=Sat, 1=Sun, 2=Mon...)`, `h = ${zd.h}`, 'hl-yellow');

  setTimeout(
    () => {
      showResult('zellerResultBox', 'zellerResNum', 'zellerResDay', zd.h, DAYS[zd.h], true);
      U('statZeller').innerText = DAYS[zd.h];
    },
    8 * 400 + 200
  );

  let dd = getDoomData(date.y, date.m, date.d);

  addStep(
    'doomSteps',
    1,
    `Century Anchor for ${dd.c}00s. Formula: 5*(c%4)+2 mod 7`,
    `Anchor = ${dd.cAnchor} (${DOOM_DAYS[dd.cAnchor]})`
  );
  addStep(
    'doomSteps',
    2,
    `Year offset for YY = ${dd.yy}. YY/12 + YY%12 + (YY%12)/4`,
    `${dd.a} + ${dd.b} + ${dd.c2} = ${dd.a + dd.b + dd.c2}`
  );
  addStep(
    'doomSteps',
    3,
    `Year's Doomsday: Anchor + Offset mod 7`,
    `Y-Doom = ${dd.yAnchor} (${DOOM_DAYS[dd.yAnchor]})`
  );
  addStep('doomSteps', 4, `Leap year check for ${date.y}`, dd.isLeap ? 'Yes' : 'No');
  addStep('doomSteps', 5, `Nearest memorable Doomsday for Month ${date.m}`, `${date.m}/${dd.dDay}`);
  addStep(
    'doomSteps',
    6,
    `Count offset from ${date.m}/${dd.dDay} to target ${date.m}/${date.d}`,
    `Diff = ${dd.diff}`
  );
  addStep('doomSteps', 7, `Final Day: Y-Doom + Diff mod 7`, `w = ${dd.w}`, 'hl-purple');

  setTimeout(
    () => {
      showResult('doomResultBox', 'doomResNum', 'doomResDay', dd.w, DOOM_DAYS[dd.w], false);
      U('statDoomsday').innerText = DOOM_DAYS[dd.w];
    },
    7 * 400 + 200
  );
}

function newChallenge() {
  let y = 1800 + Math.floor(Math.random() * 300);
  let m = 1 + Math.floor(Math.random() * 12);
  let d = 1 + Math.floor(Math.random() * 28);

  let dd = getDoomData(y, m, d);
  currentDayIdx = dd.w;

  U('cTargetDate').innerText = `${MONTHS[m]} ${d}, ${y}`;

  document.querySelectorAll('.c-day-btn').forEach((b) => {
    b.className = 'c-day-btn';
  });

  let fb = U('cFeedback');
  fb.className = 'c-feedback';
  fb.innerText = '';
}

U('btnCompute').addEventListener('click', runComputation);
U('selPreset').addEventListener('change', (e) => {
  if (e.target.value !== 'custom') {
    U('datePicker').value = e.target.value;
    runComputation();
  }
});
U('datePicker').addEventListener('change', () => {
  U('selPreset').value = 'custom';
});

document.querySelectorAll('.c-day-btn').forEach((btn) => {
  btn.addEventListener('click', (e) => {
    if (currentDayIdx === -1) return;
    let selected = parseInt(e.target.getAttribute('data-day'), 10);

    let fb = U('cFeedback');
    if (selected === currentDayIdx) {
      e.target.classList.add('correct');
      fb.className = 'c-feedback success';
      fb.innerText = 'Correct! Fast mental math!';
      currentDayIdx = -1;
    } else {
      e.target.classList.add('wrong');
      fb.className = 'c-feedback error';
      fb.innerText = 'Incorrect. Try recounting from the anchor!';
      setTimeout(() => {
        e.target.classList.remove('wrong');
      }, 500);
    }
  });
});
U('btnNewChallenge').addEventListener('click', newChallenge);

document.addEventListener('DOMContentLoaded', () => {
  initHeroCanvas();
  runComputation();
  newChallenge();
});
