/**
 * dining-philosophers.js
 * Visualizes the Dining Philosophers concurrency problem using HTML5 Canvas.
 */

document.addEventListener('DOMContentLoaded', () => {
  new DiningPhilosophersVisualizer();
});

const STATES = {
  THINKING: 'THINKING',
  HUNGRY: 'HUNGRY',
  EATING: 'EATING',
};

const COLORS = {
  [STATES.THINKING]: '#64748b',
  [STATES.HUNGRY]: '#f59e0b',
  [STATES.EATING]: '#10b981',
  DEADLOCK: '#ef4444',
  FORK_AVAILABLE: '#cbd5e1',
  FORK_HELD: '#f59e0b',
};

class DiningPhilosophersVisualizer {
  constructor() {
    this.cacheDOM();
    this.bindEvents();

    this.numPhilosophers = 5;
    this.philosophers = [];
    this.forks = [];

    this.isRunning = false;
    this.isDeadlockForced = false;
    this.useHierarchy = false;
    this.useArbitrator = false;

    this.animationId = null;
    this.tickRate = 1000;
    this.lastTick = 0;
    this.globalMeals = 0;

    this.initCanvas();
    this.resetSimulation();
    this.startRenderLoop();
  }

  cacheDOM() {
    this.els = {
      canvas: document.getElementById('dpCanvas'),
      btnToggleSim: document.getElementById('btnToggleSim'),
      btnReset: document.getElementById('btnReset'),
      btnForceDeadlock: document.getElementById('btnForceDeadlock'),
      toggleHierarchy: document.getElementById('toggleHierarchy'),
      toggleArbitrator: document.getElementById('toggleArbitrator'),
      sliderPhilosophers: document.getElementById('sliderPhilosophers'),
      lblPhilosopherCount: document.getElementById('lblPhilosopherCount'),

      globalBadge: document.getElementById('globalStateBadge'),
      statThinking: document.getElementById('statThinking'),
      statHungry: document.getElementById('statHungry'),
      statEating: document.getElementById('statEating'),
      statTotalMeals: document.getElementById('statTotalMeals'),

      logContainer: document.getElementById('logContainer'),
      btnClearLog: document.getElementById('btnClearLog'),
    };
  }

  bindEvents() {
    window.addEventListener('resize', () => this.resizeCanvas());

    this.els.btnToggleSim.addEventListener('click', () => this.toggleSimulation());
    this.els.btnReset.addEventListener('click', () => this.resetSimulation());
    this.els.btnForceDeadlock.addEventListener('click', () => this.forceDeadlock());

    this.els.toggleHierarchy.addEventListener('change', (e) => {
      this.useHierarchy = e.target.checked;
      if (this.useHierarchy) {
        this.els.toggleArbitrator.checked = false;
        this.useArbitrator = false;
      }
      this.log(
        `System: Resource Hierarchy Mitigation ${this.useHierarchy ? 'ENABLED' : 'DISABLED'}.`,
        'system'
      );
    });

    this.els.toggleArbitrator.addEventListener('change', (e) => {
      this.useArbitrator = e.target.checked;
      if (this.useArbitrator) {
        this.els.toggleHierarchy.checked = false;
        this.useHierarchy = false;
      }
      this.log(
        `System: Arbitrator (Waiter) Mitigation ${this.useArbitrator ? 'ENABLED' : 'DISABLED'}.`,
        'system'
      );
    });

    this.els.sliderPhilosophers.addEventListener('input', (e) => {
      this.numPhilosophers = parseInt(e.target.value, 10);
      this.els.lblPhilosopherCount.textContent = this.numPhilosophers;
      this.resetSimulation();
    });

    this.els.btnClearLog.addEventListener('click', () => {
      this.els.logContainer.innerHTML = '';
    });

    this.els.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
  }

