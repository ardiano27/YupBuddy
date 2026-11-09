import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Mic, Volume2, Copy, Bookmark, History, BookOpen,
  Settings, RefreshCw, Zap, Shield, Sparkles, Languages,
  Search, Star, ChevronRight, ArrowLeftRight, X,
  Maximize2, Info, CheckCircle2, AlertCircle, Wifi, WifiOff,
  FlipHorizontal2, Trophy, Target, TrendingUp, RotateCcw,
  Globe, ChevronDown, Play, Square
} from 'lucide-react'

// ================================================================
// DATA — Translations, Scenarios, Flashcards, History
// ================================================================

const SCENARIOS = [
  {
    id: 'noodles',
    label: '🍜 Ordering Noodles',
    en: 'I would like a bowl of beef noodle soup, not too spicy please.',
    zh: '我想要一碗牛肉面，请不要太辣。',
    pinyin: 'Wǒ xiǎng yào yī wǎn niúròu miàn, qǐng bú yào tài là.',
  },
  {
    id: 'didi',
    label: '🚖 Taking a Didi',
    en: 'Please take me to this address. I am in a hurry.',
    zh: '请送我去这个地址，我有点着急。',
    pinyin: 'Qǐng sòng wǒ qù zhège dìzhǐ, wǒ yǒudiǎn zhāojí.',
  },
  {
    id: 'directions',
    label: '📍 Asking Directions',
    en: 'Excuse me, how do I get to the nearest subway station?',
    zh: '不好意思，请问最近的地铁站怎么走？',
    pinyin: 'Bù hǎoyìsi, qǐngwèn zuìjìn de dìtiě zhàn zěnme zǒu?',
  },
  {
    id: 'bargain',
    label: '🛍️ Bargaining',
    en: 'Can you give me a better price? I will pay cash.',
    zh: '能便宜点吗？我付现金。',
    pinyin: 'Néng piányí diǎn ma? Wǒ fù xiànjīn.',
  },
]

const FLASHCARDS = [
  {
    id: 'canteen',
    category: 'Canteen',
    emoji: '🍱',
    front: 'Ordering at the canteen',
    back_zh: '打包带走',
    back_pinyin: 'Dǎbāo dài zǒu',
    tip: '💡 "Dǎbāo" means takeaway. Hold up fingers for quantity.',
    color: '#FFF1E8',
  },
  {
    id: 'taxi',
    category: 'Taxi',
    emoji: '🚕',
    front: 'Tell driver your stop',
    back_zh: '在这里停一下',
    back_pinyin: 'Zài zhèlǐ tíng yīxià',
    tip: '💡 Say it firmly. Drivers respond to confident tone.',
    color: '#EEF0FF',
  },
  {
    id: 'admin',
    category: 'Admin',
    emoji: '🏛️',
    front: 'At the registration office',
    back_zh: '我需要办理登记手续',
    back_pinyin: 'Wǒ xūyào bànlǐ dēngjì shǒuxù',
    tip: '💡 Bring your passport and university ID. Always have copies.',
    color: '#F0FFF4',
  },
  {
    id: 'hospital',
    category: 'Health',
    emoji: '🏥',
    front: 'I need to see a doctor',
    back_zh: '我需要看医生',
    back_pinyin: 'Wǒ xūyào kàn yīshēng',
    tip: '💡 International clinics (国际诊所) have English staff.',
    color: '#FFF5F5',
  },
]

const SAMPLE_HISTORY = [
  {
    id: 'h1',
    en: 'Where is the nearest ATM?',
    zh: '最近的ATM在哪里？',
    pinyin: 'Zuìjìn de ATM zài nǎlǐ?',
    starred: true,
    ts: Date.now() - 3600000,
  },
  {
    id: 'h2',
    en: 'I am allergic to shellfish.',
    zh: '我对贝类过敏。',
    pinyin: 'Wǒ duì bèilèi guòmǐn.',
    starred: false,
    ts: Date.now() - 7200000,
  },
  {
    id: 'h3',
    en: 'Please give me a receipt.',
    zh: '请给我一张收据。',
    pinyin: 'Qǐng gěi wǒ yī zhāng shōujù.',
    starred: true,
    ts: Date.now() - 86400000,
  },
]

const QUICK_TRANSLATIONS = {
  'hello': { zh: '你好', pinyin: 'Nǐ hǎo' },
  'thank you': { zh: '谢谢', pinyin: 'Xièxiè' },
  'sorry': { zh: '对不起', pinyin: 'Duìbuqǐ' },
  'help': { zh: '帮助', pinyin: 'Bāngzhù' },
  'water': { zh: '水', pinyin: 'Shuǐ' },
  'food': { zh: '食物', pinyin: 'Shíwù' },
  'bathroom': { zh: '洗手间', pinyin: 'Xǐshǒujiān' },
  'hospital': { zh: '医院', pinyin: 'Yīyuàn' },
}

// ================================================================
// UTILITIES
// ================================================================
const LS_KEY = 'yupbuddy_history'
const LS_SETTINGS = 'yupbuddy_settings'

function loadHistory() {
  try {
    const raw = localStorage.getItem(LS_KEY)
    return raw ? JSON.parse(raw) : SAMPLE_HISTORY
  } catch { return SAMPLE_HISTORY }
}

function saveHistory(items) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(items)) } catch {}
}

