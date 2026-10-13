import { useState, useEffect, useCallback, useRef } from 'react'

// ── Audio System ──
let audioCtx: AudioContext | null = null
function getAudioCtx(): AudioContext {
  if (!audioCtx) audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
  if (audioCtx.state === 'suspended') audioCtx.resume()
  return audioCtx
}
function playClick() {
  try {
    const ctx = getAudioCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'; osc.frequency.value = 800
    gain.gain.setValueAtTime(0.12, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06)
    osc.connect(gain); gain.connect(ctx.destination)
    osc.start(); osc.stop(ctx.currentTime + 0.06)
  } catch { /* no audio */ }
}
function playAlarm() {
  const notes = [523, 659, 784, 1047]
  notes.forEach((f, i) => {
    try {
      const ctx = getAudioCtx()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'; osc.frequency.value = f
      gain.gain.setValueAtTime(0.25, ctx.currentTime + i * 0.18)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.18 + 0.3)
      osc.connect(gain); gain.connect(ctx.destination)
      osc.start(ctx.currentTime + i * 0.18)
      osc.stop(ctx.currentTime + i * 0.18 + 0.3)
    } catch { /* no audio */ }
  })
}

// ── Types ──
type Mode = 'work' | 'break' | 'long-break'
const MODES: { key: Mode; label: string; icon: string; defaultMin: number }[] = [
  { key: 'work', label: '专注', icon: '🍅', defaultMin: 25 },
  { key: 'break', label: '短休', icon: '☕', defaultMin: 5 },
  { key: 'long-break', label: '长休', icon: '🌴', defaultMin: 15 },
]

const DURATIONS: Record<Mode, number> = { work: 25 * 60, break: 5 * 60, 'long-break': 15 * 60 }
const CIRCUMFERENCE = 2 * Math.PI * 110 // r=110

