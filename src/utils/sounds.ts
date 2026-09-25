// ─── Sound Effects via Web Audio API (non-blocking playback) ───────────
// AudioContext.createBufferSource().start() runs on audio thread = no animation stutter
// Persistent touchstart listener keeps AudioContext alive on iOS

// ─── WAV Encoder (for synthesized sounds) ──────────────
function writeStr(view: DataView, offset: number, s: string) {
  for (let i = 0; i < s.length; i++) view.setUint8(offset + i, s.charCodeAt(i))
}

function pcmToWav(sampleRate: number, samples: Float32Array): ArrayBuffer {
  const len = samples.length
  const buf = new ArrayBuffer(44 + len * 2)
  const v = new DataView(buf)
  writeStr(v, 0, 'RIFF')
  v.setUint32(4, 36 + len * 2, true)
  writeStr(v, 8, 'WAVE')
  writeStr(v, 12, 'fmt ')
  v.setUint32(16, 16, true)
  v.setUint16(20, 1, true)
  v.setUint16(22, 1, true)
  v.setUint32(24, sampleRate, true)
  v.setUint32(28, sampleRate * 2, true)
  v.setUint16(32, 2, true)
  v.setUint16(34, 16, true)
  writeStr(v, 36, 'data')
  v.setUint32(40, len * 2, true)
  for (let i = 0; i < len; i++) {
    v.setInt16(44 + i * 2, Math.max(-1, Math.min(1, samples[i])) * 0x7fff, true)
  }
  return buf
}

// ─── Sound Synthesis ───────────────────────────────────
const SR = 44100

function genSparkle(): Float32Array {
  const dur = 0.2, len = SR * dur
  const data = new Float32Array(len)
  for (let i = 0; i < len; i++) {
    const t = i / SR
    const freq = 2400 * Math.pow(1200 / 2400, t / 0.15)
    const envelope = Math.exp(-t * 15) * 0.12
    data[i] = Math.sin(2 * Math.PI * freq * t) * envelope
  }
  return data
}

function genFlip(): Float32Array {
  const dur = 0.15, len = SR * dur
  const data = new Float32Array(len)
  for (let i = 0; i < len; i++) {
    const t = i / SR
    data[i] = (Math.random() * 2 - 1) * Math.exp(-t * 30) * 0.2
  }
  let avg = 0
  for (let i = 0; i < len; i++) {
    avg = avg * 0.95 + data[i] * 0.05
    data[i] = data[i] - avg
  }
  return data
}

/** เสียง shimmer มหัศจรรย์ตอน loading — ascending harmonics, นุ่มๆ */
function genLoadingShimmer(): Float32Array {
  const dur = 2.2, len = SR * dur
  const data = new Float32Array(len)
  for (let i = 0; i < len; i++) {
    const t = i / SR
    const freq = 520 + t * 180
    const envelope = Math.sin(Math.PI * t / dur) * 0.05
    data[i] = (
      Math.sin(2 * Math.PI * freq * t) * 0.5 +
      Math.sin(2 * Math.PI * freq * 1.5 * t) * 0.25 +
      Math.sin(2 * Math.PI * freq * 2 * t) * 0.15 +
      Math.sin(2 * Math.PI * freq * 3 * t) * 0.1
    ) * envelope
  }
  return data
}

/** เสียง chime ตอนโหลดครบ 100% — ding-ding สดใส */
function genCompletionChime(): Float32Array {
  const dur = 0.7, len = SR * dur
  const data = new Float32Array(len)
  for (let i = 0; i < len; i++) {
    const t = i / SR
    let val = 0
    // Note 1: C6 (1047 Hz) for 0-0.35s
    if (t < 0.35) {
      val = Math.sin(2 * Math.PI * 1047 * t) * Math.exp(-t * 6) * 0.15
    }
    // Note 2: E6 (1319 Hz) starts at 0.15s
    if (t >= 0.15) {
      const t2 = t - 0.15
      val += Math.sin(2 * Math.PI * 1319 * t) * Math.exp(-t2 * 5) * 0.12
    }
    // Add shimmer overtone
    val += Math.sin(2 * Math.PI * 2637 * t) * Math.exp(-t * 10) * 0.04
    data[i] = val
  }
  return data
}

