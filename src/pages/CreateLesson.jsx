import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, FileText, Youtube, Headphones, Sparkles, Plus, Trash2, ChevronRight } from 'lucide-react'
import useAppStore from '../store/useAppStore'
import { extractYouTubeId } from '../data/lessons'
import OpenAI from 'openai'
import BottomNav from '../components/BottomNav'

const CONTENT_TYPES = [
  { id: 'text',  icon: FileText,   label: 'Paste Text',     desc: 'Article, news, any text'     },
  { id: 'video', icon: Youtube,    label: 'YouTube Video',  desc: 'YouTube link to watch'        },
  { id: 'audio', icon: Headphones, label: 'Audio URL',      desc: 'Podcast or audio file link'   },
]

const LEVELS   = ['beginner', 'intermediate', 'advanced']
const LEVEL_LABEL = { beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced' }
const LEVEL_COLOR = {
  beginner:     'border-emerald-500/50 bg-emerald-500/10 text-emerald-400',
  intermediate: 'border-amber-500/50   bg-amber-500/10   text-amber-400',
  advanced:     'border-rose-500/50    bg-rose-500/10    text-rose-400',
}

const CATEGORIES = ['Daily Life', 'Science', 'Business', 'Culture', 'Technology', 'Health', 'Society', 'Education', 'Travel', 'Environment']

export default function CreateLesson() {
  const navigate         = useNavigate()
  const { addCustomLesson, openaiKey, isPremium } = useAppStore()

  useEffect(() => {
    if (!isPremium) navigate('/pricing', { replace: true })
  }, [isPremium])

  const [step, setStep]                 = useState(1)
  const [contentType, setContentType]   = useState('text')
  const [textContent, setTextContent]   = useState('')
  const [mediaUrl, setMediaUrl]         = useState('')
  const [title, setTitle]               = useState('')
  const [category, setCategory]         = useState('Daily Life')
  const [level, setLevel]               = useState('intermediate')
  const [keyPoints, setKeyPoints]       = useState(['', '', ''])
  const [generating, setGenerating]     = useState(false)
  const [error, setError]               = useState('')

  const contentOk = contentType === 'text' ? textContent.trim().length > 50
                  : contentType === 'video' ? !!extractYouTubeId(mediaUrl)
                  : mediaUrl.trim().startsWith('http')

  const metaOk = title.trim().length >= 3 && keyPoints.some((kp) => kp.trim())

  const generateKeyPoints = async () => {
    if (!openaiKey) { setError('Add your OpenAI API key in Profile first.'); return }
    const source = contentType === 'text' ? textContent : `This is a ${contentType} about: ${title}`
    setGenerating(true)
    setError('')
    try {
      const client = new OpenAI({ apiKey: openaiKey, dangerouslyAllowBrowser: true })
      const res = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{
          role: 'user',
          content: `Extract exactly 5 key points from this content that a language learner should understand and be able to explain.
Return as a JSON object: { "title": "...", "keyPoints": ["...", "...", "...", "...", "..."] }

Content: ${source.slice(0, 2000)}`,
        }],
        response_format: { type: 'json_object' },
        temperature: 0.3,
      })
      const data = JSON.parse(res.choices[0].message.content)
      if (data.keyPoints) setKeyPoints(data.keyPoints)
      if (data.title && !title.trim()) setTitle(data.title)
    } catch {
      setError('Failed to generate. Check your API key.')
    } finally {
      setGenerating(false)
    }
  }

  const handleSave = () => {
    if (!title.trim() || !contentOk) return
    const lesson = {
      type:            contentType,
      title:           title.trim(),
      category,
      level,
      icon:            contentType === 'video' ? '🎥' : contentType === 'audio' ? '🎧' : '📄',
      estimatedMinutes: 20,
      content:         contentType === 'text' ? textContent.trim() : `${contentType === 'video' ? 'Watch' : 'Listen to'} this ${contentType} about "${title}".`,
      videoUrl:        contentType === 'video' ? mediaUrl.trim() : undefined,
      audioUrl:        contentType === 'audio' ? mediaUrl.trim() : undefined,
      keyPoints:       keyPoints.filter((kp) => kp.trim()),
      vocabulary:      [],
    }
    const id = addCustomLesson(lesson)
    navigate(`/lesson/${id}`)
  }

  return (
    <div className="app-shell flex flex-col min-h-screen bg-app-bg pb-48">
      {/* Header */}
      <div className="flex items-center gap-4 px-6 pt-12 pb-4">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-app-card flex items-center justify-center">
          <ArrowLeft size={18} className="text-gray-400" />
        </button>
        <div className="flex-1">
          <h1 className="text-slate-800 font-bold text-lg">Create Lesson</h1>
          <p className="text-gray-500 text-xs">Step {step} of 3</p>
        </div>
      </div>

      {/* Progress */}
      <div className="px-6 mb-6">
        <div className="h-1.5 bg-app-border rounded-full overflow-hidden">
          <motion.div
            className="h-full gradient-primary rounded-full"
            animate={{ width: `${(step / 3) * 100}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
      </div>

      <div className="flex-1 px-6 overflow-y-auto">
        <AnimatePresence mode="wait">

          {/* ── STEP 1: Content Type + Content ─────────────────── */}
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-5">
              <div>
                <h2 className="text-slate-800 font-bold text-xl mb-1">What's your content?</h2>
                <p className="text-gray-400 text-sm">Choose the source type and add your content.</p>
              </div>

              {/* Type selector */}
              <div className="space-y-2">
                {CONTENT_TYPES.map(({ id, icon: Icon, label, desc }) => (
                  <button
                    key={id}
                    onClick={() => setContentType(id)}
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all text-left ${
                      contentType === id
                        ? 'border-blue-500/50 bg-blue-500/10'
                        : 'border-app-border bg-app-card'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      contentType === id ? 'gradient-primary' : 'bg-app-surface'
                    }`}>
                      <Icon size={20} className={contentType === id ? 'text-slate-800' : 'text-gray-500'} />
                    </div>
                    <div>
                      <p className={`font-semibold text-sm ${contentType === id ? 'text-slate-800' : 'text-gray-400'}`}>{label}</p>
                      <p className="text-gray-500 text-xs">{desc}</p>
                    </div>
                    {contentType === id && <div className="ml-auto w-4 h-4 rounded-full gradient-primary" />}
                  </button>
                ))}
              </div>

              {/* Content input */}
              {contentType === 'text' && (
                <div>
                  <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2 block">Your Text</label>
                  <textarea
                    rows={8}
                    value={textContent}
                    onChange={(e) => setTextContent(e.target.value)}
                    placeholder="Paste any article, news, story, or text in English (min. 50 characters)..."
                    className="w-full bg-app-card border border-app-border rounded-2xl px-4 py-3 text-gray-700 text-sm placeholder-gray-600 resize-none focus:border-blue-500/60 transition-colors"
                  />
                  <p className="text-gray-600 text-xs mt-1 text-right">{textContent.length} chars</p>
                </div>
              )}

              {(contentType === 'video' || contentType === 'audio') && (
                <div>
                  <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2 block">
                    {contentType === 'video' ? 'YouTube URL' : 'Audio URL'}
                  </label>
                  <input
                    type="url"
                    value={mediaUrl}
                    onChange={(e) => setMediaUrl(e.target.value)}
                    placeholder={contentType === 'video' ? 'https://www.youtube.com/watch?v=...' : 'https://example.com/audio.mp3'}
                    className="w-full bg-app-card border border-app-border rounded-2xl px-4 py-3 text-gray-700 text-sm placeholder-gray-600 focus:border-blue-500/60 transition-colors"
                  />
                  {contentType === 'video' && mediaUrl && !extractYouTubeId(mediaUrl) && (
                    <p className="text-rose-400 text-xs mt-1">Invalid YouTube URL</p>
                  )}
                  {contentType === 'video' && extractYouTubeId(mediaUrl) && (
                    <div className="mt-3 rounded-xl overflow-hidden border border-app-border" style={{ aspectRatio: '16/9' }}>
                      <iframe
                        src={`https://www.youtube.com/embed/${extractYouTubeId(mediaUrl)}?rel=0`}
                        className="w-full h-full"
                        allowFullScreen
                      />
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={() => setStep(2)}
                disabled={!contentOk}
                className={`w-full py-4 rounded-2xl font-semibold text-lg transition-all ${
                  contentOk ? 'gradient-primary text-white glow-purple' : 'bg-app-card border border-app-border text-gray-600 cursor-not-allowed'
                }`}
              >
                Next →
              </button>
            </motion.div>
          )}

          {/* ── STEP 2: Title, Category, Level ─────────────────── */}
          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-5">
              <div>
                <h2 className="text-slate-800 font-bold text-xl mb-1">Lesson Details</h2>
                <p className="text-gray-400 text-sm">Give it a name and category.</p>
              </div>

              <div>
                <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2 block">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. The Rise of Electric Cars"
                  className="w-full bg-app-card border border-app-border rounded-2xl px-4 py-3 text-gray-700 text-sm placeholder-gray-600 focus:border-blue-500/60 transition-colors"
                />
              </div>

              <div>
                <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2 block">Category</label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setCategory(cat)}
                      className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
                        category === cat
                          ? 'gradient-primary text-white border-transparent'
                          : 'border-app-border bg-app-card text-gray-400'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2 block">Level</label>
                <div className="flex gap-2">
                  {LEVELS.map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => setLevel(lvl)}
                      className={`flex-1 py-3 rounded-2xl border text-sm font-semibold transition-all ${
                        level === lvl ? LEVEL_COLOR[lvl] : 'border-app-border bg-app-card text-gray-500'
                      }`}
                    >
                      {LEVEL_LABEL[lvl]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="flex-1 py-4 rounded-2xl bg-app-card border border-app-border text-gray-600 font-medium">
                  ← Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={!title.trim()}
                  className={`flex-1 py-4 rounded-2xl font-semibold transition-all ${
                    title.trim() ? 'gradient-primary text-white glow-purple' : 'bg-app-card border border-app-border text-gray-600 cursor-not-allowed'
                  }`}
                >
                  Next →
                </button>
              </div>
            </motion.div>
          )}

          {/* ── STEP 3: Key Points ─────────────────────────────── */}
          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-5">
              <div>
                <h2 className="text-slate-800 font-bold text-xl mb-1">Key Points</h2>
                <p className="text-gray-400 text-sm">What should the learner understand? AI can help.</p>
              </div>

              {error && (
                <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3">
                  <p className="text-rose-400 text-sm">{error}</p>
                </div>
              )}

              <button
                onClick={generateKeyPoints}
                disabled={generating}
                className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border font-semibold text-sm transition-all ${
                  generating
                    ? 'border-app-border bg-app-card text-gray-500 cursor-not-allowed'
                    : 'border-blue-500/40 bg-blue-500/10 text-blue-300 hover:bg-blue-500/20'
                }`}
              >
                {generating ? (
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                    <Sparkles size={16} />
                  </motion.div>
                ) : (
                  <Sparkles size={16} />
                )}
                {generating ? 'Generating with AI...' : '✨ Generate with AI'}
              </button>

              <div className="space-y-2">
                {keyPoints.map((kp, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full gradient-primary flex items-center justify-center flex-shrink-0">
                      <span className="text-slate-800 text-xs font-bold">{i + 1}</span>
                    </div>
                    <input
                      type="text"
                      value={kp}
                      onChange={(e) => {
                        const updated = [...keyPoints]
                        updated[i] = e.target.value
                        setKeyPoints(updated)
                      }}
                      placeholder={`Key point ${i + 1}...`}
                      className="flex-1 bg-app-card border border-app-border rounded-xl px-3 py-2.5 text-gray-700 text-sm placeholder-gray-600 focus:border-blue-500/60 transition-colors"
                    />
                    {keyPoints.length > 2 && (
                      <button onClick={() => setKeyPoints(keyPoints.filter((_, j) => j !== i))}>
                        <Trash2 size={15} className="text-gray-600 hover:text-rose-400 transition-colors" />
                      </button>
                    )}
                  </div>
                ))}
                {keyPoints.length < 7 && (
                  <button
                    onClick={() => setKeyPoints([...keyPoints, ''])}
                    className="flex items-center gap-2 text-gray-500 text-sm px-2 py-1"
                  >
                    <Plus size={14} /> Add key point
                  </button>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={() => setStep(2)} className="flex-1 py-4 rounded-2xl bg-app-card border border-app-border text-gray-600 font-medium">
                  ← Back
                </button>
                <button
                  onClick={handleSave}
                  disabled={!metaOk}
                  className={`flex-1 py-4 rounded-2xl font-semibold flex items-center justify-center gap-2 transition-all ${
                    metaOk ? 'gradient-primary text-white glow-purple' : 'bg-app-card border border-app-border text-gray-600 cursor-not-allowed'
                  }`}
                >
                  Start Lesson <ChevronRight size={18} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <BottomNav />
    </div>
  )
}