  handleCanvasClick(e) {
    if (!this.ctx) return;
    const rect = this.els.canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (this.els.canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (this.els.canvas.height / rect.height);

    const cx = this.width / 2;
    const cy = this.height / 2;
    const tableRadius = Math.min(cx, cy) * 0.5;
    const angleStep = (Math.PI * 2) / this.numPhilosophers;

    for (let i = 0; i < this.numPhilosophers; i++) {
      const angle = i * angleStep - Math.PI / 2;
      const dist = tableRadius * 0.9;
      const px = cx + Math.cos(angle) * dist;
      const py = cy + Math.sin(angle) * dist;

      // distance to click
      const dx = px - x;
      const dy = py - y;
      if (Math.sqrt(dx * dx + dy * dy) <= 35) {
        const p = this.philosophers[i];
        if (p.state === STATES.THINKING) {
          p.state = STATES.HUNGRY;
          this.log(`P${p.id} MANUALLY toggled to HUNGRY.`, 'hungry');
        }
        break;
      }
    }
  }

  initCanvas() {
    this.ctx = this.els.canvas.getContext('2d');
    this.resizeCanvas();
  }

  resizeCanvas() {
    const rect = this.els.canvas.parentElement.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.els.canvas.width = rect.width * dpr;
    this.els.canvas.height = rect.height * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.width = rect.width;
    this.height = rect.height;
  }

  resetSimulation() {
    this.isRunning = false;
    this.isDeadlockForced = false;
    this.globalMeals = 0;

    this.philosophers = [];
    this.forks = Array(this.numPhilosophers)
      .fill(null)
      .map(() => ({ owner: null, visualX: 0, visualY: 0 }));

    for (let i = 0; i < this.numPhilosophers; i++) {
      this.philosophers.push({
        id: i,
        state: STATES.THINKING,
        hasLeftFork: false,
        hasRightFork: false,
        eatingTime: 0,
        starvationTime: 0,
        mealsEaten: 0,
      });
    }

    this.els.btnToggleSim.innerHTML = '<i class="fas fa-play"></i> Start Random Simulation';
    this.updateBadge('IDLE', 'idle');
    this.updateStats();

    // reset fork visual positions immediately
    this.updateForkVisualTargets(true);
  }

  toggleSimulation() {
    this.isRunning = !this.isRunning;
    this.isDeadlockForced = false;

    if (this.isRunning) {
      this.els.btnToggleSim.innerHTML = '<i class="fas fa-pause"></i> Pause Simulation';
      this.updateBadge('RUNNING', 'running');
      this.log('System: Random simulation started.', 'system');
    } else {
      this.els.btnToggleSim.innerHTML = '<i class="fas fa-play"></i> Resume Simulation';
      this.updateBadge('PAUSED', 'idle');
      this.log('System: Simulation paused.', 'system');
    }
  }

  forceDeadlock() {
    this.isRunning = true;
    this.isDeadlockForced = true;
    this.els.btnToggleSim.innerHTML = '<i class="fas fa-pause"></i> Pause Simulation';
    this.updateBadge('FORCING DEADLOCK...', 'running');
    this.log('System: Forcing symmetric resource requests (Deadlock scenario)...', 'deadlock');

    // Reset state so everyone wants to eat immediately
    this.philosophers.forEach((p) => {
      p.state = STATES.HUNGRY;
      p.hasLeftFork = false;
      p.hasRightFork = false;
      p.starvationTime = 0;
    });

    this.forks.forEach((f) => (f.owner = null));
    this.updateStats();
  }

  log(message, type = 'system') {
    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;

    const now = new Date();
    const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}.${now.getMilliseconds().toString().padStart(3, '0')}`;

    entry.textContent = `[${time}] ${message}`;
    this.els.logContainer.appendChild(entry);
    this.els.logContainer.scrollTop = this.els.logContainer.scrollHeight;
  }

  updateStats() {
    const thinking = this.philosophers.filter((p) => p.state === STATES.THINKING).length;
    const hungry = this.philosophers.filter((p) => p.state === STATES.HUNGRY).length;
    const eating = this.philosophers.filter((p) => p.state === STATES.EATING).length;

    this.els.statThinking.textContent = thinking;
    this.els.statHungry.textContent = hungry;
    this.els.statEating.textContent = eating;
    this.els.statTotalMeals.textContent = this.globalMeals;

    if (
      hungry === this.numPhilosophers &&
      this.philosophers.every((p) => p.hasLeftFork || p.hasRightFork)
    ) {
      // Everyone is hungry and holds exactly one fork -> Deadlock
      this.updateBadge('DEADLOCK!', 'deadlock');
    } else if (this.isRunning && !this.isDeadlockForced) {
      this.updateBadge('RUNNING', 'running');
    }
  }

  updateBadge(text, type) {
    this.els.globalBadge.textContent = text;
    this.els.globalBadge.className = `status-badge ${type}`;
  }

  startRenderLoop() {
    const loop = (timestamp) => {
      const dt = timestamp - this.lastTick;
      if (dt > 100) {
        this.logicTick();
        this.lastTick = timestamp;
      }
      this.updateForkVisualTargets(false);
      this.render();
      this.animationId = requestAnimationFrame(loop);
    };
    this.animationId = requestAnimationFrame(loop);
  }

  updateForkVisualTargets(instant = false) {
    if (!this.ctx) return;
    const cx = this.width / 2;
    const cy = this.height / 2;
    const tableRadius = Math.min(cx, cy) * 0.5;
    const angleStep = (Math.PI * 2) / this.numPhilosophers;

    for (let i = 0; i < this.numPhilosophers; i++) {
      const angle = i * angleStep + angleStep / 2 - Math.PI / 2;
      const dist = tableRadius * 0.6;

      let targetX = cx + Math.cos(angle) * dist;
      let targetY = cy + Math.sin(angle) * dist;

      const owner = this.forks[i].owner;
      if (owner !== null) {
        const ownerAngle = owner * angleStep - Math.PI / 2;
        targetX = cx + Math.cos(ownerAngle) * (tableRadius * 0.75);
        targetY = cy + Math.sin(ownerAngle) * (tableRadius * 0.75);
      }

      if (instant) {
        this.forks[i].visualX = targetX;
        this.forks[i].visualY = targetY;
      } else {
        // smooth interpolate
        this.forks[i].visualX += (targetX - this.forks[i].visualX) * 0.1;
        this.forks[i].visualY += (targetY - this.forks[i].visualY) * 0.1;
      }
    }
  }

  logicTick() {
    if (!this.isRunning) return;

    let deadlocked = true;
    let currentlyEatingOrHolding = this.philosophers.filter(
      (p) => p.state === STATES.EATING || this.forks.some((f) => f.owner === p.id)
    ).length;

    for (let i = 0; i < this.numPhilosophers; i++) {
      const p = this.philosophers[i];

      // Fork Indices
      const leftForkIdx = i;
      const rightForkIdx = (i + 1) % this.numPhilosophers;

      let firstFork = leftForkIdx;
      let secondFork = rightForkIdx;

      // Resource Hierarchy Mitigation: Always request lowest numbered fork first
      if (this.useHierarchy) {
        if (leftForkIdx > rightForkIdx) {
          firstFork = rightForkIdx;
          secondFork = leftForkIdx;
        }
      }

      if (p.state === STATES.THINKING) {
        deadlocked = false;
        if (!this.isDeadlockForced) {
          if (Math.random() < 0.1) {
            p.state = STATES.HUNGRY;
            p.starvationTime = 0;
            this.log(`P${p.id} is now HUNGRY.`, 'hungry');
          }
        }
      } else if (p.state === STATES.HUNGRY) {
        p.starvationTime++;
        const holdsFirst = this.forks[firstFork].owner === p.id;
        const holdsSecond = this.forks[secondFork].owner === p.id;

        let canProceed = true;
        if (this.useArbitrator && !holdsFirst && !holdsSecond) {
          // Waiter logic: don't allow picking up if it would cause N hungry/holding philosophers
          if (currentlyEatingOrHolding >= this.numPhilosophers - 1) {
            canProceed = false;
          }
        }

        if (canProceed && !holdsFirst && !holdsSecond) {
          if (this.forks[firstFork].owner === null) {
            this.forks[firstFork].owner = p.id;
            this.log(`P${p.id} acquired Fork ${firstFork}.`, 'system');
            deadlocked = false;
            if (this.useArbitrator) currentlyEatingOrHolding++;
          }
        } else if (holdsFirst && !holdsSecond) {
          if (this.forks[secondFork].owner === null) {
            this.forks[secondFork].owner = p.id;
            p.state = STATES.EATING;
            p.eatingTime = 5;
            this.log(`P${p.id} acquired Fork ${secondFork} and started EATING.`, 'eating');
            deadlocked = false;
          }
        }
      } else if (p.state === STATES.EATING) {
        deadlocked = false;
        p.eatingTime--;
        if (p.eatingTime <= 0) {
          this.forks[firstFork].owner = null;
          this.forks[secondFork].owner = null;
          p.state = STATES.THINKING;
          p.mealsEaten++;
          this.globalMeals++;
          if (this.useArbitrator) currentlyEatingOrHolding--;
          this.log(`P${p.id} finished eating, released forks, and is THINKING.`, 'thinking');
        }
      }
    }

    this.updateStats();

    if (deadlocked && this.philosophers.every((p) => p.state === STATES.HUNGRY)) {
      // Already deadlocked
      this.isRunning = false;
      this.log('SYSTEM HALTED: Deadlock Detected.', 'deadlock');
      this.updateBadge('DEADLOCK DETECTED', 'deadlock');
    }
  }

  render() {
    if (!this.ctx) return;
    this.ctx.clearRect(0, 0, this.width, this.height);

    const cx = this.width / 2;
    const cy = this.height / 2;
    const tableRadius = Math.min(cx, cy) * 0.5;

    // Draw Table
    this.ctx.beginPath();
    this.ctx.arc(cx, cy, tableRadius, 0, Math.PI * 2);
    this.ctx.fillStyle = 'rgba(30, 41, 59, 0.8)';
    this.ctx.fill();
    this.ctx.lineWidth = 2;
    this.ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    this.ctx.stroke();

    // Draw Waiter (if Arbitrator enabled)
    if (this.useArbitrator) {
      this.ctx.beginPath();
      this.ctx.arc(cx, cy, 20, 0, Math.PI * 2);
      this.ctx.fillStyle = '#a855f7';
      this.ctx.fill();
      this.ctx.fillStyle = '#fff';
      this.ctx.font = '16px "Font Awesome 5 Free"'; // Use standard font for fallback, but wait, it's 'FontAwesome' or similar. We can just draw a symbol.
      this.ctx.font = '600 12px Poppins';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(`W`, cx, cy);
    }

    const angleStep = (Math.PI * 2) / this.numPhilosophers;

    // Draw Forks
    for (let i = 0; i < this.numPhilosophers; i++) {
      const angle = i * angleStep + angleStep / 2 - Math.PI / 2;
      const owner = this.forks[i].owner;

      const fx = this.forks[i].visualX || cx;
      const fy = this.forks[i].visualY || cy;

      this.ctx.save();
      this.ctx.translate(fx, fy);
      this.ctx.rotate(owner !== null ? angle + Math.PI / 4 : angle);

      this.ctx.beginPath();
      this.ctx.moveTo(0, -10);
      this.ctx.lineTo(0, 10);
      this.ctx.lineWidth = 3;
      this.ctx.strokeStyle = owner !== null ? COLORS.FORK_HELD : COLORS.FORK_AVAILABLE;
      this.ctx.stroke();

      // Tines
      this.ctx.beginPath();
      this.ctx.moveTo(-4, -10);
      this.ctx.lineTo(-4, -5);
      this.ctx.moveTo(4, -10);
      this.ctx.lineTo(4, -5);
      this.ctx.lineWidth = 2;
      this.ctx.stroke();

      this.ctx.restore();

      // Fork Label
      this.ctx.fillStyle = 'rgba(255,255,255,0.5)';
      this.ctx.font = '10px "Fira Code"';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      // Only draw label near original position
      const lx = cx + Math.cos(angle) * (tableRadius * 0.4);
      const ly = cy + Math.sin(angle) * (tableRadius * 0.4);
      this.ctx.fillText(`F${i}`, lx, ly);
    }

    // Draw Philosophers (Plates)
    for (let i = 0; i < this.numPhilosophers; i++) {
      const p = this.philosophers[i];
      const angle = i * angleStep - Math.PI / 2;
      const dist = tableRadius * 0.9;
      const px = cx + Math.cos(angle) * dist;
      const py = cy + Math.sin(angle) * dist;

      let color = COLORS[p.state];
      if (this.els.globalBadge.textContent.includes('DEADLOCK')) {
        color = COLORS.DEADLOCK;
      }

      // Outer Starvation Arc
      if (p.state === STATES.HUNGRY) {
        const maxStarvation = 30; // visually maxes at 30 ticks
        let arcFactor = Math.min(p.starvationTime / maxStarvation, 1.0);

        this.ctx.beginPath();
        this.ctx.arc(px, py, 42, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * arcFactor);
        this.ctx.lineWidth = 4;
        this.ctx.strokeStyle = arcFactor >= 1.0 ? '#ef4444' : '#f59e0b';
        this.ctx.stroke();

        if (arcFactor >= 1.0) {
          // Starving!
          color = '#ef4444';
        }
      }

      // Plate
      this.ctx.beginPath();
      this.ctx.arc(px, py, 35, 0, Math.PI * 2);
      this.ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      this.ctx.fill();
      this.ctx.lineWidth = p.state === STATES.EATING ? 4 : 2;
      this.ctx.strokeStyle = color;
      this.ctx.stroke();

      // Inner food (if eating)
      if (p.state === STATES.EATING) {
        this.ctx.beginPath();
        this.ctx.arc(px, py, 20, 0, Math.PI * 2);
        this.ctx.fillStyle = 'rgba(16, 185, 129, 0.3)';
        this.ctx.fill();
      }

      // Name
      this.ctx.fillStyle = '#fff';
      this.ctx.font = '600 14px Poppins';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(`P${p.id}`, px, py - 5);

      // State / Meals
      this.ctx.fillStyle = color;
      this.ctx.font = '500 10px Poppins';
      this.ctx.fillText(p.state, px, py + 12);

      // Meal badge
      this.ctx.beginPath();
      this.ctx.arc(px + 25, py - 25, 12, 0, Math.PI * 2);
      this.ctx.fillStyle = '#3b82f6';
      this.ctx.fill();
      this.ctx.fillStyle = '#fff';
      this.ctx.font = '700 10px Poppins';
      this.ctx.fillText(`${p.mealsEaten}`, px + 25, py - 25);
    }
  }
}
