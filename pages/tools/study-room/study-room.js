/**
 * Ambient Study Room — Algo Infinity Verse
 * Web Audio API sound engine + Pomodoro timer + persistence.
 *
 * Sound sources are procedurally generated (no external audio files).
 * All preferences are saved to localStorage under 'aiv_study_room'.
 */

/* ─── CONFIGURATION ─── */
const SR = {
  STORAGE_KEY: 'aiv_study_room_prefs',
  SESSION_KEY: 'aiv_study_room_sessions',
  SOUND_DEFS: [
    { id: 'lofi',   label: 'Lofi Beats',     icon: 'fa-headphones', desc: 'Chill study beats' },
    { id: 'rain',   label: 'Rain',            icon: 'fa-cloud-rain', desc: 'Steady drizzle' },
    { id: 'cafe',   label: 'Café Ambience',   icon: 'fa-mug-saucer', desc: 'Gentle café hum' },
    { id: 'fire',   label: 'Fireplace',       icon: 'fa-fire',       desc: 'Crackling warmth' },
    { id: 'ocean',  label: 'Ocean Waves',     icon: 'fa-water',      desc: 'Rhythmic surf' },
    { id: 'white',  label: 'White Noise',      icon: 'fa-circle',    desc: 'Neutral static' },
  ],
  PRESETS: {
    focus: { label: 'Deep Focus', sounds: { rain: 0.5, white: 0.3 } },
    cozy:  { label: 'Cozy Study', sounds: { fire: 0.5, lofi: 0.4 } },
    cafe:  { label: 'Café Vibes', sounds: { cafe: 0.5, lofi: 0.3 } },
    sleep: { label: 'Wind Down',  sounds: { ocean: 0.5, rain: 0.35 } },
  },
  DEFAULT_FOCUS: 25,
  DEFAULT_BREAK: 5,
  DAILY_GOAL: 8,
};

/* ─── SOUND ENGINE ─── */
class SoundEngine {
  constructor() {
    this.ctx = null;
    this.sources = {};   // { id: { nodes, gain } }
    this.muted = false;
    this._initialized = false;
  }