// ── Helpers ──
function fmtTime(s: number): string {
  const m = Math.floor(s / 60); const sec = s % 60
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

export default function App() {
  const [mode, setMode] = useState<Mode>('work')
  const [timeLeft, setTimeLeft] = useState(DURATIONS.work)
  const [isRunning, setIsRunning] = useState(false)
  const [completed, setCompleted] = useState(0)
  const [alwaysOnTop, setAlwaysOnTop] = useState(false)
  const [darkMode, setDarkMode] = useState(true)

  const totalDuration = DURATIONS[mode]
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // ── Timer Logic ──
  const tick = useCallback(() => {
    setTimeLeft(prev => {
      if (prev <= 1) {
        return 0
      }
      return prev - 1
    })
  }, [])

  useEffect(() => {
    if (timeLeft <= 0 && isRunning) {
      // Timer complete
      setIsRunning(false)
      playAlarm()
      if (mode === 'work') {
        setCompleted(c => c + 1)
        const nextMode: Mode = (completed + 1) % 4 === 0 ? 'long-break' : 'break'
        setMode(nextMode)
        setTimeLeft(DURATIONS[nextMode])
      } else {
        setMode('work')
        setTimeLeft(DURATIONS.work)
      }
    }
  }, [timeLeft, isRunning, mode, completed])

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      timerRef.current = setInterval(tick, 1000)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [isRunning, tick])

  // ── Actions ──
  const toggleTimer = () => { playClick(); setIsRunning(r => !r) }
  const resetTimer = () => { playClick(); setIsRunning(false); setTimeLeft(DURATIONS[mode]) }
  const switchMode = (m: Mode) => { playClick(); setIsRunning(false); setMode(m); setTimeLeft(DURATIONS[m]) }

  const toggleAlwaysOnTop = async () => {
    try {
      const newState = !alwaysOnTop
      await window.electronAPI?.setAlwaysOnTop(newState)
      setAlwaysOnTop(newState)
    } catch { /* not in Electron */ }
  }

  const toggleDarkMode = () => {
    setDarkMode(d => !d)
    document.documentElement.classList.toggle('dark', !darkMode)
  }

  // Init dark mode
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
  }, [darkMode])

  // ── Ring progress ──
  const progress = totalDuration > 0 ? timeLeft / totalDuration : 1
  const offset = CIRCUMFERENCE * (1 - progress)

  return (
    <div className={`no-select w-full h-screen flex items-center justify-center ${darkMode ? 'bg-[#1c1c1e]/70' : 'bg-[#f5f5f7]/70'}`}>
      <div className={`glass w-[360px] rounded-[22px] px-8 py-8 flex flex-col items-center gap-6 shadow-2xl ${darkMode ? 'text-white' : 'text-[#1d1d1f]'}`}>
        {/* ── Mode Switch ── */}
        <div className={`flex gap-1 rounded-full p-1 ${darkMode ? 'bg-white/[0.06]' : 'bg-black/[0.04]'}`}>
          {MODES.map(m => (
            <button
              key={m.key}
              onClick={() => switchMode(m.key)}
              className={`mode-switch px-4 py-2 rounded-full text-[13px] font-medium ${
                mode === m.key
                  ? darkMode
                    ? 'bg-white/20 text-white shadow-sm'
                    : 'bg-white text-[#1d1d1f] shadow-md'
                  : darkMode
                    ? 'text-white/50 hover:text-white/80'
                    : 'text-black/50 hover:text-black/80'
              }`}
            >
              {m.icon} {m.label}
            </button>
          ))}
        </div>

        {/* ── Ring Timer ── */}
        <div className="relative w-[240px] h-[240px]">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 240 240">
            {/* Background ring */}
            <circle
              cx="120" cy="120" r="110"
              fill="none"
              stroke={darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}
              strokeWidth="6"
            />
            {/* Progress ring */}
            <circle
              cx="120" cy="120" r="110"
              fill="none"
              stroke={mode === 'work' ? '#ff6b6b' : mode === 'break' ? '#34c759' : '#007aff'}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={offset}
              className={isRunning ? 'ring-progress' : 'ring-progress paused'}
            />
          </svg>
          {/* Center display */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span
              className={`text-[48px] font-mono font-bold tracking-wider ${darkMode ? 'text-white' : 'text-[#1d1d1f]'}`}
            >
              {fmtTime(timeLeft)}
            </span>
            <span className={`text-[12px] tracking-[0.15em] uppercase mt-1 ${darkMode ? 'text-white/50' : 'text-black/40'}`}>
              {isRunning ? (mode === 'work' ? '专注中...' : '休息中...') : '已暂停'}
            </span>
          </div>
        </div>

        {/* ── Controls ── */}
        <div className="flex items-center gap-5">
          <button
            onClick={resetTimer}
            className={`btn-press w-10 h-10 rounded-full flex items-center justify-center text-lg ${
              darkMode ? 'bg-white/[0.08] text-white/60 hover:bg-white/[0.14]' : 'bg-black/[0.05] text-black/50 hover:bg-black/[0.1]'
            }`}
            title="重置"
          >
            ↺
          </button>

          <button
            onClick={toggleTimer}
            className={`btn-press w-[60px] h-[60px] rounded-full flex items-center justify-center text-[28px] shadow-lg transition-all duration-200 hover:scale-105 ${
              isRunning
                ? 'bg-[#ff9500] text-white shadow-[#ff9500]/30'
                : 'bg-[#ff3b30] text-white shadow-[#ff3b30]/30'
            }`}
            title={isRunning ? '暂停' : '开始'}
          >
            {isRunning ? '⏸' : '▶'}
          </button>

          <button
            onClick={toggleAlwaysOnTop}
            className={`btn-press w-10 h-10 rounded-full flex items-center justify-center text-lg ${
              alwaysOnTop
                ? (darkMode ? 'bg-[#007aff] text-white' : 'bg-[#007aff] text-white')
                : (darkMode ? 'bg-white/[0.08] text-white/60 hover:bg-white/[0.14]' : 'bg-black/[0.05] text-black/50 hover:bg-black/[0.1]')
            }`}
            title="窗口置顶"
          >
            📌
          </button>
        </div>

        {/* ── Bottom Bar ── */}
        <div className={`flex items-center justify-between w-full pt-3 border-t ${darkMode ? 'border-white/[0.06]' : 'border-black/[0.04]'}`}>
          <span className={`text-[11px] ${darkMode ? 'text-white/40' : 'text-black/40'}`}>
            {completed > 0 ? `已完成 ${completed} 个番茄` : '开始你的第一个番茄吧'}
          </span>
          <button
            onClick={toggleDarkMode}
            className={`btn-press w-8 h-8 rounded-full flex items-center justify-center text-sm ${
              darkMode ? 'bg-white/[0.08] hover:bg-white/[0.14]' : 'bg-black/[0.05] hover:bg-black/[0.1]'
            }`}
            title="切换主题"
          >
            {darkMode ? '🌙' : '☀️'}
          </button>
        </div>
      </div>
    </div>
  )
}
