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

// ─── AudioContext + Buffers ────────────────────────────
let _ctx: AudioContext | null = null
let _sparkleBuffer: AudioBuffer | null = null
let _flipBuffer: AudioBuffer | null = null
let _unlockBuffer: AudioBuffer | null = null

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
  // 1. Persistent touchstart listener: create + resume AudioContext on every touch.
  //    iOS requires resume() in user gesture. Once running, stays alive until page backgrounds.
  document.addEventListener('touchstart', () => {
    if (!_ctx) {
      _ctx = new AudioContext()
    }
    if (_ctx.state === 'suspended') void _ctx.resume()
  }, true)
  document.addEventListener('click', () => {
    if (!_ctx) {
      _ctx = new AudioContext()
    }
    if (_ctx.state === 'suspended') void _ctx.resume()
  }, true)

  // 2. Pre-decode synthesized sounds into AudioBuffers (after first AudioContext is ready)
  const decodeSfx = () => {
    if (!_ctx) return
    const sparkleWav = pcmToWav(SR, genSparkle())
    const flipWav = pcmToWav(SR, genFlip())
    void _ctx.decodeAudioData(sparkleWav.slice(0)).then(buf => { _sparkleBuffer = buf })
    void _ctx.decodeAudioData(flipWav.slice(0)).then(buf => { _flipBuffer = buf })
  }

  // 3. Pre-fetch + decode unlock MP3
  const decodeUnlock = () => {
    if (!_ctx) return
    fetch(soundUrl)
      .then(r => r.arrayBuffer())
      .then(buf => _ctx!.decodeAudioData(buf))
      .then(decoded => { _unlockBuffer = decoded })
      .catch(() => {})
  }

  // Decode after first AudioContext creation
  const initBuffers = () => {
    decodeSfx()
    decodeUnlock()
    document.removeEventListener('touchstart', initBuffers, true)
    document.removeEventListener('click', initBuffers, true)
  }
  document.addEventListener('touchstart', initBuffers, true)
  document.addEventListener('click', initBuffers, true)
}

export function playUnlockSound() { playBuffer(_unlockBuffer, 0.7) }
export function playSparkle() { playBuffer(_sparkleBuffer, 0.5) }
export function playFlip() { playBuffer(_flipBuffer, 0.6) }

// Unused but keep for backward compat
export function playWhoosh() { /* removed */ }
export function resumeAudio() { /* no-op */ }