  /** Lazily init AudioContext (must be after user gesture) */
  _ensureContext() {
    if (this.ctx) return;
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) {
      console.warn('[SR] AudioContext not available');
      return;
    }
    this.ctx = new Ctor();
  }

  /** Resume context if suspended (browser autoplay policy) */
  _resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  /**
   * Start a procedural sound by ID.
   * Returns true if started, false if already running.
   */
  start(id, volume = 0.5) {
    if (this.sources[id]) return false; // already playing
    this._ensureContext();
    if (!this.ctx) return false;
    this._resume();

    const gain = this.ctx.createGain();
    gain.gain.value = this.muted ? 0 : Math.max(0, Math.min(1, volume));

    let nodes = null;
    switch (id) {
      case 'lofi':  nodes = this._buildLofi();  break;
      case 'rain':  nodes = this._buildRain();  break;
      case 'cafe':  nodes = this._buildCafe();  break;
      case 'fire':  nodes = this._buildFire();  break;
      case 'ocean': nodes = this._buildOcean(); break;
      case 'white': nodes = this._buildWhite(); break;
      default: return false;
    }

    if (!nodes) return false;

    // Connect all node outputs to gain
    if (Array.isArray(nodes)) {
      nodes.forEach((n) => n.connect(gain));
    } else {
      nodes.connect(gain);
    }
    gain.connect(this.ctx.destination);

    this.sources[id] = { nodes, gain, volume };
    return true;
  }

  /** Stop a specific sound */
  stop(id) {
    const src = this.sources[id];
    if (!src) return;
    try {
      const list = Array.isArray(src.nodes) ? src.nodes : [src.nodes];
      list.forEach((n) => {
        try {
          // Call custom cleanup hooks (lofi beat timer, cafe clatter)
          const cleanupKey = n._cleanupLofi ? '_cleanupLofi' :
                             n._cleanupRain ? '_cleanupRain' :
                             n._cleanupCafe ? '_cleanupCafe' : null;
          if (cleanupKey && n[cleanupKey] instanceof Function) {
            n[cleanupKey]();
          }
          if (n.stop && n.stop instanceof Function) n.stop();
          if (n.disconnect) n.disconnect();
        } catch (_) { /* already stopped */ }
      });
    } catch (_) { /* safe */ }
    delete this.sources[id];
  }

  /** Set volume for a sound (0-1) */
  setVolume(id, vol) {
    const src = this.sources[id];
    if (!src) return;
    src.volume = Math.max(0, Math.min(1, vol));
    if (!this.muted) {
      src.gain.gain.value = src.volume;
    }
  }

  /** Master mute/unmute */
  setMuted(muted) {
    this.muted = muted;
    Object.values(this.sources).forEach((src) => {
      src.gain.gain.value = muted ? 0 : src.volume;
    });
  }

  isMuted() {
    return this.muted;
  }

  /** Stop all sounds */
  stopAll() {
    Object.keys(this.sources).forEach((id) => this.stop(id));
  }

  /** Get currently active sound IDs */
  getActive() {
    return Object.keys(this.sources);
  }

  /** Dispose entirely */
  dispose() {
    this.stopAll();
    if (this.ctx) {
      this.ctx.close().catch(() => {});
      this.ctx = null;
    }
    this._initialized = false;
  }

  /* ── Sound builders ── */

  /** Lofi: looping beat pattern + warm pad texture */
  _buildLofi() {
    try {
      const ctx = this.ctx;
      const now = ctx.currentTime;
      const soundId = 'lofi';

      // ── Continuous warm pad ──
      const noiseLen = ctx.sampleRate * 3;
      const noiseBuf = ctx.createBuffer(1, noiseLen, ctx.sampleRate);
      const noiseData = noiseBuf.getChannelData(0);
      for (let i = 0; i < noiseLen; i++) {
        noiseData[i] = (Math.random() * 2 - 1) * 0.04;
      }
      const noiseSrc = ctx.createBufferSource();
      noiseSrc.buffer = noiseBuf;
      noiseSrc.loop = true;

      const padFilter = ctx.createBiquadFilter();
      padFilter.type = 'lowpass';
      padFilter.frequency.value = 300;
      padFilter.Q.value = 1;

      const padGain = ctx.createGain();
      padGain.gain.value = 0.15;

      noiseSrc.connect(padFilter);
      padFilter.connect(padGain);

      // Gentle detuned sine underpad
      const padOsc = ctx.createOscillator();
      padOsc.type = 'sine';
      padOsc.frequency.value = 110;
      const padOscGain = ctx.createGain();
      padOscGain.gain.value = 0.04;
      padOsc.connect(padOscGain);
      padOsc.start();

      // Slow modulation on the noise filter for movement
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.15;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 60;
      lfo.connect(lfoGain);
      lfoGain.connect(padFilter.frequency);
      lfo.start();

      // ── Looping beat scheduler ──
      const beatGain = ctx.createGain();
      beatGain.gain.value = 0.45;

      let beatTimerId = false;    // false = not started, null = stopped
      let scheduledNodes = [];

      function scheduleBeatPattern() {
        // If stopped, don't schedule more
        if (beatTimerId === null) return;

        const beatNow = ctx.currentTime;
        const bpm = 95;
        const beatInterval = 60 / bpm;
        const pattern = [1, 0, 0, 1, 0, 1, 1, 0]; // kick pattern

        for (let i = 0; i < pattern.length; i++) {
          if (!pattern[i]) continue;
          const t = beatNow + i * beatInterval;

          // Kick
          const k = ctx.createOscillator();
          k.type = 'sine';
          k.frequency.setValueAtTime(130, t);
          k.frequency.exponentialRampToValueAtTime(35, t + 0.08);
          const kg = ctx.createGain();
          kg.gain.setValueAtTime(0.35, t);
          kg.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
          k.connect(kg);
          kg.connect(beatGain);
          k.start(t);
          k.stop(t + 0.2);
          scheduledNodes.push({ osc: k, gain: kg });

          // Hi-hat on off-beats
          if (i % 2 === 1) {
            const hLen = 0.04;
            const hBufSize = Math.max(1, Math.floor(ctx.sampleRate * hLen));
            const hBuf = ctx.createBuffer(1, hBufSize, ctx.sampleRate);
            const hData = hBuf.getChannelData(0);
            for (let j = 0; j < hBufSize; j++) {
              hData[j] = (Math.random() * 2 - 1) * (1 - j / hBufSize) * 0.6;
            }
            const h = ctx.createBufferSource();
            h.buffer = hBuf;
            const hGain = ctx.createGain();
            hGain.gain.value = 0.08;
            h.connect(hGain);
            hGain.connect(beatGain);
            h.start(t);
            scheduledNodes.push({ src: h, gain: hGain });
          }
        }

        // Schedule next iteration (~2.5s later)
        const patternDuration = pattern.length * beatInterval;
        const advance = Math.max(0, patternDuration - 0.05);
        beatTimerId = setTimeout(scheduleBeatPattern, advance * 1000);
      }

      // Mark as running and start
      beatTimerId = true;   // truthy sentinel so guard passes
      scheduleBeatPattern(); // first call — schedules beats + sets real timer ID

      // Cleanup: store on padGain only (called once by stop())
      padGain._cleanupLofi = () => {
        if (beatTimerId && beatTimerId !== true) {
          clearTimeout(beatTimerId);
        }
        beatTimerId = null;
        scheduledNodes.forEach((n) => {
          try { if (n.osc) { n.osc.stop(); n.osc.disconnect(); } } catch (_) {}
          try { if (n.src) { n.src.stop(); n.src.disconnect(); } } catch (_) {}
          try { if (n.gain) n.gain.disconnect(); } catch (_) {}
        });
        scheduledNodes = [];
      };

      return [padGain, padOscGain, beatGain];
    } catch (_) {
      return this._buildWhite(); // fallback
    }
  }

  /** Rain: multi-layer procedural rain with body, rumble, and random droplets */
  _buildRain() {
    const ctx = this.ctx;
    const soundId = 'rain';

    /* ── Master bus ── */
    const masterGain = ctx.createGain();
    masterGain.gain.value = 0.5;

    /* ── Layer 1: Main rain body — broad high-frequency hiss ── */
    const bodyLen = ctx.sampleRate * 4;
    const bodyBuf = ctx.createBuffer(1, bodyLen, ctx.sampleRate);
    const bodyData = bodyBuf.getChannelData(0);
    for (let i = 0; i < bodyLen; i++) {
      bodyData[i] = (Math.random() * 2 - 1) * 0.7;
    }
    const bodySrc = ctx.createBufferSource();
    bodySrc.buffer = bodyBuf;
    bodySrc.loop = true;

    const bodyBp = ctx.createBiquadFilter();
    bodyBp.type = 'bandpass';
    bodyBp.frequency.value = 2200;
    bodyBp.Q.value = 1.2;

    const bodyHp = ctx.createBiquadFilter();
    bodyHp.type = 'highpass';
    bodyHp.frequency.value = 800;

    const bodyGain = ctx.createGain();
    bodyGain.gain.value = 0.28;

    bodySrc.connect(bodyBp);
    bodyBp.connect(bodyHp);
    bodyHp.connect(bodyGain);
    bodyGain.connect(masterGain);

    /* ── Layer 2: Low rumble — distant heavier rain / thunder ── */
    const rumbleLen = ctx.sampleRate * 4;
    const rumbleBuf = ctx.createBuffer(1, rumbleLen, ctx.sampleRate);
    const rumbleData = rumbleBuf.getChannelData(0);
    for (let i = 0; i < rumbleLen; i++) {
      rumbleData[i] = (Math.random() * 2 - 1) * 0.5;
    }
    const rumbleSrc = ctx.createBufferSource();
    rumbleSrc.buffer = rumbleBuf;
    rumbleSrc.loop = true;

    const rumbleLp = ctx.createBiquadFilter();
    rumbleLp.type = 'lowpass';
    rumbleLp.frequency.value = 400;

    const rumbleGain = ctx.createGain();
    rumbleGain.gain.value = 0.10;

    rumbleSrc.connect(rumbleLp);
    rumbleLp.connect(rumbleGain);
    rumbleGain.connect(masterGain);

    /* ── Layer 3: Random droplet impulses ── */
    const dropletGain = ctx.createGain();
    dropletGain.gain.value = 0;

    // Build a short droplet noise buffer (50ms with smooth envelope)
    const dLen = Math.floor(ctx.sampleRate * 0.05);
    const dBuf = ctx.createBuffer(1, dLen, ctx.sampleRate);
    const dData = dBuf.getChannelData(0);
    for (let i = 0; i < dLen; i++) {
      const t = i / dLen;
      // Sharp attack, gentle decay — like a drop hitting a surface
      const env = t < 0.05 ? t / 0.05 : Math.exp(-(t - 0.05) * 12);
      dData[i] = (Math.random() * 2 - 1) * env * 0.6;
    }
    const dSrc = ctx.createBufferSource();
    dSrc.buffer = dBuf;
    dSrc.loop = true;

    // Filter droplets to sound distinct from the rain body (lower, punchier)
    const dFilter = ctx.createBiquadFilter();
    dFilter.type = 'bandpass';
    dFilter.frequency.value = 1200;
    dFilter.Q.value = 1.0;

    dSrc.connect(dFilter);
    dFilter.connect(dropletGain);
    dropletGain.connect(masterGain);

    let dropletTimer = null;
    function scheduleDroplet() {
      if (!this.sources || !this.sources[soundId]) {
        dropletTimer = null;
        return;
      }
      const now = ctx.currentTime;
      // Burst of 2-4 drops close together, then pause
      const burstCount = 1 + Math.floor(Math.random() * 3);
      for (let i = 0; i < burstCount; i++) {
        const t = now + i * (0.03 + Math.random() * 0.04);
        const intensity = 0.12 + Math.random() * 0.28;
        dropletGain.gain.setValueAtTime(intensity, t);
        dropletGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
      }
      // Next burst in 120-500ms
      const delay = 120 + Math.random() * 380;
      dropletTimer = setTimeout(scheduleDroplet.bind(this), delay);
    }

    /* ── Organic amplitude modulation (avoids static feel) ── */
    const ampLfo = ctx.createOscillator();
    ampLfo.frequency.value = 0.25 + Math.random() * 0.15;
    const ampMod = ctx.createGain();
    ampMod.gain.value = 0.04;
    ampLfo.connect(ampMod);
    ampMod.connect(bodyGain.gain);
    ampLfo.start();

    // Separate slower modulation for the rumble
    const rumbleLfo = ctx.createOscillator();
    rumbleLfo.frequency.value = 0.08 + Math.random() * 0.05;
    const rumbleMod = ctx.createGain();
    rumbleMod.gain.value = 0.03;
    rumbleLfo.connect(rumbleMod);
    rumbleMod.connect(rumbleGain.gain);
    rumbleLfo.start();

    /* ── Start everything ── */
    bodySrc.start();
    rumbleSrc.start();
    dSrc.start();

    // Kick off the droplet scheduler (delayed so `this.sources[rain]` is set)
    dropletTimer = setTimeout(scheduleDroplet.bind(this), 300);

    /* ── Cleanup hook ── */
    masterGain._cleanupRain = () => {
      if (dropletTimer) {
        clearTimeout(dropletTimer);
        dropletTimer = null;
      }
    };

    return masterGain;
  }

  /** Café: low hum + occasional clatter */
  _buildCafe() {
    const ctx = this.ctx;
    const soundId = 'cafe';

    // Base hum: low-pass filtered noise
    const noiseLen = ctx.sampleRate * 3;
    const buf = ctx.createBuffer(1, noiseLen, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < noiseLen; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.3;
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;

    const lpf = ctx.createBiquadFilter();
    lpf.type = 'lowpass';
    lpf.frequency.value = 800;

    const gain = ctx.createGain();
    gain.gain.value = 0.2;

    src.connect(lpf);
    lpf.connect(gain);

    // Occasional clatter impulses
    const clatterGain = ctx.createGain();
    clatterGain.gain.value = 0;

    const cLen = ctx.sampleRate * 0.2;
    const cBuf = ctx.createBuffer(1, cLen, ctx.sampleRate);
    const cData = cBuf.getChannelData(0);
    for (let i = 0; i < cLen; i++) {
      cData[i] = (Math.random() * 2 - 1) * (1 - i / cLen);
    }
    const cSrc = ctx.createBufferSource();
    cSrc.buffer = cBuf;
    cSrc.loop = true;
    cSrc.connect(clatterGain);
    clatterGain.connect(lpf);

    src.start();
    cSrc.start();

    // Delay first clatter so `this.sources[cafe]` is set by then
    let clatterTimerId = setTimeout(function scheduleClatter() {
      // Check if cafe is still playing (sources[cafe] will be set by now)
      if (!this.sources || !this.sources[soundId]) return;

      const now = ctx.currentTime;
      clatterGain.gain.setValueAtTime(0.06, now);
      clatterGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      const delay = 2000 + Math.random() * 6000;
      clatterTimerId = setTimeout(scheduleClatter.bind(this), delay);
    }.bind(this), 500);

    // Clean up clatter timer when cafe stops
    gain._cleanupCafe = () => {
      if (clatterTimerId) {
        clearTimeout(clatterTimerId);
        clatterTimerId = null;
      }
    };

    return gain;
  }

  /** Fireplace: low crackling + occasional pops */
  _buildFire() {
    const ctx = this.ctx;
    const len = ctx.sampleRate * 3;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.5;
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;

    const lpf = ctx.createBiquadFilter();
    lpf.type = 'lowpass';
    lpf.frequency.value = 350;

    const gain = ctx.createGain();
    gain.gain.value = 0.35;

    src.connect(lpf);
    lpf.connect(gain);

    // Modulate amplitude for flicker effect
    const ampLfo = ctx.createOscillator();
    ampLfo.frequency.value = 0.8 + Math.random() * 0.3;
    const ampGain = ctx.createGain();
    ampGain.gain.value = 0.06;
    ampLfo.connect(ampGain);
    ampGain.connect(gain.gain);
    ampLfo.start();

    // Crackle: high-pass noise at low volume
    const cLen = ctx.sampleRate * 0.5;
    const cBuf = ctx.createBuffer(1, cLen, ctx.sampleRate);
    const cData = cBuf.getChannelData(0);
    for (let i = 0; i < cLen; i++) {
      cData[i] = (Math.random() * 2 - 1) * 0.15;
    }
    const cSrc = ctx.createBufferSource();
    cSrc.buffer = cBuf;
    cSrc.loop = true;

    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 2000;

    const cGain = ctx.createGain();
    cGain.gain.value = 0.08;

    cSrc.connect(hp);
    hp.connect(cGain);
    cGain.connect(gain);

    src.start();
    cSrc.start();

    return gain;
  }

  /** Ocean: noise with LFO sweeping filter */
  _buildOcean() {
    const ctx = this.ctx;
    const len = ctx.sampleRate * 4;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.6;
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;

    const bp = ctx.createBiquadFilter();
    bp.type = 'lowpass';
    bp.frequency.value = 500;

    const gain = ctx.createGain();
    gain.gain.value = 0.3;

    src.connect(bp);
    bp.connect(gain);

    // LFO sweeps filter for wave effect
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.12;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 350;
    lfo.connect(lfoGain);
    lfoGain.connect(bp.frequency);
    lfo.start();

    // Secondary modulation for "surf" feel
    const ampLfo = ctx.createOscillator();
    ampLfo.frequency.value = 0.08;
    const ampGain = ctx.createGain();
    ampGain.gain.value = 0.1;
    ampLfo.connect(ampGain);
    ampGain.connect(gain.gain);
    ampLfo.start();

    src.start();

    return gain;
  }

  /** White noise: flat noise buffer */
  _buildWhite() {
    const ctx = this.ctx;
    const len = ctx.sampleRate * 2;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.5;
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;

    const gain = ctx.createGain();
    gain.gain.value = 0.15;

    src.connect(gain);
    src.start();
    return gain;
  }
}