function loadSettings() {
  try {
    const raw = localStorage.getItem(LS_SETTINGS)
    return raw ? JSON.parse(raw) : { speed: 1.0, gateway: 'tencent', phoneFrame: false }
  } catch { return { speed: 1.0, gateway: 'tencent', phoneFrame: false } }
}

function saveSettings(s) {
  try { localStorage.setItem(LS_SETTINGS, JSON.stringify(s)) } catch {}
}

function timeAgo(ts) {
  const diff = Date.now() - ts
  if (diff < 60000) return 'Just now'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
  return `${Math.floor(diff / 86400000)}d ago`
}

function speakText(text, lang = 'zh-CN', rate = 1.0) {
  if (!window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const utt = new SpeechSynthesisUtterance(text)
  utt.lang = lang
  utt.rate = rate
  window.speechSynthesis.speak(utt)
}

// Mock translation function (simulates API latency)
async function mockTranslate(text) {
  await new Promise(r => setTimeout(r, 900 + Math.random() * 600))
  const lc = text.toLowerCase().trim()
  // Check quick lookup
  for (const [k, v] of Object.entries(QUICK_TRANSLATIONS)) {
    if (lc.includes(k)) {
      return { zh: v.zh, pinyin: v.pinyin }
    }
  }
  // Check scenario match
  for (const s of SCENARIOS) {
    if (lc.includes(s.id) || s.en.toLowerCase().includes(lc.substring(0, 10))) {
      return { zh: s.zh, pinyin: s.pinyin }
    }
  }
  // Generic fallback with random "realistic" response
  const fallbacks = [
    { zh: '我不太明白，请再说一遍。', pinyin: 'Wǒ bù tài míngbái, qǐng zài shuō yī biàn.' },
    { zh: '请问您需要什么帮助？', pinyin: 'Qǐngwèn nín xūyào shénme bāngzhù?' },
    { zh: '好的，我明白了。', pinyin: 'Hǎo de, wǒ míngbái le.' },
  ]
  return fallbacks[Math.floor(Math.random() * fallbacks.length)]
}

// ================================================================
// COMPONENTS — Soundwave SVG
// ================================================================
function SoundwaveViz({ active }) {
  return (
    <div className={`soundwave ${active ? 'active' : ''}`}>
      {[...Array(7)].map((_, i) => (
        <div key={i} className="soundwave-bar" />
      ))}
    </div>
  )
}

// ================================================================
// COMPONENTS — PTT Button
// ================================================================
function PTTButton({ onRecordStart, onRecordStop, state }) {
  const isRecording = state === 'recording'
  const isProcessing = state === 'processing'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <div style={{ position: 'relative' }}>
        {isRecording && (
          <>
            <div className="ptt-pulse-ring" />
            <div className="ptt-pulse-ring-2" />
          </>
        )}
        <button
          className={`ptt-btn ${isRecording ? 'recording' : ''} ${isProcessing ? 'processing' : ''}`}
          onMouseDown={onRecordStart}
          onMouseUp={onRecordStop}
          onTouchStart={(e) => { e.preventDefault(); onRecordStart() }}
          onTouchEnd={(e) => { e.preventDefault(); onRecordStop() }}
          aria-label={isRecording ? 'Release to stop recording' : 'Hold to talk'}
        >
          {isProcessing ? (
            <RefreshCw size={22} color="white" style={{ animation: 'spin 1s linear infinite' }} />
          ) : (
            <SoundwaveViz active={isRecording} />
          )}
        </button>
      </div>
      <span style={{
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: '0.08em',
        color: isRecording ? '#E63946' : 'rgba(23,26,53,0.45)',
        textTransform: 'uppercase',
        transition: 'color 0.2s',
      }}>
        {isRecording ? '● Recording…' : isProcessing ? 'Processing…' : 'Hold to Talk'}
      </span>
    </div>
  )
}

// ================================================================
// COMPONENTS — Gateway Badge
// ================================================================
function GatewayBadge({ gateway, ping }) {
  const isGood = ping < 200
  const isOk = ping < 500
  const dotClass = isGood ? 'good' : isOk ? 'ok' : 'bad'
  const label = gateway === 'tencent' ? 'Tencent Cloud' : 'Baidu Speech'

  return (
    <div className="gateway-badge">
      <div className={`ping-dot ${dotClass}`} />
      <span style={{ color: 'rgba(23,26,53,0.6)' }}>{label}</span>
      <span style={{ fontWeight: 800, color: isGood ? '#16A34A' : isOk ? '#D97706' : '#DC2626' }}>
        {ping}ms
      </span>
    </div>
  )
}

