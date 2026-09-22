// ─── Web Audio API Synthesized Sounds ─────────────────────────
// สร้างเสียงจากโค้ด ไม่ต้องโหลดไฟล์เสียง — 0 bytes asset

let audioCtx: AudioContext | null = null

function ctx(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext()
  // Resume ถ้า browser suspend ไว้ (autoplay policy)
  if (audioCtx.state === 'suspended') void audioCtx.resume()
  return audioCtx
}

/** เสียงลมพัด — white noise + bandpass filter, fade 250ms */
export function playWhoosh() {
  const c = ctx()
  const duration = 0.25
  const len = c.sampleRate * duration
  const buffer = c.createBuffer(1, len, c.sampleRate)
  const data = buffer.getChannelData(0)

  for (let i = 0; i < len; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / len)
  }

  const source = c.createBufferSource()
  source.buffer = buffer

  const filter = c.createBiquadFilter()
  filter.type = 'bandpass'
  filter.frequency.value = 800
  filter.Q.value = 0.5

  const gain = c.createGain()
  gain.gain.setValueAtTime(0.15, c.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration)

  source.connect(filter).connect(gain).connect(c.destination)
  source.start()
}

/** เสียงกริ๊ง sparkle — sine wave สูง, quick decay */
export function playSparkle() {
  const c = ctx()
  const osc = c.createOscillator()
  const gain = c.createGain()

  osc.type = 'sine'
  osc.frequency.setValueAtTime(2400, c.currentTime)
  osc.frequency.exponentialRampToValueAtTime(1200, c.currentTime + 0.15)

  gain.gain.setValueAtTime(0.12, c.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.2)

  osc.connect(gain).connect(c.destination)
  osc.start()
  osc.stop(c.currentTime + 0.2)
}

/** เสียงพลิกการ์ด — short noise burst + highpass */
export function playFlip() {
  const c = ctx()
  const duration = 0.15
  const len = c.sampleRate * duration
  const buffer = c.createBuffer(1, len, c.sampleRate)
  const data = buffer.getChannelData(0)

  for (let i = 0; i < len; i++) {
    const t = i / c.sampleRate
    data[i] = (Math.random() * 2 - 1) * Math.exp(-t * 30) * 0.5
  }

  const source = c.createBufferSource()
  source.buffer = buffer

  const filter = c.createBiquadFilter()
  filter.type = 'highpass'
  filter.frequency.value = 2000

  const gain = c.createGain()
  gain.gain.setValueAtTime(0.2, c.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration)

  source.connect(filter).connect(gain).connect(c.destination)
  source.start()
}
