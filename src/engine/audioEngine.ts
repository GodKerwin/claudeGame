/**
 * 古风音频引擎 —— A 羽调式五声音阶（A, C, D, E, G）
 * BGM 四层：低频持续音 + 风声 + 古琴拨弦旋律 + 二胡悠扬长音
 * SFX 七种：点击 / 发现线索 / NPC对话 / 拾取 / 章节锣 / 心理活动 / 换房间
 */

// A 羽调式五声音阶（A minor pentatonic）: A, C, D, E, G
const PENTA: number[] = [
  55.00, 65.41, 73.42, 82.41, 98.00,     // A1 C2 D2 E2 G2
  110.00, 130.81, 146.83, 164.81, 196.00, // A2 C3 D3 E3 G3
  220.00, 261.63, 293.66, 329.63, 392.00, // A3 C4 D4 E4 G4
  440.00, 523.25, 587.33, 659.25, 784.00, // A4 C5 D5 E5 G5
];

// 二胡常用音区
const ERHU: number[] = [220.00, 261.63, 293.66, 329.63, 392.00, 440.00];

export type SFXType = 'click' | 'discover' | 'dialogue' | 'pickup' | 'chapter' | 'hint' | 'room_change';

interface AudioSettings { bgmVolume: number; sfxVolume: number; muted: boolean; }

const KEY = 'tianji-audio';