// ================================================================
// COMPONENTS — Merchant Modal
// ================================================================
function MerchantModal({ translation, onClose }) {
  if (!translation) return null
  return (
    <div className="merchant-modal" onClick={onClose}>
      {/* Close hint */}
      <div style={{
        position: 'absolute',
        top: 24,
        right: 24,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}>
        <button
          onClick={onClose}
          style={{
            width: 40, height: 40, borderRadius: '50%',
            background: 'rgba(255,255,255,0.12)',
            border: '1.5px solid rgba(255,255,255,0.2)',
            color: 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
          }}
          aria-label="Close merchant view"
        >
          <X size={18} />
        </button>
      </div>

      {/* Top label */}
      <div style={{
        position: 'absolute', top: 32, left: 0, right: 0,
        textAlign: 'center',
        fontSize: 11, fontWeight: 800, letterSpacing: '0.15em',
        textTransform: 'uppercase',
        color: 'rgba(255,255,255,0.35)',
      }}>
        Show this to the merchant 👇
      </div>

      {/* Chinese text — huge */}
      <div style={{ textAlign: 'center', maxWidth: 340 }}>
        <div className="zh" style={{
          fontSize: 'clamp(48px, 14vw, 72px)',
          fontWeight: 900,
          color: '#FFDD44',
          lineHeight: 1.2,
          letterSpacing: '-0.01em',
          marginBottom: 24,
          textShadow: '0 2px 20px rgba(255,221,68,0.3)',
        }}>
          {translation.zh}
        </div>
        <div style={{
          fontSize: 22,
          fontWeight: 600,
          color: 'rgba(255,255,255,0.65)',
          letterSpacing: '0.02em',
          marginBottom: 16,
        }}>
          {translation.pinyin}
        </div>
        <div style={{
          fontSize: 15,
          color: 'rgba(255,255,255,0.4)',
          fontStyle: 'italic',
        }}>
          {translation.en}
        </div>
      </div>

      {/* Bottom hint */}
      <div style={{
        position: 'absolute',
        bottom: 36,
        left: 0, right: 0,
        textAlign: 'center',
        fontSize: 12,
        color: 'rgba(255,255,255,0.3)',
        fontWeight: 600,
      }}>
        Tap anywhere to close
      </div>
    </div>
  )
}

// ================================================================
// COMPONENTS — Translation Card
// ================================================================
function TranslationCard({ translation, onPlay, onCopy, onBookmark, onMerchant, isBookmarked, playbackRate }) {
  if (!translation) return null

  return (
    <div className="translation-card animate-slideUp">
      {/* Source */}
      <div style={{
        padding: '16px 20px 12px',
        borderBottom: '1.5px solid rgba(23,26,53,0.08)',
        background: 'rgba(23,26,53,0.02)',
      }}>
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', color: 'rgba(23,26,53,0.4)', marginBottom: 6, textTransform: 'uppercase' }}>
          English
        </div>
        <div style={{ fontSize: 16, fontWeight: 500, color: '#171A35', lineHeight: 1.5 }}>
          {translation.en}
        </div>
      </div>

      {/* Pinyin */}
      <div style={{ padding: '10px 20px 6px' }}>
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', color: 'rgba(83,101,245,0.6)', marginBottom: 4, textTransform: 'uppercase' }}>
          Pinyin
        </div>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#5365F5', lineHeight: 1.6, letterSpacing: '0.03em' }}>
          {translation.pinyin}
        </div>
      </div>

      {/* Chinese */}
      <div style={{ padding: '4px 20px 16px' }}>
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', color: 'rgba(23,26,53,0.4)', marginBottom: 6, textTransform: 'uppercase' }}>
          Mandarin
        </div>
        <div className="zh" style={{ fontSize: 28, fontWeight: 700, color: '#171A35', lineHeight: 1.4 }}>
          {translation.zh}
        </div>
      </div>

      {/* Action row */}
      <div style={{
        padding: '12px 16px',
        borderTop: '1.5px solid rgba(23,26,53,0.08)',
        display: 'flex',
        gap: 8,
        flexWrap: 'wrap',
      }}>
        <button className="action-btn primary" onClick={() => onPlay(translation.zh, playbackRate)} style={{ flex: 1, minWidth: 80 }}>
          <Volume2 size={15} />
          Play
        </button>
        <button className="action-btn" onClick={() => onCopy(translation.zh)}>
          <Copy size={15} />
          Copy
        </button>
        <button
          className="action-btn"
          onClick={onBookmark}
          style={isBookmarked ? { borderColor: '#F59E0B', color: '#F59E0B', background: '#FFFBEB' } : {}}
        >
          <Bookmark size={15} fill={isBookmarked ? '#F59E0B' : 'none'} />
        </button>
        <button className="action-btn lime" onClick={onMerchant} style={{ flex: 1, minWidth: 80 }}>
          <Maximize2 size={15} />
          Merchant View
        </button>
      </div>
    </div>
  )
}

// ================================================================
// TAB — Translate
// ================================================================
function TranslateTab({ settings }) {
  const [inputText, setInputText] = useState('')
  const [translation, setTranslation] = useState(null)
  const [recordState, setRecordState] = useState('idle') // idle | recording | processing
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [merchantOpen, setMerchantOpen] = useState(false)
  const [bookmarked, setBookmarked] = useState(false)
  const [toast, setToast] = useState(null)
  const [micPermission, setMicPermission] = useState('unknown') // unknown | granted | denied
  const [langMode, setLangMode] = useState('en-zh')
  const recognitionRef = useRef(null)
  const recordTimerRef = useRef(null)
  const toastTimerRef = useRef(null)

  const showToast = useCallback((msg) => {
    setToast(msg)
    clearTimeout(toastTimerRef.current)
    toastTimerRef.current = setTimeout(() => setToast(null), 2200)
  }, [])

  const handleTranslate = useCallback(async (text) => {
    if (!text.trim()) return
    setIsLoading(true)
    setError(null)
    setBookmarked(false)
    try {
      const result = await mockTranslate(text)
      const full = { en: text.trim(), ...result }
      setTranslation(full)
      // Persist to history
      const hist = loadHistory()
      const newItem = { id: `h${Date.now()}`, ...full, starred: false, ts: Date.now() }
      saveHistory([newItem, ...hist.slice(0, 49)])
    } catch {
      setError('Translation failed. Check your connection and try again.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const startRecording = useCallback(async () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      setError('Speech recognition not supported in this browser. Try Chrome.')
      return
    }
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true })
      setMicPermission('granted')
    } catch {
      setMicPermission('denied')
      setError('Microphone access denied. Please allow mic access in browser settings.')
      return
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const rec = new SpeechRecognition()
    rec.lang = langMode === 'en-zh' ? 'en-US' : 'zh-CN'
    rec.continuous = false
    rec.interimResults = false

    rec.onresult = (e) => {
      const transcript = e.results[0][0].transcript
      setInputText(transcript)
      setRecordState('processing')
      handleTranslate(transcript)
    }
    rec.onerror = () => {
      setRecordState('idle')
      // Simulate result for demo
      simulateVoiceDemo()
    }
    rec.onend = () => {
      if (recordState === 'recording') setRecordState('processing')
    }

    recognitionRef.current = rec
    rec.start()
    setRecordState('recording')

    // Auto-stop after 8s
    recordTimerRef.current = setTimeout(() => stopRecording(), 8000)
  }, [langMode, handleTranslate])

  const simulateVoiceDemo = useCallback(() => {
    const demos = SCENARIOS
    const pick = demos[Math.floor(Math.random() * demos.length)]
    setInputText(pick.en)
    setRecordState('processing')
    setTimeout(() => {
      setTranslation({ en: pick.en, zh: pick.zh, pinyin: pick.pinyin })
      setRecordState('idle')
      setIsLoading(false)
    }, 1200)
  }, [])

  const stopRecording = useCallback(() => {
    clearTimeout(recordTimerRef.current)
    recognitionRef.current?.stop()
    if (recordState === 'recording') setRecordState('processing')
  }, [recordState])

  const handleCopy = useCallback((text) => {
    navigator.clipboard?.writeText(text).then(() => showToast('Copied to clipboard!')).catch(() => showToast('Copy failed'))
  }, [showToast])

  const handleBookmark = useCallback(() => {
    setBookmarked(b => !b)
    if (!bookmarked) {
      showToast('Saved to bookmarks!')
      if (translation) {
        const hist = loadHistory()
        const updated = hist.map(h => h.zh === translation.zh ? { ...h, starred: true } : h)
        saveHistory(updated)
      }
    }
  }, [bookmarked, translation, showToast])

  const loadScenario = useCallback((s) => {
    setInputText(s.en)
    setIsLoading(true)
    setError(null)
    setTimeout(() => {
      setTranslation({ en: s.en, zh: s.zh, pinyin: s.pinyin })
      setIsLoading(false)
    }, 700)
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Error banner */}
      {error && (
        <div className="error-banner animate-slideUp">
          <AlertCircle size={16} />
          <span style={{ flex: 1 }}>{error}</span>
          <button
            onClick={() => { setError(null); if (inputText) handleTranslate(inputText) }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#991B1B', fontWeight: 700, fontSize: 12 }}
          >
            Retry
          </button>
          <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#991B1B' }}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* Language Toggle */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
        <div className="lang-toggle">
          <button
            className={`lang-toggle-btn ${langMode === 'en-zh' ? 'active' : ''}`}
            onClick={() => setLangMode('en-zh')}
          >
            🇬🇧 English
          </button>
          <button className="swap-btn" onClick={() => setLangMode(m => m === 'en-zh' ? 'zh-en' : 'en-zh')} title="Swap languages">
            <ArrowLeftRight size={13} color="var(--ink)" />
          </button>
          <button
            className={`lang-toggle-btn ${langMode === 'zh-en' ? 'active' : ''}`}
            onClick={() => setLangMode('zh-en')}
          >
            🇨🇳 中文
          </button>
        </div>
      </div>

      {/* Text Input */}
      <div style={{ position: 'relative' }}>
        <textarea
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          placeholder={langMode === 'en-zh' ? 'Type what you want to say in English…' : '输入您想说的中文…'}
          rows={3}
          style={{
            width: '100%',
            padding: '14px 16px',
            borderRadius: 16,
            border: '2px solid rgba(23,26,53,0.12)',
            background: 'white',
            fontSize: 15,
            fontFamily: 'inherit',
            color: '#171A35',
            resize: 'none',
            outline: 'none',
            transition: 'border-color 0.15s',
            lineHeight: 1.6,
            boxShadow: '0 1px 4px rgba(23,26,53,0.04)',
          }}
          onFocus={e => e.target.style.borderColor = 'var(--cobalt)'}
          onBlur={e => e.target.style.borderColor = 'rgba(23,26,53,0.12)'}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleTranslate(inputText) } }}
        />
        {inputText && (
          <button
            onClick={() => setInputText('')}
            style={{
              position: 'absolute', top: 10, right: 10,
              background: 'rgba(23,26,53,0.08)', border: 'none', borderRadius: '50%',
              width: 24, height: 24, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <X size={12} color="rgba(23,26,53,0.5)" />
          </button>
        )}
      </div>

      {/* Translate Button */}
      <button
        className="action-btn primary"
        onClick={() => handleTranslate(inputText)}
        disabled={isLoading || !inputText.trim()}
        style={{
          width: '100%', padding: '13px', fontSize: 15, borderRadius: 14,
          opacity: (!inputText.trim() || isLoading) ? 0.6 : 1,
        }}
      >
        {isLoading ? (
          <><RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} /> Translating…</>
        ) : (
          <><Languages size={16} /> Translate</>
        )}
      </button>

      {/* Loading skeleton */}
      {isLoading && !translation && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div className="skeleton" style={{ height: 24, width: '60%' }} />
          <div className="skeleton" style={{ height: 20, width: '80%' }} />
          <div className="skeleton" style={{ height: 44, width: '90%' }} />
        </div>
      )}

      {/* Translation Card */}
      {translation && !isLoading && (
        <TranslationCard
          translation={translation}
          onPlay={(text, rate) => speakText(text, 'zh-CN', rate)}
          onCopy={handleCopy}
          onBookmark={handleBookmark}
          onMerchant={() => setMerchantOpen(true)}
          isBookmarked={bookmarked}
          playbackRate={settings.speed}
        />
      )}

      {/* PTT Section */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 20,
        padding: '24px 20px',
        borderRadius: 20,
        border: '2px dashed rgba(23,26,53,0.12)',
        background: 'rgba(255,255,255,0.4)',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(23,26,53,0.5)', marginBottom: 2 }}>
            Voice Input
          </div>
          <div style={{ fontSize: 12, color: 'rgba(23,26,53,0.35)' }}>
            Hold the button and speak clearly
          </div>
        </div>
        <PTTButton
          state={recordState}
          onRecordStart={startRecording}
          onRecordStop={stopRecording}
        />
        {micPermission === 'denied' && (
          <div className="permission-prompt" style={{ width: '100%', padding: '12px 16px' }}>
            <Shield size={20} color="#DC2626" />
            <span style={{ fontSize: 13, fontWeight: 600, color: '#991B1B' }}>
              Microphone blocked. Enable in browser settings.
            </span>
          </div>
        )}
      </div>

      {/* Quick Scenario Chips */}
      <div>
        <div className="section-label" style={{ marginBottom: 10 }}>Quick Scenarios</div>
        <div className="chips-scroll">
          {SCENARIOS.map(s => (
            <button key={s.id} className="chip" onClick={() => loadScenario(s)}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Merchant Modal */}
      {merchantOpen && (
        <MerchantModal
          translation={translation}
          onClose={() => setMerchantOpen(false)}
        />
      )}

      {/* Toast */}
      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}

// ================================================================
// TAB — History
// ================================================================
function HistoryTab({ settings }) {
  const [history, setHistory] = useState(loadHistory)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [merchantItem, setMerchantItem] = useState(null)
  const [toast, setToast] = useState(null)
  const toastRef = useRef(null)

  const showToast = useCallback((msg) => {
    setToast(msg)
    clearTimeout(toastRef.current)
    toastRef.current = setTimeout(() => setToast(null), 2000)
  }, [])

  const filtered = history.filter(h => {
    const matchSearch = !search || h.en.toLowerCase().includes(search.toLowerCase()) || h.zh.includes(search)
    const matchFilter = filter === 'all' || (filter === 'starred' && h.starred)
    return matchSearch && matchFilter
  })

  const toggleStar = (id) => {
    const updated = history.map(h => h.id === id ? { ...h, starred: !h.starred } : h)
    setHistory(updated)
    saveHistory(updated)
  }

  const deleteItem = (id) => {
    const updated = history.filter(h => h.id !== id)
    setHistory(updated)
    saveHistory(updated)
    showToast('Deleted')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Search */}
      <div style={{ position: 'relative' }}>
        <Search size={16} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'rgba(23,26,53,0.35)' }} />
        <input
          className="search-input"
          type="text"
          placeholder="Search translations…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Filter chips */}
      <div style={{ display: 'flex', gap: 8 }}>
        {['all', 'starred'].map(f => (
          <button
            key={f}
            className={`chip ${filter === f ? 'active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f === 'starred' && <Star size={12} fill={filter === 'starred' ? 'white' : 'none'} />}
            {f === 'all' ? 'All' : 'Starred'}
          </button>
        ))}
        <div style={{ marginLeft: 'auto', fontSize: 12, color: 'rgba(23,26,53,0.4)', fontWeight: 600, alignSelf: 'center' }}>
          {filtered.length} items
        </div>
      </div>

      {/* Items */}
      {filtered.length === 0 ? (
        <div className="empty-state animate-fadeIn">
          <History size={40} color="rgba(23,26,53,0.15)" />
          <div style={{ fontSize: 16, fontWeight: 700, color: 'rgba(23,26,53,0.4)' }}>
            {search ? 'No results found' : 'No translations yet'}
          </div>
          <div style={{ fontSize: 13, color: 'rgba(23,26,53,0.3)' }}>
            {search ? 'Try a different search term' : 'Your translation history will appear here'}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map((item, i) => (
            <div
              key={item.id}
              className="history-card animate-slideUp"
              style={{ animationDelay: `${i * 0.04}s` }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, color: 'rgba(23,26,53,0.5)', marginBottom: 3, fontWeight: 500 }}>
                    {item.en}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#5365F5', marginBottom: 2 }}>
                    {item.pinyin}
                  </div>
                  <div className="zh" style={{ fontSize: 20, fontWeight: 700, color: '#171A35' }}>
                    {item.zh}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end', flexShrink: 0 }}>
                  <button onClick={() => toggleStar(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}>
                    <Star size={16} fill={item.starred ? '#F59E0B' : 'none'} color={item.starred ? '#F59E0B' : 'rgba(23,26,53,0.3)'} />
                  </button>
                  <span style={{ fontSize: 11, color: 'rgba(23,26,53,0.3)', fontWeight: 600 }}>
                    {timeAgo(item.ts)}
                  </span>
                </div>
              </div>
              {/* Offline badge if applicable */}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <button
                  className="action-btn"
                  style={{ padding: '5px 10px', fontSize: 12 }}
                  onClick={() => speakText(item.zh, 'zh-CN', settings.speed)}
                >
                  <Volume2 size={12} /> Play
                </button>
                <button
                  className="action-btn"
                  style={{ padding: '5px 10px', fontSize: 12 }}
                  onClick={() => setMerchantItem(item)}
                >
                  <Maximize2 size={12} /> Show
                </button>
                <button
                  className="action-btn"
                  style={{ padding: '5px 10px', fontSize: 12 }}
                  onClick={() => navigator.clipboard?.writeText(item.zh)}
                >
                  <Copy size={12} /> Copy
                </button>
                <button
                  onClick={() => deleteItem(item.id)}
                  style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: 'rgba(23,26,53,0.3)', fontWeight: 600 }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {merchantItem && (
        <MerchantModal translation={merchantItem} onClose={() => setMerchantItem(null)} />
      )}
      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}

// ================================================================
// TAB — Learn
// ================================================================
function LearnTab() {
  const [flipped, setFlipped] = useState({})
  const [streak] = useState(5)
  const [toneScore, setToneScore] = useState(null)
  const [toneActive, setToneActive] = useState(false)
  const [activeCard, setActiveCard] = useState(null)
  const toneRef = useRef(null)

  const toggleFlip = (id) => {
    setFlipped(f => ({ ...f, [id]: !f[id] }))
  }

  const startToneTest = () => {
    setToneActive(true)
    setToneScore(null)
    // Simulate scoring after 2s
    setTimeout(() => {
      const score = 60 + Math.floor(Math.random() * 40)
      setToneScore(score)
      setToneActive(false)
    }, 2200)
  }

  const getToneColor = (score) => {
    if (score >= 85) return '#22C55E'
    if (score >= 65) return '#F59E0B'
    return '#EF4444'
  }

  const getToneLabel = (score) => {
    if (score >= 85) return '🎉 Excellent tone!'
    if (score >= 65) return '👍 Good, keep practicing'
    return '🔁 Try again slowly'
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header streak + phase badge */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div className="streak-badge animate-streakGlow">
          🔥 {streak} Day Streak
        </div>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '6px 12px', borderRadius: 999,
          background: 'rgba(83,101,245,0.1)',
          border: '1.5px solid rgba(83,101,245,0.2)',
          fontSize: 11, fontWeight: 800, color: '#5365F5', letterSpacing: '0.08em',
        }}>
          <Sparkles size={12} />
          PHASE 2 PREVIEW
        </div>
      </div>

      {/* Progress stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        {[
          { icon: Trophy, label: 'XP Points', value: '1,240', color: '#F59E0B' },
          { icon: Target, label: 'Accuracy', value: '78%', color: '#22C55E' },
          { icon: TrendingUp, label: 'Phrases', value: '32', color: '#5365F5' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} style={{
            padding: '14px 12px',
            borderRadius: 14,
            border: '1.5px solid rgba(23,26,53,0.1)',
            background: 'white',
            textAlign: 'center',
          }}>
            <Icon size={18} color={color} style={{ marginBottom: 6 }} />
            <div style={{ fontSize: 18, fontWeight: 800, color: '#171A35' }}>{value}</div>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(23,26,53,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Scenario Flashcards */}
      <div>
        <div className="section-label" style={{ marginBottom: 12 }}>Scenario Flashcards</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {FLASHCARDS.map((card) => (
            <div key={card.id} className="flashcard-container">
              <div
                className={`flashcard-inner ${flipped[card.id] ? 'flipped' : ''}`}
                style={{ cursor: 'pointer' }}
                onClick={() => toggleFlip(card.id)}
              >
                {/* Front */}
                <div
                  className="flashcard-face"
                  style={{ background: card.color, boxShadow: '3px 3px 0 var(--ink)' }}
                >
                  <div style={{ fontSize: 36 }}>{card.emoji}</div>
                  <div style={{
                    fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase',
                    color: 'rgba(23,26,53,0.4)',
                    padding: '3px 10px', background: 'rgba(23,26,53,0.06)', borderRadius: 999,
                  }}>
                    {card.category}
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#171A35', textAlign: 'center' }}>
                    {card.front}
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(23,26,53,0.4)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <RotateCcw size={11} /> Tap to reveal
                  </div>
                </div>

                {/* Back */}
                <div
                  className="flashcard-face flashcard-back"
                  style={{ background: '#171A35', boxShadow: '3px 3px 0 var(--cobalt)' }}
                >
                  <div className="zh" style={{ fontSize: 28, fontWeight: 700, color: '#FFDD44', textAlign: 'center' }}>
                    {card.back_zh}
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#5365F5', letterSpacing: '0.03em' }}>
                    {card.back_pinyin}
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', textAlign: 'center', lineHeight: 1.6 }}>
                    {card.tip}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      className="action-btn"
                      style={{ background: 'rgba(255,255,255,0.1)', border: '1.5px solid rgba(255,255,255,0.2)', color: 'white', fontSize: 12 }}
                      onClick={(e) => { e.stopPropagation(); speakText(card.back_zh, 'zh-CN', 1.0) }}
                    >
                      <Volume2 size={13} /> Play
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pronunciation Tester */}
      <div style={{
        border: '2px solid var(--ink)',
        borderRadius: 20,
        background: 'white',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        boxShadow: '4px 4px 0 var(--ink)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#171A35' }}>Pronunciation Tester</div>
            <div style={{ fontSize: 12, color: 'rgba(23,26,53,0.45)', marginTop: 2 }}>
              Read aloud and check your tone accuracy
            </div>
          </div>
          <Mic size={20} color="var(--cobalt)" />
        </div>

        {/* Target phrase */}
        <div style={{
          padding: '14px 16px',
          borderRadius: 12,
          background: 'rgba(83,101,245,0.06)',
          border: '1.5px solid rgba(83,101,245,0.15)',
          textAlign: 'center',
        }}>
          <div className="zh" style={{ fontSize: 24, fontWeight: 700, color: '#171A35', marginBottom: 6 }}>
            你好，请问
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#5365F5' }}>
            Nǐ hǎo, qǐngwèn
          </div>
        </div>

        {/* Tone meter */}
        {toneScore !== null && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="tone-label">Tone Accuracy</span>
              <span style={{ fontSize: 20, fontWeight: 800, color: getToneColor(toneScore) }}>{toneScore}%</span>
            </div>
            <div className="tone-meter">
              <div
                className="tone-meter-fill"
                style={{ width: `${toneScore}%`, background: getToneColor(toneScore) }}
              />
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(23,26,53,0.6)', textAlign: 'center' }}>
              {getToneLabel(toneScore)}
            </div>
          </div>
        )}

        <button
          className={`action-btn ${toneActive ? 'recording' : 'primary'}`}
          onClick={startToneTest}
          disabled={toneActive}
          style={{
            width: '100%', padding: '12px',
            background: toneActive ? '#E63946' : undefined,
            color: toneActive ? 'white' : undefined,
            border: toneActive ? 'none' : undefined,
          }}
        >
          {toneActive ? (
            <><Square size={14} fill="white" /> Recording…</>
          ) : (
            <><Mic size={15} /> Test My Pronunciation</>
          )}
        </button>
      </div>
    </div>
  )
}

// ================================================================
// TAB — Settings
// ================================================================
function SettingsTab({ settings, onSettingsChange }) {
  const speedOptions = [0.8, 1.0, 1.2]
  const gateways = [
    { id: 'tencent', name: 'Tencent Cloud ASR', desc: 'Optimised for mainland China (< 200ms)', icon: Zap },
    { id: 'baidu', name: 'Baidu Speech API', desc: 'High accuracy Mandarin recognition', icon: Globe },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Playback Speed */}
      <div style={{
        background: 'white',
        border: '1.5px solid rgba(23,26,53,0.1)',
        borderRadius: 18,
        padding: '20px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(41,55,200,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Volume2 size={18} color="var(--cobalt)" />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#171A35' }}>Speech Playback Speed</div>
            <div style={{ fontSize: 12, color: 'rgba(23,26,53,0.45)' }}>Adjust TTS voice speed</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {speedOptions.map(s => (
            <button
              key={s}
              onClick={() => onSettingsChange({ ...settings, speed: s })}
              style={{
                flex: 1, padding: '10px', borderRadius: 10,
                border: `2px solid ${settings.speed === s ? 'var(--cobalt)' : 'rgba(23,26,53,0.12)'}`,
                background: settings.speed === s ? 'var(--cobalt)' : 'white',
                color: settings.speed === s ? 'white' : '#171A35',
                fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit',
                transition: 'all 0.15s',
              }}
            >
              {s}×
            </button>
          ))}
        </div>
        <input
          type="range"
          min="0.5"
          max="1.5"
          step="0.1"
          value={settings.speed}
          onChange={e => onSettingsChange({ ...settings, speed: parseFloat(e.target.value) })}
          style={{ width: '100%' }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 11, color: 'rgba(23,26,53,0.4)', fontWeight: 600 }}>
          <span>0.5× Slow</span>
          <span style={{ color: 'var(--cobalt)', fontWeight: 800 }}>{settings.speed}× Current</span>
          <span>1.5× Fast</span>
        </div>
      </div>

      {/* Gateway Routing */}
      <div style={{
        background: 'white',
        border: '1.5px solid rgba(23,26,53,0.1)',
        borderRadius: 18,
        padding: '20px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(199,243,107,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Zap size={18} color="var(--ink)" />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#171A35' }}>AI Gateway Routing</div>
            <div style={{ fontSize: 12, color: 'rgba(23,26,53,0.45)' }}>Select speech recognition provider</div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {gateways.map(({ id, name, desc, icon: Icon }) => (
            <button
              key={id}
              className={`gateway-option ${settings.gateway === id ? 'selected' : ''}`}
              onClick={() => onSettingsChange({ ...settings, gateway: id })}
            >
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: settings.gateway === id ? 'rgba(41,55,200,0.1)' : 'rgba(23,26,53,0.05)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon size={16} color={settings.gateway === id ? 'var(--cobalt)' : 'rgba(23,26,53,0.5)'} />
              </div>
              <div style={{ flex: 1, textAlign: 'left' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: settings.gateway === id ? 'var(--cobalt)' : '#171A35' }}>{name}</div>
                <div style={{ fontSize: 11, color: 'rgba(23,26,53,0.45)', marginTop: 1 }}>{desc}</div>
              </div>
              {settings.gateway === id && (
                <CheckCircle2 size={16} color="var(--cobalt)" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Phone Frame Toggle */}
      <div style={{
        background: 'white',
        border: '1.5px solid rgba(23,26,53,0.1)',
        borderRadius: 18,
        padding: '20px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(23,26,53,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FlipHorizontal2 size={18} color="var(--ink)" />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#171A35' }}>Device Frame Preview</div>
              <div style={{ fontSize: 12, color: 'rgba(23,26,53,0.45)' }}>Show mobile phone frame border</div>
            </div>
          </div>
          {/* Toggle switch */}
          <button
            onClick={() => onSettingsChange({ ...settings, phoneFrame: !settings.phoneFrame })}
            style={{
              width: 48, height: 28, borderRadius: 999,
              background: settings.phoneFrame ? 'var(--cobalt)' : 'rgba(23,26,53,0.15)',
              border: 'none', cursor: 'pointer', position: 'relative',
              transition: 'background 0.2s',
            }}
            aria-label="Toggle phone frame"
          >
            <div style={{
              position: 'absolute',
              top: 3, left: settings.phoneFrame ? 23 : 3,
              width: 22, height: 22,
              borderRadius: '50%',
              background: 'white',
              boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
              transition: 'left 0.2s cubic-bezier(0.34,1.56,0.64,1)',
            }} />
          </button>
        </div>
      </div>

      {/* App info */}
      <div style={{
        background: 'rgba(23,26,53,0.03)',
        borderRadius: 16,
        padding: '16px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Shield size={14} color="rgba(23,26,53,0.4)" />
          <span style={{ fontSize: 12, color: 'rgba(23,26,53,0.5)', fontWeight: 600 }}>Privacy: All voice data processed locally</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Info size={14} color="rgba(23,26,53,0.4)" />
          <span style={{ fontSize: 12, color: 'rgba(23,26,53,0.5)', fontWeight: 600 }}>YupBuddy v1.0.0 · Built for China expats</span>
        </div>
      </div>
    </div>
  )
}

// ================================================================
// MAIN APP
// ================================================================
const TABS = [
  { id: 'translate', label: 'Translate', Icon: Languages },
  { id: 'history', label: 'History', Icon: History },
  { id: 'learn', label: 'Learn', Icon: BookOpen },
  { id: 'settings', label: 'Settings', Icon: Settings },
]

export default function App() {
  const [activeTab, setActiveTab] = useState('translate')
  const [settings, setSettings] = useState(loadSettings)
  const [ping, setPing] = useState(142)
  const [online, setOnline] = useState(navigator.onLine)

  // Persist settings
  useEffect(() => { saveSettings(settings) }, [settings])

  // Simulate ping fluctuation
  useEffect(() => {
    const interval = setInterval(() => {
      setPing(120 + Math.floor(Math.random() * 180))
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  // Network status
  useEffect(() => {
    const on = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off) }
  }, [])

  // Add global spin keyframe via style tag once
  useEffect(() => {
    if (document.getElementById('yb-spin')) return
    const style = document.createElement('style')
    style.id = 'yb-spin'
    style.textContent = '@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }'
    document.head.appendChild(style)
  }, [])

  const inner = (
    <div className="app-container">
      {/* ── Header ── */}
      <header style={{
        padding: '14px 20px 10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1.5px solid rgba(23,26,53,0.08)',
        background: 'var(--canvas)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backdropFilter: 'blur(12px)',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10,
            background: 'var(--cobalt)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '2px 2px 0 rgba(23,26,53,0.4)',
          }}>
            <span style={{ fontSize: 18 }}>🀄</span>
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 900, color: '#171A35', letterSpacing: '-0.02em', lineHeight: 1 }}>
              YupBuddy
            </div>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(23,26,53,0.4)', letterSpacing: '0.08em' }}>
              CHINA COMPANION
            </div>
          </div>
        </div>

        {/* Right side — gateway + offline indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {!online && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '4px 10px', borderRadius: 999,
              background: '#FEE2E2', border: '1.5px solid #FECACA',
              fontSize: 11, fontWeight: 700, color: '#DC2626',
            }}>
              <WifiOff size={12} /> Offline
            </div>
          )}
          <GatewayBadge gateway={settings.gateway} ping={ping} />
        </div>
      </header>

      {/* ── Tab Content ── */}
      <main style={{ flex: 1, overflowY: 'auto', padding: '18px 16px 100px' }}>
        {activeTab === 'translate' && <TranslateTab settings={settings} />}
        {activeTab === 'history' && <HistoryTab settings={settings} />}
        {activeTab === 'learn' && <LearnTab />}
        {activeTab === 'settings' && (
          <SettingsTab settings={settings} onSettingsChange={(s) => setSettings(s)} />
        )}
      </main>

      {/* ── Bottom Nav ── */}
      <nav style={{
        position: 'fixed',
        bottom: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: 430,
        padding: '8px 12px 12px',
        background: 'rgba(255, 241, 232, 0.92)',
        borderTop: '1.5px solid rgba(23,26,53,0.1)',
        backdropFilter: 'blur(16px)',
        display: 'flex',
        justifyContent: 'space-around',
        zIndex: 200,
      }}>
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            className={`nav-tab ${activeTab === id ? 'active' : ''}`}
            onClick={() => setActiveTab(id)}
          >
            <Icon size={20} />
            {label}
          </button>
        ))}
      </nav>
    </div>
  )

  return settings.phoneFrame ? (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#E8EAF6',
      padding: '24px',
    }}>
      <div
        className="phone-frame"
        style={{ width: 390, height: 844, overflowY: 'hidden', position: 'relative' }}
      >
        {inner}
      </div>
    </div>
  ) : inner
}