/* ─── POMODORO TIMER ─── */
class PomodoroTimer {
  constructor(onTick, onComplete) {
    this.focusMinutes = SR.DEFAULT_FOCUS;
    this.breakMinutes = SR.DEFAULT_BREAK;
    this.mode = 'focus';   // 'focus' | 'break'
    this.remaining = this.focusMinutes * 60;
    this.total = this.focusMinutes * 60;
    this.running = false;
    this.timerId = null;
    this._onTick = onTick || (() => {});
    this._onComplete = onComplete || (() => {});
    this._startTime = 0;
    this._elapsedBeforePause = 0;
  }

  setDurations(focus, brk) {
    const wasRunning = this.running;
    if (wasRunning) this.pause();
    this.focusMinutes = Math.max(1, Math.min(120, focus));
    this.breakMinutes = Math.max(1, Math.min(60, brk));
    if (this.mode === 'focus') {
      this.total = this.focusMinutes * 60;
      this.remaining = this.total;
    } else {
      this.total = this.breakMinutes * 60;
      this.remaining = this.total;
    }
    this._elapsedBeforePause = 0;
    this._onTick(this.remaining, this.total, this.mode);
    if (wasRunning) this.start();
  }

  switchMode(mode) {
    const wasRunning = this.running;
    if (wasRunning) this.pause();
    this.mode = mode === 'break' ? 'break' : 'focus';
    this.total = this.mode === 'focus'
      ? this.focusMinutes * 60
      : this.breakMinutes * 60;
    this.remaining = this.total;
    this._elapsedBeforePause = 0;
    this._onTick(this.remaining, this.total, this.mode);
  }

