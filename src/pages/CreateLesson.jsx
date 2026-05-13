import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowLeft, FileText, Youtube, Headphones, Sparkles, Plus, Trash2, ChevronRight,
  BookOpen, Lightbulb, MessageCircle, Plane, Briefcase, Utensils, Users, Globe,
  ShoppingCart, Heart, Star, Clock, Target, Zap, Copy, Check, RefreshCw
} from 'lucide-react'
import useAppStore from '../store/useAppStore'
import { extractYouTubeId } from '../data/lessons'
import OpenAI from 'openai'
import BottomNav from '../components/BottomNav'

const CONTENT_TYPES = [
  { id: 'text',  icon: FileText,   label: 'Paste Text',     desc: 'Article, news, any text'     },
  { id: 'video', icon: Youtube,    label: 'YouTube Video',  desc: 'YouTube link to watch'        },
  { id: 'audio', icon: Headphones, label: 'Audio URL',      desc: 'Podcast or audio file link'   },
  { id: 'template', icon: Lightbulb, label: 'Use Template', desc: 'Pre-made lesson starters'  },
]

const LEVELS   = ['beginner', 'intermediate', 'advanced']
const LEVEL_LABEL = { beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced' }
const LEVEL_COLOR = {
  beginner:     'border-emerald-500/50 bg-emerald-500/10 text-emerald-400',
  intermediate: 'border-amber-500/50   bg-amber-500/10   text-amber-400',
  advanced:     'border-rose-500/50    bg-rose-500/10    text-rose-400',
}

const SUB_LEVELS = ['a1', 'a2', 'a3', 'b1', 'b2', 'b3', 'c1', 'c2', 'c3']
const SUB_LEVEL_LABELS = { a1: 'A1', a2: 'A2', a3: 'A3', b1: 'B1', b2: 'B2', b3: 'B3', c1: 'C1', c2: 'C2', c3: 'C3' }
const SUB_LEVEL_MAP = {
  beginner: ['a1', 'a2', 'a3'],
  intermediate: ['b1', 'b2', 'b3'],
  advanced: ['c1', 'c2', 'c3']
}

const CATEGORIES = [
  { id: 'Daily Life', icon: Clock, color: 'blue' },
  { id: 'Travel', icon: Plane, color: 'cyan' },
  { id: 'Business', icon: Briefcase, color: 'indigo' },
  { id: 'Social', icon: Users, color: 'pink' },
  { id: 'Food', icon: Utensils, color: 'orange' },
  { id: 'Shopping', icon: ShoppingCart, color: 'emerald' },
  { id: 'Health', icon: Heart, color: 'rose' },
  { id: 'Science', icon: Star, color: 'violet' },
  { id: 'Technology', icon: Zap, color: 'amber' },
  { id: 'Society', icon: Globe, color: 'teal' },
  { id: 'Culture', icon: BookOpen, color: 'purple' },
  { id: 'Education', icon: Target, color: 'lime' },
]

const TEMPLATES = {
  'Daily Life': [
    { title: 'Morning Routine', prompt: 'Write about a typical morning routine including waking up, breakfast, and commute.' },
    { title: 'Shopping Trip', prompt: 'Describe a shopping experience at a supermarket or mall.' },
    { title: 'Weekend Plans', prompt: 'Write about planning and enjoying a weekend activity.' },
  ],
  'Travel': [
    { title: 'At the Airport', prompt: 'Describe navigating an airport, check-in, and boarding.' },
    { title: 'Hotel Check-in', prompt: 'Write a dialogue about checking into a hotel.' },
    { title: 'Asking for Directions', prompt: 'Write about getting lost and asking for help in a new city.' },
  ],
  'Business': [
    { title: 'Job Interview', prompt: 'Write a dialogue for a professional job interview.' },
    { title: 'Office Meeting', prompt: 'Describe an effective business meeting scenario.' },
    { title: 'Email Writing', prompt: 'Write tips for writing professional business emails.' },
  ],
  'Social': [
    { title: 'Making Friends', prompt: 'Describe how to start and maintain a conversation with someone new.' },
    { title: 'Party Invitation', prompt: 'Write about inviting friends to a social gathering.' },
    { title: 'Giving Advice', prompt: 'Describe a situation where you give helpful advice to a friend.' },
  ],
  'Food': [
    { title: 'Ordering at a Restaurant', prompt: 'Write a dialogue between a customer and waiter at a restaurant.' },
    { title: 'Cooking at Home', prompt: 'Describe the process of preparing a simple meal.' },
    { title: 'Coffee Culture', prompt: 'Write about coffee shop culture and ordering drinks.' },
  ],
  'Shopping': [
    { title: 'Buying Clothes', prompt: 'Describe shopping for clothes including asking for sizes and trying on.' },
    { title: 'Price Negotiation', prompt: 'Write about negotiating prices at a market.' },
    { title: 'Online Shopping', prompt: 'Describe the experience of buying something online.' },
  ],
  'Health': [
    { title: 'Doctor Visit', prompt: 'Write a dialogue between a patient and doctor describing symptoms.' },
    { title: 'Exercise Routine', prompt: 'Describe a weekly exercise routine and its benefits.' },
    { title: 'Healthy Eating', prompt: 'Write about making healthy food choices and reading nutrition labels.' },
  ],
}

export default function CreateLesson() {
  const navigate         = useNavigate()
  const { addCustomLesson, openaiKey, isPremium, checkAndIncrementAI } = useAppStore()

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
  const [subLevel, setSubLevel]         = useState('b1')
  const [keyPoints, setKeyPoints]       = useState(['', '', ''])
  const [vocabulary, setVocabulary]     = useState(['', '', ''])
  const [generating, setGenerating]     = useState(false)
  const [error, setError]               = useState('')
  const [estimatedMinutes, setEstimatedMinutes] = useState(15)
  const [showPreview, setShowPreview]   = useState(false)
  const [copiedTemplate, setCopiedTemplate] = useState(null)

  const contentOk = contentType === 'text' ? textContent.trim().length > 50
                  : contentType === 'video' ? !!extractYouTubeId(mediaUrl)
                  : contentType === 'audio' ? mediaUrl.trim().startsWith('http')
                  : contentType === 'template' ? textContent.trim().length > 20
                  : false

  const metaOk = title.trim().length >= 3 && keyPoints.some((kp) => kp.trim())

  // Update subLevel when level changes
  useEffect(() => {
    const validSubLevels = SUB_LEVEL_MAP[level]
    if (!validSubLevels.includes(subLevel)) {
      setSubLevel(validSubLevels[0])
    }
  }, [level, subLevel])

  const applyTemplate = useCallback((template) => {
    setTextContent(template.prompt)
    setTitle(template.title)
    setCopiedTemplate(template.title)
    setTimeout(() => setCopiedTemplate(null), 2000)
  }, [])

  const generateKeyPoints = async () => {
    if (!openaiKey) { setError('Add your OpenAI API key in Profile first.'); return }
    if (!checkAndIncrementAI()) { setError('Daily AI limit reached. Upgrade to Premium for unlimited access.'); return }
    
    const source = (contentType === 'text' || contentType === 'template') ? textContent 
                  : `This is a ${contentType} about: ${title}`
    setGenerating(true)
    setError('')
    try {
      const client = new OpenAI({ apiKey: openaiKey, dangerouslyAllowBrowser: true })
      const res = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{
          role: 'user',
          content: `Extract exactly 5 key points and 5 vocabulary words from this content that a ${level} English language learner (${subLevel}) should learn.
Return as a JSON object: { 
  "title": "...", 
  "keyPoints": ["...", "...", "...", "...", "..."],
  "vocabulary": ["...", "...", "...", "...", "..."]
}

Content: ${source.slice(0, 2000)}`,
        }],
        response_format: { type: 'json_object' },
        temperature: 0.3,
      })
      const data = JSON.parse(res.choices[0].message.content)
      if (data.keyPoints) setKeyPoints(data.keyPoints)
      if (data.vocabulary) setVocabulary(data.vocabulary.slice(0, 5))
      if (data.title && !title.trim()) setTitle(data.title)
    } catch {
      setError('Failed to generate. Check your API key and try again.')
    } finally {
      setGenerating(false)
    }
  }

  const regenerateContent = async () => {
    if (!openaiKey) { setError('Add your OpenAI API key in Profile first.'); return }
    if (!checkAndIncrementAI()) { setError('Daily AI limit reached.'); return }
    
    setGenerating(true)
    setError('')
    try {
      const client = new OpenAI({ apiKey: openaiKey, dangerouslyAllowBrowser: true })
      const res = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{
          role: 'user',
          content: `Write a ${level} level (${subLevel}) English lesson about "${title}" for the "${category}" category.
The lesson should be approximately ${estimatedMinutes * 20} words, suitable for a ${estimatedMinutes}-minute study session.
Return as JSON: { "content": "...", "estimatedMinutes": ${estimatedMinutes} }`,
        }],
        response_format: { type: 'json_object' },
        temperature: 0.7,
      })
      const data = JSON.parse(res.choices[0].message.content)
      if (data.content) setTextContent(data.content)
    } catch {
      setError('Failed to generate content. Check your API key.')
    } finally {
      setGenerating(false)
    }
  }

  const handleSave = () => {
    if (!title.trim() || !contentOk) return
    const lesson = {
      type:            contentType === 'template' ? 'text' : contentType,
      title:           title.trim(),
      category,
      level,
      subLevel,
      icon:            contentType === 'video' ? '🎥' : contentType === 'audio' ? '🎧' : contentType === 'template' ? '�' : '�',
      estimatedMinutes,
      content:         (contentType === 'text' || contentType === 'template') ? textContent.trim() 
                      : `${contentType === 'video' ? 'Watch' : 'Listen to'} this ${contentType} about "${title}".`,
      videoUrl:        contentType === 'video' ? mediaUrl.trim() : undefined,
      audioUrl:        contentType === 'audio' ? mediaUrl.trim() : undefined,
      keyPoints:       keyPoints.filter((kp) => kp.trim()),
      vocabulary:      vocabulary.filter((v) => v.trim()),
    }
    const id = addCustomLesson(lesson)
    navigate(`/lesson/${id}`)
  }

  const estimatedWords = Math.round(estimatedMinutes * 20)

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
              <div className="grid grid-cols-2 gap-2">
                {CONTENT_TYPES.map(({ id, icon: Icon, label, desc }) => (
                  <button
                    key={id}
                    onClick={() => setContentType(id)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all text-center ${
                      contentType === id
                        ? 'border-blue-500/50 bg-blue-500/10'
                        : 'border-app-border bg-app-card'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      contentType === id ? 'gradient-primary' : 'bg-app-surface'
                    }`}>
                      <Icon size={20} className={contentType === id ? 'text-slate-800' : 'text-gray-500'} />
                    </div>
                    <div>
                      <p className={`font-semibold text-sm ${contentType === id ? 'text-slate-800' : 'text-gray-400'}`}>{label}</p>
                      <p className="text-gray-500 text-xs">{desc}</p>
                    </div>
                  </button>
                ))}
              </div>

              {/* Template selector */}
              {contentType === 'template' && (
                <div className="space-y-3">
                  <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Choose a Template</label>
                  <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto">
                    {Object.entries(TEMPLATES).map(([cat, temps]) => (
                      <div key={cat}>
                        <p className="text-gray-500 text-xs font-medium mb-2 px-1">{cat}</p>
                        <div className="space-y-1">
                          {temps.map((template) => (
                            <button
                              key={template.title}
                              onClick={() => applyTemplate(template)}
                              className="w-full flex items-center gap-3 p-3 rounded-xl border border-app-border bg-app-card hover:border-blue-500/40 transition-all text-left"
                            >
                              <div className={`w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center ${copiedTemplate === template.title ? 'bg-emerald-500/10' : ''}`}>
                                {copiedTemplate === template.title ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} className="text-blue-500" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-gray-300 text-sm font-medium truncate">{template.title}</p>
                                <p className="text-gray-500 text-xs truncate">{template.prompt.slice(0, 60)}...</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Content input */}
              {(contentType === 'text' || contentType === 'template') && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Your Text</label>
                    {contentType === 'template' && textContent && (
                      <button
                        onClick={regenerateContent}
                        disabled={generating}
                        className="flex items-center gap-1 text-blue-400 text-xs hover:text-blue-300 transition-colors"
                      >
                        <RefreshCw size={12} className={generating ? 'animate-spin' : ''} />
                        {generating ? 'Generating...' : 'Generate full content'}
                      </button>
                    )}
                  </div>
                  <textarea
                    rows={8}
                    value={textContent}
                    onChange={(e) => setTextContent(e.target.value)}
                    placeholder={contentType === 'template' ? "Template prompt will appear here. Click 'Generate full content' or write your own..." : "Paste any article, news, story, or text in English (min. 50 characters)..."}
                    className="w-full bg-app-card border border-app-border rounded-2xl px-4 py-3 text-gray-700 text-sm placeholder-gray-600 resize-none focus:border-blue-500/60 transition-colors"
                  />
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-gray-600 text-xs">~{estimatedWords} words</p>
                    <p className="text-gray-600 text-xs">{textContent.length} chars</p>
                  </div>
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
                <p className="text-gray-400 text-sm">Give it a name, category, and level.</p>
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
                <div className="grid grid-cols-3 gap-2">
                  {CATEGORIES.map(({ id, icon: Icon }) => (
                    <button
                      key={id}
                      onClick={() => setCategory(id)}
                      className={`flex items-center gap-2 p-3 rounded-xl border transition-all text-left ${
                        category === id
                          ? 'border-blue-500/50 bg-blue-500/10'
                          : 'border-app-border bg-app-card'
                      }`}
                    >
                      <Icon size={16} className={category === id ? 'text-blue-400' : 'text-gray-500'} />
                      <span className={`text-sm ${category === id ? 'text-gray-300 font-medium' : 'text-gray-400'}`}>{id}</span>
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

              <div>
                <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2 block">Sub-Level</label>
                <div className="flex gap-1">
                  {SUB_LEVEL_MAP[level].map((sl) => (
                    <button
                      key={sl}
                      onClick={() => setSubLevel(sl)}
                      className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${
                        subLevel === sl 
                          ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40' 
                          : 'border-app-border bg-app-card text-gray-500'
                      }`}
                    >
                      {SUB_LEVEL_LABELS[sl]}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2 block">Estimated Time</label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min={5}
                    max={45}
                    step={5}
                    value={estimatedMinutes}
                    onChange={(e) => setEstimatedMinutes(Number(e.target.value))}
                    className="flex-1 h-2 bg-app-card rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                  <span className="text-gray-300 text-sm font-medium w-16">{estimatedMinutes} min</span>
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

          {/* ── STEP 3: Key Points + Vocabulary ─────────────────── */}
          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-5">
              <div>
                <h2 className="text-slate-800 font-bold text-xl mb-1">Key Points & Vocabulary</h2>
                <p className="text-gray-400 text-sm">What should the learner understand? AI can help.</p>
              </div>

              {error && (
                <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3">
                  <p className="text-rose-400 text-sm">{error}</p>
                </div>
              )}

              <button
                onClick={generateKeyPoints}
                disabled={generating || !openaiKey}
                className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border font-semibold text-sm transition-all ${
                  generating || !openaiKey
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
                {!openaiKey ? 'Add API Key in Profile' : generating ? 'Generating with AI...' : '✨ Generate Key Points & Vocab'}
              </button>

              {/* Key Points */}
              <div>
                <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2 block">Key Points</label>
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
              </div>

              {/* Vocabulary */}
              <div>
                <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2 block">Vocabulary</label>
                <div className="grid grid-cols-2 gap-2">
                  {vocabulary.map((v, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={v}
                        onChange={(e) => {
                          const updated = [...vocabulary]
                          updated[i] = e.target.value
                          setVocabulary(updated)
                        }}
                        placeholder={`Word ${i + 1}`}
                        className="flex-1 bg-app-card border border-app-border rounded-xl px-3 py-2 text-gray-700 text-sm placeholder-gray-600 focus:border-blue-500/60 transition-colors"
                      />
                    </div>
                  ))}
                </div>
                {vocabulary.length < 8 && (
                  <button
                    onClick={() => setVocabulary([...vocabulary, ''])}
                    className="flex items-center gap-2 text-gray-500 text-sm px-2 py-1 mt-1"
                  >
                    <Plus size={14} /> Add word
                  </button>
                )}
              </div>

              {/* Preview Toggle */}
              <div className="border-t border-app-border pt-4">
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className="flex items-center gap-2 text-gray-400 text-sm hover:text-gray-300 transition-colors"
                >
                  {showPreview ? '▼' : '▶'} Preview Lesson
                </button>
                
                {showPreview && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }} 
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-3 p-4 rounded-2xl bg-app-card border border-app-border"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-2xl">
                        {contentType === 'video' ? '🎥' : contentType === 'audio' ? '🎧' : contentType === 'template' ? '💡' : '📄'}
                      </span>
                      <div>
                        <h3 className="text-gray-300 font-semibold">{title || 'Untitled Lesson'}</h3>
                        <p className="text-gray-500 text-xs">{category} • {LEVEL_LABEL[level]} ({subLevel.toUpperCase()}) • {estimatedMinutes} min</p>
                      </div>
                    </div>
                    <p className="text-gray-400 text-sm line-clamp-3">
                      {(contentType === 'text' || contentType === 'template') ? textContent.slice(0, 150) + '...' : 'Media content'}
                    </p>
                    <div className="flex gap-2 mt-3">
                      <span className="text-xs text-gray-500">{keyPoints.filter(k => k.trim()).length} key points</span>
                      <span className="text-gray-600">•</span>
                      <span className="text-xs text-gray-500">{vocabulary.filter(v => v.trim()).length} vocabulary words</span>
                    </div>
                  </motion.div>
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