class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private bgmGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private convolver: ConvolverNode | null = null;
  private reverbReturn: GainNode | null = null;

  private droneOscs: OscillatorNode[] = [];
  private windSrc: AudioBufferSourceNode | null = null;
  private windLfo: OscillatorNode | null = null;
  private guqinTimer: ReturnType<typeof setTimeout> | null = null;
  private erhuTimer: ReturnType<typeof setTimeout> | null = null;
  private drumTimer: ReturnType<typeof setTimeout> | null = null;
  private bgmOn = false;

  private s: AudioSettings = { bgmVolume: 0.52, sfxVolume: 0.70, muted: false };

  constructor() {
    try { const d = localStorage.getItem(KEY); if (d) Object.assign(this.s, JSON.parse(d)); } catch {}
  }
  private save() { try { localStorage.setItem(KEY, JSON.stringify(this.s)); } catch {} }

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

      // 卷积混响（程序生成 3 s 脉冲响应）
      const sr = this.ctx.sampleRate;
      const len = Math.floor(sr * 3.2);
      const ir = this.ctx.createBuffer(2, len, sr);
      for (let ch = 0; ch < 2; ch++) {
        const d = ir.getChannelData(ch);
        for (let i = 0; i < len; i++) {
          // 前 50ms 预延迟后衰减
          const att = i < sr * 0.05 ? i / (sr * 0.05) : 1;
          d[i] = (Math.random() * 2 - 1) * att * Math.pow(1 - i / len, 1.8);
        }
      }
      this.convolver = this.ctx.createConvolver();
      this.convolver.buffer = ir;
      this.reverbReturn = this.ctx.createGain();
      this.reverbReturn.gain.value = 0.32;
      this.convolver.connect(this.reverbReturn);
      this.reverbReturn.connect(this.bgmGain);
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
    return this.ctx;
  }

  // ──────── BGM ────────────────────────────────────────────────────

  startBGM() {
    const ctx = this.boot();
    if (this.bgmOn) return;
    this.bgmOn = true;
    this.layerDrone(ctx);
    this.layerWind(ctx);
    this.guqinTimer = setTimeout(() => { if (this.bgmOn) this.tickGuqin(); }, 2000);
    this.erhuTimer  = setTimeout(() => { if (this.bgmOn) this.tickErhu(); },  5000);
    this.drumTimer  = setTimeout(() => { if (this.bgmOn) this.tickDrum(); },  1000);
  }

  stopBGM() {
    this.bgmOn = false;
    [this.guqinTimer, this.erhuTimer, this.drumTimer].forEach(t => { if (t) clearTimeout(t); });
    this.guqinTimer = this.erhuTimer = this.drumTimer = null;
    const t = this.ctx?.currentTime ?? 0;
    this.droneOscs.forEach(o => { try { o.stop(t + 1.5); } catch {} });
    this.droneOscs = [];
    if (this.windSrc) { try { this.windSrc.stop(t + 1.5); } catch {} this.windSrc = null; }
    if (this.windLfo) { try { this.windLfo.stop(t + 1.5); } catch {} this.windLfo = null; }
  }

  /** 低频持续音：A2 + E3 + A3（根音+五度+八度） */
  private layerDrone(ctx: AudioContext) {
    const bg = this.bgmGain!;
    const now = ctx.currentTime;
    const add = (freq: number, det: number, g: number, ramp = 6) => {
      const osc = ctx.createOscillator();
      const lp  = ctx.createBiquadFilter();
      const env = ctx.createGain();
      osc.type = 'sine'; osc.frequency.value = freq; osc.detune.value = det;
      lp.type = 'lowpass'; lp.frequency.value = 260; lp.Q.value = 1.2;
      env.gain.setValueAtTime(0, now);
      env.gain.linearRampToValueAtTime(g, now + ramp);
      osc.connect(lp); lp.connect(env); env.connect(bg);
      osc.start(now); this.droneOscs.push(osc);
    };
    add(55.00,  0,  0.10);  // A1 sub
    add(110.00, 0,  0.09);  // A2
    add(110.00, 7,  0.04);  // A2 chorus
    add(164.81, 0,  0.06);  // E3 五度
    add(220.00, 0,  0.04);  // A3 八度
    add(220.00,-5,  0.02);  // A3 chorus
  }

  /** 风声层：带通滤波噪声 + LFO调制 */
  private layerWind(ctx: AudioContext) {
    const bg  = this.bgmGain!;
    const sr  = ctx.sampleRate;
    const len = sr * 10;
    const buf = ctx.createBuffer(1, len, sr);
    const d   = buf.getChannelData(0);
    // Pink-ish noise（每帧平均，更柔和）
    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + w * 0.0555179;
      b1 = 0.99332 * b1 + w * 0.0750759;
      b2 = 0.96900 * b2 + w * 0.1538520;
      d[i] = (b0 + b1 + b2 + w * 0.0556) * 0.11;
    }

    const src = ctx.createBufferSource();
    src.buffer = buf; src.loop = true;

    const bp1 = ctx.createBiquadFilter();
    bp1.type = 'bandpass'; bp1.frequency.value = 380; bp1.Q.value = 2.2;

    const lfo = ctx.createOscillator();
    const lg  = ctx.createGain();
    lfo.frequency.value = 0.055; lg.gain.value = 90;
    lfo.connect(lg); lg.connect(bp1.frequency);

    const wg = ctx.createGain();
    wg.gain.setValueAtTime(0, ctx.currentTime);
    wg.gain.linearRampToValueAtTime(0.042, ctx.currentTime + 8);

    src.connect(bp1); bp1.connect(wg); wg.connect(bg);
    src.start(); lfo.start();
    this.windSrc = src; this.windLfo = lfo;
  }

  /** 古琴拨弦旋律 —— 三角波 + 谐波 + 混响 */
  private tickGuqin() {
    if (!this.bgmOn || !this.ctx) return;
    this.pluckGuqin(this.ctx);
    // 随机间隔 3~7 秒，偶尔双音
    const gap = 3200 + Math.random() * 3800;
    this.guqinTimer = setTimeout(() => { if (this.bgmOn) this.tickGuqin(); }, gap);
  }

  private pluckGuqin(ctx: AudioContext) {
    const bg  = this.bgmGain!;
    const rv  = this.convolver!;
    const now = ctx.currentTime;

    // 从中高音区选音
    const pool = PENTA.slice(10, 16); // A3~E4
    const pluck = (freq: number, delay = 0) => {
      const t    = now + delay;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const g2   = ctx.createGain();
      const lp   = ctx.createBiquadFilter();
      const env  = ctx.createGain();
      const rvs  = ctx.createGain();

      osc1.type = 'triangle'; osc1.frequency.value = freq;
      osc2.type = 'sine';     osc2.frequency.value = freq * 2.01; // 略微失谐的泛音
      g2.gain.value = 0.13;
      lp.type = 'lowpass'; lp.frequency.value = 2200; lp.Q.value = 1.0;

      env.gain.setValueAtTime(0, t);
      env.gain.linearRampToValueAtTime(0.48, t + 0.006);  // 极快起音
      env.gain.exponentialRampToValueAtTime(0.08, t + 0.5);
      env.gain.exponentialRampToValueAtTime(0.001, t + 2.8);

      rvs.gain.value = 0.52;

      osc1.connect(lp); osc2.connect(g2); g2.connect(lp);
      lp.connect(env); env.connect(bg); env.connect(rvs); rvs.connect(rv);
      osc1.start(t); osc2.start(t);
      osc1.stop(t + 3.2); osc2.stop(t + 3.2);
    };

    const freq = pool[Math.floor(Math.random() * pool.length)];
    pluck(freq);

    // 30% 概率接一个和声音
    if (Math.random() < 0.3) {
      const companion = pool[Math.floor(Math.random() * pool.length)];
      pluck(companion, 0.28 + Math.random() * 0.22);
    }
  }

  /** 二胡悠扬长音 —— 锯齿波 + 重度低通 + 颤音 */
  private tickErhu() {
    if (!this.bgmOn || !this.ctx) return;
    this.bowErhu(this.ctx);
    const gap = 7000 + Math.random() * 8000;
    this.erhuTimer = setTimeout(() => { if (this.bgmOn) this.tickErhu(); }, gap);
  }

  private bowErhu(ctx: AudioContext) {
    const bg  = this.bgmGain!;
    const now = ctx.currentTime;

    const freq = ERHU[Math.floor(Math.random() * ERHU.length)];
    const dur  = 3.5 + Math.random() * 2.5;

    const osc  = ctx.createOscillator();
    const lp   = ctx.createBiquadFilter();
    const env  = ctx.createGain();

    // 颤音 LFO
    const vibLfo  = ctx.createOscillator();
    const vibGain = ctx.createGain();
    vibLfo.frequency.value = 5.5;
    vibGain.gain.value = freq * 0.008; // ±0.8% 频率颤音

    osc.type = 'sawtooth'; osc.frequency.value = freq;
    lp.type = 'lowpass'; lp.frequency.value = 620; lp.Q.value = 5.5;

    // 拉弓感：缓慢起音
    env.gain.setValueAtTime(0, now);
    env.gain.linearRampToValueAtTime(0.13, now + 0.35);
    env.gain.setValueAtTime(0.13, now + dur - 0.4);
    env.gain.linearRampToValueAtTime(0, now + dur);

    vibLfo.connect(vibGain);
    vibGain.connect(osc.frequency);
    osc.connect(lp); lp.connect(env); env.connect(bg);

    // 少量混响
    const rvs = ctx.createGain();
    rvs.gain.value = 0.28;
    env.connect(rvs); rvs.connect(this.convolver!);

    osc.start(now); vibLfo.start(now + 0.5);
    osc.stop(now + dur + 0.2); vibLfo.stop(now + dur + 0.2);
  }

  /** 木鱼/鼓点 —— 极细腻的节奏底 */
  private tickDrum() {
    if (!this.bgmOn || !this.ctx) return;
    const ctx = this.ctx;
    const bg  = this.bgmGain!;
    const now = ctx.currentTime;

    // 40% 概率敲一下木鱼
    if (Math.random() < 0.40) {
      const sr  = ctx.sampleRate;
      const len = Math.floor(sr * 0.06);
      const buf = ctx.createBuffer(1, len, sr);
      const d   = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.5);

      const src = ctx.createBufferSource();
      const bp  = ctx.createBiquadFilter();
      const eg  = ctx.createGain();
      src.buffer = buf;
      bp.type = 'bandpass'; bp.frequency.value = 1100; bp.Q.value = 8;
      eg.gain.value = 0.055;
      src.connect(bp); bp.connect(eg); eg.connect(bg);
      src.start(now);
    }

    // 节拍间隔：2~5 秒
    const gap = 2000 + Math.random() * 3000;
    this.drumTimer = setTimeout(() => { if (this.bgmOn) this.tickDrum(); }, gap);
  }

  // ──────── SFX ────────────────────────────────────────────────────

  playSFX(type: SFXType) {
    if (this.s.muted) return;
    const ctx  = this.boot();
    const dest = this.sfxGain!;
    const now  = ctx.currentTime;
    try {
      switch (type) {
        case 'click':       this.sfxClick(ctx, dest, now);      break;
        case 'discover':    this.sfxDiscover(ctx, dest, now);   break;
        case 'dialogue':    this.sfxDialogue(ctx, dest, now);   break;
        case 'pickup':      this.sfxPickup(ctx, dest, now);     break;
        case 'chapter':     this.sfxChapter(ctx, dest, now);    break;
        case 'hint':        this.sfxHint(ctx, dest, now);       break;
        case 'room_change': this.sfxRoomChange(ctx, dest, now); break;
      }
    } catch {}
  }

  /** 木质轻击 —— 按钮点击 */
  private sfxClick(ctx: AudioContext, dest: AudioNode, now: number) {
    // 短促噪声模拟木质触感
    const sr  = ctx.sampleRate;
    const len = Math.floor(sr * 0.04);
    const buf = ctx.createBuffer(1, len, sr);
    const d   = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
    const src = ctx.createBufferSource();
    const bp  = ctx.createBiquadFilter();
    const eg  = ctx.createGain();
    src.buffer = buf;
    bp.type = 'bandpass'; bp.frequency.value = 1400; bp.Q.value = 5;
    eg.gain.value = 0.35;
    src.connect(bp); bp.connect(eg); eg.connect(dest);
    src.start(now);
  }

  /** 三音上行 A→C→E —— 发现线索 */
  private sfxDiscover(ctx: AudioContext, dest: AudioNode, now: number) {
    [220.00, 261.63, 329.63].forEach((freq, i) => {
      const t   = now + i * 0.16;
      const osc = ctx.createOscillator();
      const lp  = ctx.createBiquadFilter();
      const env = ctx.createGain();
      osc.type = 'triangle'; osc.frequency.value = freq;
      lp.type = 'lowpass'; lp.frequency.value = 2000;
      env.gain.setValueAtTime(0, t);
      env.gain.linearRampToValueAtTime(0.38, t + 0.008);
      env.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
      osc.connect(lp); lp.connect(env); env.connect(dest);
      osc.start(t); osc.stop(t + 0.65);
    });
  }

  /** 弦乐短句 —— NPC 开口 */
  private sfxDialogue(ctx: AudioContext, dest: AudioNode, now: number) {
    const osc = ctx.createOscillator();
    const lp  = ctx.createBiquadFilter();
    const env = ctx.createGain();
    osc.type = 'sawtooth'; osc.frequency.value = 220; // A3
    lp.type = 'lowpass'; lp.frequency.value = 500; lp.Q.value = 4;
    env.gain.setValueAtTime(0, now);
    env.gain.linearRampToValueAtTime(0.18, now + 0.08);
    env.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    osc.connect(lp); lp.connect(env); env.connect(dest);
    osc.start(now); osc.stop(now + 0.45);
  }

  /** 古筝双音 A→E —— 拾取道具 */
  private sfxPickup(ctx: AudioContext, dest: AudioNode, now: number) {
    [220.00, 329.63].forEach((freq, i) => {
      const t   = now + i * 0.13;
      const osc = ctx.createOscillator();
      const env = ctx.createGain();
      osc.type = 'triangle'; osc.frequency.value = freq;
      env.gain.setValueAtTime(0, t);
      env.gain.linearRampToValueAtTime(0.30, t + 0.006);
      env.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
      osc.connect(env); env.connect(dest);
      osc.start(t); osc.stop(t + 0.5);
    });
  }

  /** 铜锣声 —— 章节结局 */
  private sfxChapter(ctx: AudioContext, dest: AudioNode, now: number) {
    // 主要谐波族（仿铜锣非谐波泛音）
    [
      { f: 55.00,  g: 0.60, d: 6.0 },
      { f: 110.00, g: 0.40, d: 5.5 },
      { f: 164.81, g: 0.25, d: 4.5 },
      { f: 233.08, g: 0.15, d: 3.5 }, // 非谐波泛音 → 金属感
      { f: 293.66, g: 0.08, d: 2.8 },
      { f: 27.50,  g: 0.30, d: 6.5 }, // A0 超低频冲击
    ].forEach(({ f, g, d }) => {
      const osc = ctx.createOscillator();
      const env = ctx.createGain();
      osc.type = 'sine'; osc.frequency.value = f;
      env.gain.setValueAtTime(0, now);
      env.gain.linearRampToValueAtTime(g, now + 0.01);
      env.gain.exponentialRampToValueAtTime(g * 0.25, now + 0.6);
      env.gain.exponentialRampToValueAtTime(0.001, now + d);
      osc.connect(env); env.connect(dest);
      osc.start(now); osc.stop(now + d + 0.1);
    });
    // 金属打击瞬态（噪声）
    const sr  = ctx.sampleRate;
    const len = Math.floor(sr * 0.08);
    const buf = ctx.createBuffer(1, len, sr);
    const dd  = buf.getChannelData(0);
    for (let i = 0; i < len; i++) dd[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 1.5);
    const src = ctx.createBufferSource();
    const hp  = ctx.createBiquadFilter();
    const eg  = ctx.createGain();
    src.buffer = buf; hp.type = 'highpass'; hp.frequency.value = 500;
    eg.gain.value = 0.22;
    src.connect(hp); hp.connect(eg); eg.connect(dest);
    src.start(now);
  }

  /** 笛声下行 —— 心理活动提示 */
  private sfxHint(ctx: AudioContext, dest: AudioNode, now: number) {
    const osc = ctx.createOscillator();
    const lp  = ctx.createBiquadFilter();
    const env = ctx.createGain();
    osc.type = 'sine';
    // E4 → C4 轻柔下行（五声音阶内）
    osc.frequency.setValueAtTime(329.63, now);
    osc.frequency.exponentialRampToValueAtTime(261.63, now + 0.85);
    lp.type = 'lowpass'; lp.frequency.value = 900;

    // 加轻微颤音
    const vib  = ctx.createOscillator();
    const vg   = ctx.createGain();
    vib.frequency.value = 5; vg.gain.value = 4;
    vib.connect(vg); vg.connect(osc.frequency);

    env.gain.setValueAtTime(0, now);
    env.gain.linearRampToValueAtTime(0.13, now + 0.1);
    env.gain.setValueAtTime(0.13, now + 0.6);
    env.gain.linearRampToValueAtTime(0, now + 1.0);

    osc.connect(lp); lp.connect(env); env.connect(dest);
    osc.start(now); vib.start(now + 0.2);
    osc.stop(now + 1.1); vib.stop(now + 1.1);
  }

  /** 衣袂/脚步 —— 换房间 */
  private sfxRoomChange(ctx: AudioContext, dest: AudioNode, now: number) {
    const sr  = ctx.sampleRate;
    const len = Math.floor(sr * 0.22);
    const buf = ctx.createBuffer(1, len, sr);
    const d   = buf.getChannelData(0);
    // 模拟衣物摩擦：柔和噪声
    for (let i = 0; i < len; i++) {
      const env = i < len * 0.15 ? i / (len * 0.15) : Math.pow(1 - (i - len * 0.15) / (len * 0.85), 1.4);
      d[i] = (Math.random() * 2 - 1) * env * 0.7;
    }
    const src = ctx.createBufferSource();
    const lp  = ctx.createBiquadFilter();
    const eg  = ctx.createGain();
    src.buffer = buf;
    lp.type = 'lowpass'; lp.frequency.value = 700;
    eg.gain.value = 0.14;
    src.connect(lp); lp.connect(eg); eg.connect(dest);
    src.start(now);
  }

  // ──────── 音量控制 ────────────────────────────────────────────────

  get bgmVolume()  { return this.s.bgmVolume; }
  get sfxVolume()  { return this.s.sfxVolume; }
  get muted()      { return this.s.muted; }
  get isRunning()  { return this.bgmOn; }

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
