// D 小调五声音阶：D, F, G, A, C
const MELODY_HZ = [
  146.83, 174.61, 196.00, 220.00, 261.63,
  293.66, 349.23, 392.00, 440.00, 523.25,
  587.33,
];

export type SFXType = 'click' | 'discover' | 'dialogue' | 'pickup' | 'chapter' | 'hint' | 'room_change';

interface AudioSettings {
  bgmVolume: number;
  sfxVolume: number;
  muted: boolean;
}

const STORAGE_KEY = 'tianji-audio';

class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private bgmGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private reverbNode: ConvolverNode | null = null;
  private reverbSendGain: GainNode | null = null;

  private droneOscs: OscillatorNode[] = [];
  private windSrc: AudioBufferSourceNode | null = null;
  private windLfo: OscillatorNode | null = null;
  private melodyTimer: ReturnType<typeof setTimeout> | null = null;
  private bgmActive = false;

  private s: AudioSettings = { bgmVolume: 0.55, sfxVolume: 0.72, muted: false };

  constructor() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) Object.assign(this.s, JSON.parse(saved));
    } catch {}
  }

  private save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(this.s)); } catch {}
  }

  private boot(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.s.muted ? 0 : 1;
      this.masterGain.connect(this.ctx.destination);

      this.bgmGain = this.ctx.createGain();
      this.bgmGain.gain.value = this.s.bgmVolume;
      this.bgmGain.connect(this.masterGain);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = this.s.sfxVolume;
      this.sfxGain.connect(this.masterGain);

      // 生成混响脉冲（3 秒衰减）
      const sr = this.ctx.sampleRate;
      const len = Math.floor(sr * 3.0);
      const ir = this.ctx.createBuffer(2, len, sr);
      for (let ch = 0; ch < 2; ch++) {
        const d = ir.getChannelData(ch);
        for (let i = 0; i < len; i++) {
          d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.0);
        }
      }
      this.reverbNode = this.ctx.createConvolver();
      this.reverbNode.buffer = ir;
      this.reverbSendGain = this.ctx.createGain();
      this.reverbSendGain.gain.value = 0.3;
      this.reverbNode.connect(this.reverbSendGain);
      this.reverbSendGain.connect(this.bgmGain);
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
    return this.ctx;
  }

  // ── BGM ─────────────────────────────────────────────

  startBGM() {
    const ctx = this.boot();
    if (this.bgmActive) return;
    this.bgmActive = true;
    this.buildDrones(ctx);
    this.buildWind(ctx);
    this.melodyTimer = setTimeout(() => { if (this.bgmActive) this.stepMelody(); }, 1800);
  }

  stopBGM() {
    this.bgmActive = false;
    if (this.melodyTimer) { clearTimeout(this.melodyTimer); this.melodyTimer = null; }
    const t = this.ctx?.currentTime ?? 0;
    this.droneOscs.forEach(o => { try { o.stop(t + 1.2); } catch {} });
    this.droneOscs = [];
    if (this.windSrc) { try { this.windSrc.stop(t + 1.2); } catch {} this.windSrc = null; }
    if (this.windLfo) { try { this.windLfo.stop(t + 1.2); } catch {} this.windLfo = null; }
  }

  private buildDrones(ctx: AudioContext) {
    const bg  = this.bgmGain!;
    const now = ctx.currentTime;

    const drone = (freq: number, detune: number, gain: number, ramp = 5) => {
      const osc = ctx.createOscillator();
      const lp  = ctx.createBiquadFilter();
      const env = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      osc.detune.value = detune;
      lp.type = 'lowpass'; lp.frequency.value = 280;
      env.gain.setValueAtTime(0, now);
      env.gain.linearRampToValueAtTime(gain, now + ramp);
      osc.connect(lp); lp.connect(env); env.connect(bg);
      osc.start(now);
      this.droneOscs.push(osc);
    };

    drone(36.71,   0,  0.07);   // D1 sub
    drone(73.41,   0,  0.09);   // D2
    drone(73.41,   6,  0.04);   // D2 chorus
    drone(110.00,  0,  0.05);   // A2 fifth
    drone(146.83,  0,  0.035);  // D3
    drone(146.83, -5,  0.018);  // D3 chorus
  }

  private buildWind(ctx: AudioContext) {
    const bg = this.bgmGain!;
    const sr = ctx.sampleRate;
    const len = sr * 8;
    const buf = ctx.createBuffer(1, len, sr);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;

    const src = ctx.createBufferSource();
    src.buffer = buf; src.loop = true;

    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass'; bp.frequency.value = 460; bp.Q.value = 2.8;

    const lfo = ctx.createOscillator();
    const lg  = ctx.createGain();
    lfo.frequency.value = 0.065; lg.gain.value = 110;
    lfo.connect(lg); lg.connect(bp.frequency);

    const wg = ctx.createGain();
    wg.gain.setValueAtTime(0, ctx.currentTime);
    wg.gain.linearRampToValueAtTime(0.036, ctx.currentTime + 7);

    src.connect(bp); bp.connect(wg); wg.connect(bg);
    src.start(); lfo.start();
    this.windSrc = src; this.windLfo = lfo;
  }

  private stepMelody() {
    if (!this.bgmActive || !this.ctx) return;
    this.playMelodyNote(this.ctx);
    const delay = 3000 + Math.random() * 5000;
    this.melodyTimer = setTimeout(() => { if (this.bgmActive) this.stepMelody(); }, delay);
  }

  private playMelodyNote(ctx: AudioContext) {
    const bg  = this.bgmGain!;
    const rv  = this.reverbNode!;
    const now = ctx.currentTime;

    // 偏向中间音区
    const pool = MELODY_HZ.slice(2, 9);
    const freq = pool[Math.floor(Math.random() * pool.length)];

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const g2   = ctx.createGain();
    const lp   = ctx.createBiquadFilter();
    const env  = ctx.createGain();
    const rvs  = ctx.createGain();

    osc1.type = 'triangle'; osc1.frequency.value = freq;
    osc2.type = 'sine';     osc2.frequency.value = freq * 2;
    g2.gain.value = 0.11;

    lp.type = 'lowpass'; lp.frequency.value = 1500; lp.Q.value = 1.2;

    env.gain.setValueAtTime(0, now);
    env.gain.linearRampToValueAtTime(0.44, now + 0.007);
    env.gain.exponentialRampToValueAtTime(0.09, now + 0.45);
    env.gain.exponentialRampToValueAtTime(0.001, now + 2.5);

    rvs.gain.value = 0.48;

    osc1.connect(lp); osc2.connect(g2); g2.connect(lp);
    lp.connect(env);
    env.connect(bg);
    env.connect(rvs); rvs.connect(rv);

    osc1.start(now); osc2.start(now);
    osc1.stop(now + 3.0); osc2.stop(now + 3.0);
  }

  // ── SFX ─────────────────────────────────────────────

  playSFX(type: SFXType) {
    if (this.s.muted) return;
    const ctx  = this.boot();
    const dest = this.sfxGain!;
    const now  = ctx.currentTime;
    switch (type) {
      case 'click':       this.sfxClick(ctx, dest, now);      break;
      case 'discover':    this.sfxDiscover(ctx, dest, now);   break;
      case 'dialogue':    this.sfxDialogue(ctx, dest, now);   break;
      case 'pickup':      this.sfxPickup(ctx, dest, now);     break;
      case 'chapter':     this.sfxChapter(ctx, dest, now);    break;
      case 'hint':        this.sfxHint(ctx, dest, now);       break;
      case 'room_change': this.sfxRoomChange(ctx, dest, now); break;
    }
  }

  // 轻微金属碰击声 —— 点击按钮
  private sfxClick(ctx: AudioContext, dest: AudioNode, now: number) {
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(840, now);
    osc.frequency.exponentialRampToValueAtTime(580, now + 0.065);
    env.gain.setValueAtTime(0.26, now);
    env.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
    osc.connect(env); env.connect(dest);
    osc.start(now); osc.stop(now + 0.1);
  }

  // 三音上行 —— 发现线索
  private sfxDiscover(ctx: AudioContext, dest: AudioNode, now: number) {
    [196.00, 220.00, 293.66].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const env = ctx.createGain();
      const t   = now + i * 0.15;
      osc.type = 'triangle'; osc.frequency.value = freq;
      env.gain.setValueAtTime(0, t);
      env.gain.linearRampToValueAtTime(0.36, t + 0.01);
      env.gain.exponentialRampToValueAtTime(0.001, t + 0.55);
      osc.connect(env); env.connect(dest);
      osc.start(t); osc.stop(t + 0.6);
    });
  }

  // 单音木击声 —— NPC 开口
  private sfxDialogue(ctx: AudioContext, dest: AudioNode, now: number) {
    const osc = ctx.createOscillator();
    const bp  = ctx.createBiquadFilter();
    const env = ctx.createGain();
    osc.type = 'sine'; osc.frequency.value = 220;
    bp.type = 'bandpass'; bp.frequency.value = 360; bp.Q.value = 2.5;
    env.gain.setValueAtTime(0, now);
    env.gain.linearRampToValueAtTime(0.20, now + 0.016);
    env.gain.exponentialRampToValueAtTime(0.001, now + 0.30);
    osc.connect(bp); bp.connect(env); env.connect(dest);
    osc.start(now); osc.stop(now + 0.35);
  }

  // 双音上行 —— 拾取物品
  private sfxPickup(ctx: AudioContext, dest: AudioNode, now: number) {
    [293.66, 440.00].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const env = ctx.createGain();
      const t   = now + i * 0.12;
      osc.type = 'triangle'; osc.frequency.value = freq;
      env.gain.setValueAtTime(0, t);
      env.gain.linearRampToValueAtTime(0.30, t + 0.006);
      env.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
      osc.connect(env); env.connect(dest);
      osc.start(t); osc.stop(t + 0.45);
    });
  }

  // 铜锣声 —— 章节转换
  private sfxChapter(ctx: AudioContext, dest: AudioNode, now: number) {
    const specs = [
      { freq: 36.71,  g: 0.55, decay: 5.5 },
      { freq: 73.41,  g: 0.35, decay: 5.0 },
      { freq: 110.00, g: 0.20, decay: 4.0 },
      { freq: 146.83, g: 0.10, decay: 3.0 },
      { freq: 220.00, g: 0.06, decay: 2.5 },
    ];
    specs.forEach(({ freq, g, decay }) => {
      const osc = ctx.createOscillator();
      const env = ctx.createGain();
      osc.type = 'sine'; osc.frequency.value = freq;
      env.gain.setValueAtTime(0, now);
      env.gain.linearRampToValueAtTime(g, now + 0.012);
      env.gain.exponentialRampToValueAtTime(g * 0.3, now + 0.55);
      env.gain.exponentialRampToValueAtTime(0.001, now + decay);
      osc.connect(env); env.connect(dest);
      osc.start(now); osc.stop(now + decay + 0.1);
    });
    // 金属打击瞬态
    const m = ctx.createOscillator();
    const mf = ctx.createBiquadFilter();
    const me = ctx.createGain();
    m.type = 'sawtooth'; m.frequency.value = 360;
    mf.type = 'highpass'; mf.frequency.value = 650;
    me.gain.setValueAtTime(0.14, now);
    me.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    m.connect(mf); mf.connect(me); me.connect(dest);
    m.start(now); m.stop(now + 0.18);
  }

  // 轻柔下行 —— 心理活动提示
  private sfxHint(ctx: AudioContext, dest: AudioNode, now: number) {
    const osc = ctx.createOscillator();
    const lp  = ctx.createBiquadFilter();
    const env = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(349.23, now + 0.75);
    lp.type = 'lowpass'; lp.frequency.value = 650;
    env.gain.setValueAtTime(0, now);
    env.gain.linearRampToValueAtTime(0.11, now + 0.1);
    env.gain.linearRampToValueAtTime(0.11, now + 0.5);
    env.gain.linearRampToValueAtTime(0, now + 0.9);
    osc.connect(lp); lp.connect(env); env.connect(dest);
    osc.start(now); osc.stop(now + 1.0);
  }

  // 噪声轻拂 —— 切换房间
  private sfxRoomChange(ctx: AudioContext, dest: AudioNode, now: number) {
    const sr  = ctx.sampleRate;
    const len = Math.floor(sr * 0.2);
    const buf = ctx.createBuffer(1, len, sr);
    const d   = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 1.6);
    const src = ctx.createBufferSource();
    const bp  = ctx.createBiquadFilter();
    const env = ctx.createGain();
    src.buffer = buf;
    bp.type = 'bandpass'; bp.frequency.value = 300; bp.Q.value = 1.0;
    env.gain.value = 0.16;
    src.connect(bp); bp.connect(env); env.connect(dest);
    src.start(now);
  }

  // ── 音量控制 ─────────────────────────────────────────

  get bgmVolume()  { return this.s.bgmVolume; }
  get sfxVolume()  { return this.s.sfxVolume; }
  get muted()      { return this.s.muted; }
  get isRunning()  { return this.bgmActive; }

  setBGMVolume(v: number) {
    this.s.bgmVolume = v; this.save();
    if (this.bgmGain)
      this.bgmGain.gain.linearRampToValueAtTime(v, (this.ctx?.currentTime ?? 0) + 0.05);
  }

  setSFXVolume(v: number) {
    this.s.sfxVolume = v; this.save();
    if (this.sfxGain)
      this.sfxGain.gain.linearRampToValueAtTime(v, (this.ctx?.currentTime ?? 0) + 0.05);
  }

  setMuted(m: boolean) {
    this.s.muted = m; this.save();
    if (this.masterGain)
      this.masterGain.gain.linearRampToValueAtTime(m ? 0 : 1, (this.ctx?.currentTime ?? 0) + 0.05);
  }
}

export const audioEngine = new AudioEngine();