  start() {
    if (this.running) return;
    this.running = true;
    this._startTime = performance.now() - this._elapsedBeforePause;
    this._tick();
    this.timerId = setInterval(() => this._tick(), 200);
  }

  pause() {
    if (!this.running) return;
    this.running = false;
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    this._elapsedBeforePause = performance.now() - this._startTime;
  }

  reset() {
    const wasRunning = this.running;
    if (wasRunning) this.pause();
    this.remaining = this.total;
    this._elapsedBeforePause = 0;
    this._onTick(this.remaining, this.total, this.mode);
  }

  _tick() {
    const elapsed = performance.now() - this._startTime;
    this.remaining = Math.max(0, this.total - elapsed / 1000);
    this._onTick(this.remaining, this.total, this.mode);
    if (this.remaining <= 0) {
      this.pause();
      this.remaining = 0;
      this._onTick(0, this.total, this.mode);
      this._onComplete(this.mode);
    }
  }

  getState() {
    return {
      mode: this.mode,
      remaining: this.remaining,
      total: this.total,
      running: this.running,
    };
  }

  destroy() {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    this.running = false;
  }
}

/* ─── MAIN APP ─── */
document.addEventListener('DOMContentLoaded', () => {
  // Detect reduced motion early
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // DOM refs
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const soundsList = $('#srSoundsList');
  const muteBtn = $('#srMuteBtn');
  const stopAllBtn = $('#srStopAllBtn');
  const presetBtns = $$('.sr-preset-btn');
  const statusText = $('#srStatusText');

  // Timer DOM
  const clockDisplay = $('#srClockDisplay');
  const clockLabel = $('#srClockLabel');
  const ringFill = $('#srRingFill');
  const modeIndicator = $('#srModeIndicator');
  const modeLabel = $('#srModeLabel');
  const modeFocus = $('#srModeFocus');
  const modeBreak = $('#srModeBreak');
  const startBtn = $('#srStartBtn');
  const playIcon = $('#srPlayIcon');
  const playLabel = $('#srPlayLabel');
  const resetBtn = $('#srResetBtn');
  const timerPanel = $('.sr-timer-panel');

  // Settings DOM
  const focusDuration = $('#srFocusDuration');
  const breakDuration = $('#srBreakDuration');
  const applyBtn = $('#srApplyDurations');

  // Stats DOM
  const todayFocus = $('#srTodayFocus');
  const sessionCount = $('#srSessionCount');
  const sessionStreak = $('#srSessionStreak');
  const sessionFill = $('#srSessionFill');
  const sessionGoal = $('#srSessionGoal');

  const statusMeta = $('#srStatusMeta');

  // ─── State ───
  let engine = null;
  let timer = null;
  let prefs = {};
  let activeSounds = {};       // { id: true } — just active IDs
  let soundVolumes = {};       // { id: volume } — persistent per-sound volume
  let presetsApplied = '';     // last preset name
  let todayDate = '';
  let beepCtx = null;          // shared AudioContext for beeps

  // ─── Load persistence ───
  function loadPrefs() {
    try {
      const raw = localStorage.getItem(SR.STORAGE_KEY);
      if (raw) prefs = JSON.parse(raw);
      if (typeof prefs !== 'object' || prefs === null) prefs = {};
    } catch { prefs = {}; }
    // Defaults
    if (typeof prefs.activeSounds !== 'object') prefs.activeSounds = {};
    if (typeof prefs.volumes !== 'object') prefs.volumes = {};
    if (typeof prefs.focusDuration !== 'number') prefs.focusDuration = SR.DEFAULT_FOCUS;
    if (typeof prefs.breakDuration !== 'number') prefs.breakDuration = SR.DEFAULT_BREAK;
    if (typeof prefs.muted !== 'boolean') prefs.muted = false;

    // Restore active IDs (just the keys)
    activeSounds = {};
    Object.keys(prefs.activeSounds).forEach((id) => {
      activeSounds[id] = true;
    });

    // Restore volumes (persistent independently of active state)
    soundVolumes = {};
    if (typeof prefs.volumes === 'object') {
      Object.keys(prefs.volumes).forEach((id) => {
        if (typeof prefs.volumes[id] === 'number') {
          soundVolumes[id] = prefs.volumes[id];
        }
      });
    }
  }

  function savePrefs() {
    // Save which sounds are active (as object with true values)
    prefs.activeSounds = {};
    Object.keys(activeSounds).forEach((id) => {
      prefs.activeSounds[id] = true;
    });
    // Save all volumes (including inactive ones)
    prefs.volumes = { ...soundVolumes };
    try {
      localStorage.setItem(SR.STORAGE_KEY, JSON.stringify(prefs));
    } catch { /* silent */ }
  }

  // ─── Session persistence ───
  function loadSessions() {
    try {
      const raw = localStorage.getItem(SR.SESSION_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch { return []; }
  }

  function saveSessions(sessions) {
    try {
      localStorage.setItem(SR.SESSION_KEY, JSON.stringify(sessions));
    } catch { /* silent */ }
  }

  // ─── Sound channel rendering ───
  function renderSounds() {
    soundsList.innerHTML = '';
    SR.SOUND_DEFS.forEach((def) => {
      // Restore saved volume or default to 0.5
      if (typeof soundVolumes[def.id] !== 'number') {
        soundVolumes[def.id] = 0.5;
      }
      const vol = soundVolumes[def.id];
      const isActive = def.id in activeSounds;

      const channel = document.createElement('div');
      channel.className = `sr-sound-channel${isActive ? ' sr-active' : ''}`;
      channel.dataset.soundId = def.id;
      channel.setAttribute('tabindex', '0');
      channel.setAttribute('role', 'button');
      channel.setAttribute('aria-label', `${def.label} — ${isActive ? 'active' : 'inactive'}`);

      channel.innerHTML = `
        <div class="sr-sound-toggle" aria-hidden="true">
          ${isActive ? '<i class="fas fa-check"></i>' : ''}
        </div>
        <div class="sr-sound-icon sr-sound-icon--${def.id}">
          <i class="fas ${def.icon}"></i>
        </div>
        <div class="sr-sound-info">
          <span class="sr-sound-name">${def.label}</span>
          <span class="sr-sound-desc">${def.desc}</span>
        </div>
        <div class="sr-sound-volume">
          <input type="range" class="sr-volume-slider" min="0" max="1" step="0.05"
                 value="${vol}" aria-label="${def.label} volume" />
        </div>
      `;

      // Toggle on click
      channel.addEventListener('click', (e) => {
        if (e.target.closest('.sr-volume-slider')) return; // handled separately
        toggleSound(def.id);
      });

      // Volume slider
      const slider = channel.querySelector('.sr-volume-slider');
      slider.addEventListener('input', (e) => {
        const v = parseFloat(e.target.value);
        soundVolumes[def.id] = v;
        if (engine) engine.setVolume(def.id, v);
        presetsApplied = '';
        updatePresetButtons();
        savePrefs();
      });

      // Keyboard activation
      channel.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggleSound(def.id);
        }
      });

      soundsList.appendChild(channel);
    });

    // Sync slider positions with active state
    updateSoundChannels();
  }

  function updateSoundChannels() {
    $$('.sr-sound-channel').forEach((el) => {
      const id = el.dataset.soundId;
      const isActive = id in activeSounds;
      el.classList.toggle('sr-active', isActive);
      const toggle = el.querySelector('.sr-sound-toggle');
      toggle.innerHTML = isActive ? '<i class="fas fa-check"></i>' : '';
      const slider = el.querySelector('.sr-volume-slider');
      if (typeof soundVolumes[id] === 'number') {
        slider.value = soundVolumes[id];
      }
      el.setAttribute('aria-label', `${getSoundLabel(id)} — ${isActive ? 'active' : 'inactive'}`);
    });
  }

  function getSoundLabel(id) {
    const def = SR.SOUND_DEFS.find((d) => d.id === id);
    return def ? def.label : id;
  }

  // ─── Toggle a sound (defer AudioContext creation to first user gesture) ───
  function toggleSound(id) {
    // Lazy-init engine on first user gesture
    if (!engine) {
      engine = new SoundEngine();
    }
    const isActive = id in activeSounds;
    if (isActive) {
      engine.stop(id);
      delete activeSounds[id];
      setStatus(`${getSoundLabel(id)} stopped`);
    } else {
      const vol = typeof soundVolumes[id] === 'number' ? soundVolumes[id] : 0.5;
      engine.start(id, vol);
      activeSounds[id] = true;
      setStatus(`${getSoundLabel(id)} playing`);
    }
    presetsApplied = '';
    updateSoundChannels();
    updatePresetButtons();
    updateMuteButton();
    savePrefs();
  }

  // ─── Presets ───
  function applyPreset(name) {
    // Lazy-init engine on first user gesture
    if (!engine) {
      engine = new SoundEngine();
    }
    const preset = SR.PRESETS[name];
    if (!preset) return;

    // Stop all currently active sounds first
    Object.keys(activeSounds).forEach((id) => {
      engine.stop(id);
    });
    activeSounds = {};

    // Start preset sounds and persist volumes
    Object.entries(preset.sounds).forEach(([id, vol]) => {
      engine.start(id, vol);
      activeSounds[id] = true;
      soundVolumes[id] = vol;
    });

    presetsApplied = name;
    updateSoundChannels();
    updatePresetButtons();
    updateMuteButton();
    setStatus(`Preset: ${preset.label}`);
    savePrefs();
  }

  function updatePresetButtons() {
    presetBtns.forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.preset === presetsApplied);
    });
  }

  // ─── Mute ───
  function toggleMute() {
    // Lazy-init engine on first user gesture
    if (!engine) {
      engine = new SoundEngine();
    }
    const muted = !engine.isMuted();
    engine.setMuted(muted);
    prefs.muted = muted;
    updateMuteButton();
    setStatus(muted ? 'All sounds muted' : 'Sounds unmuted');
    savePrefs();
  }

  function updateMuteButton() {
    if (!engine) return;
    const muted = engine.isMuted();
    muteBtn.classList.toggle('sr-muted', muted);
    muteBtn.innerHTML = muted
      ? '<i class="fas fa-volume-xmark"></i>'
      : '<i class="fas fa-volume-high"></i>';
    muteBtn.setAttribute('aria-label', muted ? 'Unmute all sounds (M)' : 'Mute all sounds (M)');
  }

  // ─── Stop all ───
  function stopAllSounds() {
    if (!engine) return;
    engine.stopAll();
    activeSounds = {};
    presetsApplied = '';
    updateSoundChannels();
    updatePresetButtons();
    updateMuteButton();
    setStatus('All sounds stopped');
    savePrefs();
  }

  // ─── Timer rendering ───
  function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  function formatMinutes(totalSec) {
    const mins = Math.floor(totalSec / 60);
    if (mins < 60) return `${mins}m`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m ? `${h}h ${m}m` : `${h}h`;
  }

  const CIRCUMFERENCE = 339.292; // 2 * PI * 54

  function updateTimerDisplay(remaining, total, mode) {
    const pct = total > 0 ? remaining / total : 0;
    clockDisplay.textContent = formatTime(remaining);
    const offset = CIRCUMFERENCE * (1 - pct);
    ringFill.setAttribute('stroke-dashoffset', offset);
    clockLabel.textContent = mode === 'focus' ? 'focus time' : 'break time';
  }

  function updateTimerModeUI(mode) {
    const isBreak = mode === 'break';
    timerPanel.classList.toggle('is-break', isBreak);
    modeFocus.classList.toggle('active', !isBreak);
    modeBreak.classList.toggle('active', isBreak);
    modeIndicator.className = `sr-mode-indicator ${isBreak ? 'sr-mode-break' : 'sr-mode-focus'}`;
    modeLabel.textContent = isBreak ? 'Break' : 'Focus';
  }

  function updatePlayButton(running) {
    if (running) {
      playIcon.className = 'fas fa-pause';
      playLabel.textContent = 'Pause';
      startBtn.classList.add('sr-running');
      startBtn.setAttribute('aria-label', 'Pause timer');
    } else {
      playIcon.className = 'fas fa-play';
      playLabel.textContent = 'Start';
      startBtn.classList.remove('sr-running');
      startBtn.setAttribute('aria-label', 'Start timer');
    }
  }

  // ─── Timer complete callback ───
  function onTimerComplete(mode) {
    // Flash effect
    timerPanel.classList.remove('sr-flash');
    // Force reflow
    void timerPanel.offsetWidth;
    timerPanel.classList.add('sr-flash');
    setTimeout(() => timerPanel.classList.remove('sr-flash'), 700);

    // Beep
    playBeep();

    if (mode === 'focus') {
      // Record session
      const sessions = loadSessions();
      const now = new Date();
      sessions.unshift({
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
        completedAt: now.toISOString(),
        duration: timer.focusMinutes,
      });
      // Keep last 500 sessions
      const trimmed = sessions.slice(0, 500);
      saveSessions(trimmed);
      updateSessionStats();

      setStatus(`Focus session complete! (${formatMinutes(timer.focusMinutes * 60)})`);
      // Auto-switch to break
      setTimeout(() => {
        timer.switchMode('break');
        updateTimerModeUI('break');
        updateTimerDisplay(timer.remaining, timer.total, timer.mode);
      }, 600);
    } else {
      setStatus('Break over! Ready for the next focus session.');
      // Switch back to focus but don't auto-start
      setTimeout(() => {
        timer.switchMode('focus');
        updateTimerModeUI('focus');
        updateTimerDisplay(timer.remaining, timer.total, timer.mode);
      }, 600);
    }
  }

  // ─── Beep (reuse engine's AudioContext if available) ───
  function playBeep() {
    try {
      // Try to reuse the main engine's AudioContext
      let ctx;
      if (engine && engine.ctx && engine.ctx.state !== 'closed') {
        ctx = engine.ctx;
      } else if (!beepCtx || beepCtx.state === 'closed') {
        const Ctor = window.AudioContext || window.webkitAudioContext;
        beepCtx = new Ctor();
        ctx = beepCtx;
      } else {
        ctx = beepCtx;
      }

      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(660, ctx.currentTime);
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } catch { /* silent */ }
  }

  // ─── Session stats ───
  function updateSessionStats() {
    const sessions = loadSessions();
    const today = new Date();
    const todayKey = today.toISOString().slice(0, 10);
    todayDate = todayKey;

    const todaySessions = sessions.filter((s) => s.completedAt.slice(0, 10) === todayKey);
    const focusSessions = sessions.filter((s) => {
      // Should have duration field
      return s.duration && s.duration > 0;
    });

    // Total focus time today (in minutes)
    const totalTodayMins = todaySessions.reduce((sum, s) => sum + (s.duration || 0), 0);
    todayFocus.textContent = formatMinutes(totalTodayMins * 60);

    // Session count today
    const count = todaySessions.length;
    sessionCount.textContent = count;

    // Streak
    const days = new Set();
    focusSessions.forEach((s) => days.add(s.completedAt.slice(0, 10)));
    const streak = computeStreak(days);
    sessionStreak.textContent = streak;

    // Goal bar
    const goal = SR.DAILY_GOAL;
    const pct = Math.min(100, (count / goal) * 100);
    sessionFill.style.width = `${pct}%`;
    sessionGoal.textContent = `${count} / ${goal} sessions today`;

    statusMeta.textContent = `${streak}-day streak`;
  }

  function computeStreak(daysSet) {
    if (!daysSet.size) return 0;
    let streak = 0;
    const cursor = new Date();
    // Allow today or yesterday as start
    for (let i = 0; i < 365; i++) {
      const key = cursor.toISOString().slice(0, 10);
      if (daysSet.has(key)) {
        streak++;
        cursor.setDate(cursor.getDate() - 1);
      } else if (i === 0) {
        // First day might be yesterday if today has no sessions
        cursor.setDate(cursor.getDate() - 1);
        const yKey = cursor.toISOString().slice(0, 10);
        if (daysSet.has(yKey)) {
          streak = 1;
          cursor.setDate(cursor.getDate() - 1);
          continue;
        }
        break;
      } else {
        break;
      }
    }
    return streak;
  }

  // ─── Status bar ───
  function setStatus(msg) {
    if (statusText) {
      statusText.innerHTML = `<i class="fas fa-info-circle"></i> ${escapeHtml(msg)}`;
    }
  }

  function escapeHtml(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  // ─── Restore prefs on load ───
  function restorePrefs() {
    // Timer durations
    focusDuration.value = prefs.focusDuration || SR.DEFAULT_FOCUS;
    breakDuration.value = prefs.breakDuration || SR.DEFAULT_BREAK;

    // Init timer with saved durations
    timer = new PomodoroTimer(
      (remaining, total, mode) => {
        updateTimerDisplay(remaining, total, mode);
      },
      (mode) => onTimerComplete(mode)
    );
    timer.focusMinutes = prefs.focusDuration || SR.DEFAULT_FOCUS;
    timer.breakMinutes = prefs.breakDuration || SR.DEFAULT_BREAK;
    timer.total = timer.focusMinutes * 60;
    timer.remaining = timer.total;
    updateTimerDisplay(timer.remaining, timer.total, timer.mode);
    updateTimerModeUI('focus');

    /*
     * Sounds are NOT started here — engine is lazily created on first
     * user gesture (clicking a sound or preset). The activeSounds map
     * remembers which sounds were playing, so we can restore them once
     * the user first interacts with the page.
     */
    updateMuteButton();
    updatePresetButtons();
    updateSessionStats();
  }

  /** Called on first user gesture to init engine and restore playing sounds */
  function ensureEngineAndRestoreSounds() {
    if (engine) return; // already initialized
    engine = new SoundEngine();

    // Start saved active sounds
    Object.keys(activeSounds).forEach((id) => {
      const vol = typeof soundVolumes[id] === 'number' ? soundVolumes[id] : 0.5;
      engine.start(id, vol);
    });

    if (prefs.muted) {
      engine.setMuted(true);
    }
    updateMuteButton();
  }

  // ─── Init ───
  function init() {
    loadPrefs();

    // DO NOT create SoundEngine here — defer to first user gesture
    // so we don't hit autoplay policy before user interaction.
    engine = null;

    // Render UI
    renderSounds();

    // Init and restore (sounds will be started on first user click)
    restorePrefs();

    // ─── Event listeners ───

    // First-user-gesture handler for deferred AudioContext creation
    function onFirstGesture() {
      if (!engine) {
        ensureEngineAndRestoreSounds();
      }
      // Remove listeners after first invocation
      document.removeEventListener('click', onFirstGesture);
      document.removeEventListener('keydown', onGestureKeydown);
    }
    function onGestureKeydown(e) {
      // Only activate on keys that aren't typing
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'm' || e.key === 'M') {
        onFirstGesture();
      }
    }
    document.addEventListener('click', onFirstGesture);
    document.addEventListener('keydown', onGestureKeydown);

    // Mute
    muteBtn.addEventListener('click', toggleMute);

    // Stop all
    stopAllBtn.addEventListener('click', stopAllSounds);

    // Presets
    presetBtns.forEach((btn) => {
      btn.addEventListener('click', () => applyPreset(btn.dataset.preset));
    });

    // Timer mode tabs
    modeFocus.addEventListener('click', () => {
      if (timer.mode === 'focus') return;
      timer.switchMode('focus');
      updateTimerModeUI('focus');
      updateTimerDisplay(timer.remaining, timer.total, timer.mode);
      setStatus('Switched to focus mode');
    });

    modeBreak.addEventListener('click', () => {
      if (timer.mode === 'break') return;
      timer.switchMode('break');
      updateTimerModeUI('break');
      updateTimerDisplay(timer.remaining, timer.total, timer.mode);
      setStatus('Switched to break mode');
    });

    // Start/Pause
    startBtn.addEventListener('click', () => {
      if (timer.running) {
        timer.pause();
        updatePlayButton(false);
        setStatus('Timer paused');
      } else {
        timer.start();
        updatePlayButton(true);
        const mins = Math.ceil(timer.remaining / 60);
        setStatus(`${timer.mode === 'focus' ? 'Focusing' : 'Break'} — ${mins} min remaining`);
      }
    });

    // Reset
    resetBtn.addEventListener('click', () => {
      timer.reset();
      updatePlayButton(false);
      updateTimerDisplay(timer.remaining, timer.total, timer.mode);
      setStatus('Timer reset');
    });

    // Apply durations
    applyBtn.addEventListener('click', () => {
      const focus = parseInt(focusDuration.value) || SR.DEFAULT_FOCUS;
      const brk = parseInt(breakDuration.value) || SR.DEFAULT_BREAK;
      timer.setDurations(focus, brk);
      prefs.focusDuration = focus;
      prefs.breakDuration = brk;
      savePrefs();
      updatePlayButton(false);
      updateTimerModeUI(timer.mode);
      setStatus(`Durations updated: ${focus}min focus / ${brk}min break`);
      // Close the details panel
      const details = $('#srSettingsDetails');
      if (details) details.open = false;
    });

    // Stepper buttons
    $$('.sr-stepper-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const target = btn.dataset.target;
        const dir = btn.dataset.dir;
        const input = target === 'focus' ? focusDuration : breakDuration;
        const step = 1;
        let val = parseInt(input.value) || 0;
        if (dir === 'up') val += step;
        else val -= step;
        val = Math.max(parseInt(input.min), Math.min(parseInt(input.max), val));
        input.value = val;
      });
    });

    // Update session stats on day change
    setInterval(() => {
      const newDay = new Date().toISOString().slice(0, 10);
      if (newDay !== todayDate) {
        updateSessionStats();
      }
    }, 60000); // check every minute

    // Keyboard shortcut
    document.addEventListener('keydown', (e) => {
      // Don't trigger if user is typing in an input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
      if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        toggleMute();
      }
      // Space to toggle timer (unless focused on a button/input)
      if (e.key === ' ' && e.target === document.body) {
        e.preventDefault();
        startBtn.click();
      }
    });

    // Handle visibility change — pause timer if hidden for long
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && timer && timer.running) {
        // No auto-pause; let user decide. The timer will catch up based on actual elapsed.
        // The _tick method handles this correctly via performance.now() tracking.
      }
    });

    setStatus('Ready — choose your sounds and start the timer');
  }

  // ─── Start ───
  init();
});