/** เสียง swoosh transition — นุ่มพัดผ่าน */
function genSwoosh(): Float32Array {
  const dur = 0.35, len = SR * dur
  const data = new Float32Array(len)
  for (let i = 0; i < len; i++) {
    const t = i / SR
    data[i] = (Math.random() * 2 - 1) * Math.sin(Math.PI * t / dur) * 0.1
  }
  // Lowpass
  let prev = 0
  for (let i = 0; i < len; i++) {
    data[i] = prev = prev * 0.88 + data[i] * 0.12
  }
  return data
}

/** เสียง shrink — descending bloop น่ารัก */
function genShrink(): Float32Array {
  const dur = 0.22, len = SR * dur
  const data = new Float32Array(len)
  for (let i = 0; i < len; i++) {
    const t = i / SR
    const freq = 700 * Math.pow(350 / 700, t / dur)
    const envelope = Math.exp(-t * 14) * 0.1
    data[i] = Math.sin(2 * Math.PI * freq * t) * envelope
  }
  return data
}

// ─── AudioContext + Buffers ────────────────────────────
let _ctx: AudioContext | null = null
let _sparkleBuffer: AudioBuffer | null = null
let _flipBuffer: AudioBuffer | null = null
let _unlockBuffer: AudioBuffer | null = null
let _shimmerBuffer: AudioBuffer | null = null
let _chimeBuffer: AudioBuffer | null = null
let _swooshBuffer: AudioBuffer | null = null
let _shrinkBuffer: AudioBuffer | null = null

function playBuffer(buffer: AudioBuffer | null, volume: number) {
  if (!buffer || !_ctx) return
  const src = _ctx.createBufferSource()
  src.buffer = buffer
  const gain = _ctx.createGain()
  gain.gain.value = volume
  src.connect(gain).connect(_ctx.destination)
  src.start() // NON-BLOCKING: audio thread handles playback
}

// ─── Public API ────────────────────────────────────────

export function setupMobileAudio(soundUrl: string) {
  // 1. Create AudioContext IMMEDIATELY — iOS allows creation + decoding
  //    while suspended. Only playback needs resume() from user gesture.
  _ctx = new AudioContext()

  // 2. Decode ALL synthesized sounds NOW (works even while suspended)
  const decode = (data: Float32Array) => {
    const wav = pcmToWav(SR, data)
    return _ctx!.decodeAudioData(wav.slice(0))
  }
  void decode(genSparkle()).then(buf => { _sparkleBuffer = buf })
  void decode(genFlip()).then(buf => { _flipBuffer = buf })
  void decode(genLoadingShimmer()).then(buf => { _shimmerBuffer = buf })
  void decode(genCompletionChime()).then(buf => { _chimeBuffer = buf })
  void decode(genSwoosh()).then(buf => { _swooshBuffer = buf })
  void decode(genShrink()).then(buf => { _shrinkBuffer = buf })

  // 3. Pre-fetch + decode unlock MP3
  fetch(soundUrl)
    .then(r => r.arrayBuffer())
    .then(buf => _ctx!.decodeAudioData(buf))
    .then(decoded => { _unlockBuffer = decoded })
    .catch(() => {})

  // 4. Resume AudioContext on EVERY touch/click (iOS requirement).
  //    Once resumed, stays alive until page backgrounds.
  const resume = () => {
    if (_ctx && _ctx.state === 'suspended') void _ctx.resume()
  }
  document.addEventListener('touchstart', resume, true)
  document.addEventListener('click', resume, true)
}

// ─── Existing sounds ───
export function playUnlockSound() { playBuffer(_unlockBuffer, 0.7) }
export function playSparkle() { playBuffer(_sparkleBuffer, 0.5) }
export function playFlip() { playBuffer(_flipBuffer, 0.6) }

// ─── New sounds ───
export function playLoadingShimmer() { playBuffer(_shimmerBuffer, 0.4) }
export function playCompletionChime() { playBuffer(_chimeBuffer, 0.5) }
export function playSwoosh() { playBuffer(_swooshBuffer, 0.4) }
export function playShrink() { playBuffer(_shrinkBuffer, 0.4) }

// Unused but keep for backward compat
export function playWhoosh() { /* removed */ }
export function resumeAudio() {
  if (_ctx && _ctx.state === 'suspended') void _ctx.resume()
}
