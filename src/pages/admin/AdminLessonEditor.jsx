import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Save, Loader2, Plus, X } from 'lucide-react'
import { callEdgeFunction } from '../../services/supabase'
import { invalidateLessonsCache } from '../../hooks/useLessons'
import { SUB_LEVELS, SUB_LEVEL_META, CATEGORIES } from '../../data/lessonHelpers'

const EMPTY = {
  slug: '', title: '', level: 'beginner', subLevel: 'a1',
  category: 'Daily Life', icon: '📖', type: 'text',
  estimatedMinutes: 15, content: '', keyPoints: [], vocabulary: [],
  videoUrl: '', audioUrl: '', isActive: false, sortOrder: 9999,
}

function normalize(row) {
  return {
    id: row.id, slug: row.slug, title: row.title,
    level: row.level, subLevel: row.sub_level,
    category: row.category ?? '', icon: row.icon ?? '📖',
    type: row.type ?? 'text', estimatedMinutes: row.estimated_minutes ?? 15,
    content: row.content ?? '', keyPoints: row.key_points ?? [],
    vocabulary: row.vocabulary ?? [], videoUrl: row.video_url ?? '',
    audioUrl: row.audio_url ?? '', isActive: row.is_active,
    sortOrder: row.sort_order ?? 9999,
  }
}

export default function AdminLessonEditor() {
  const { id }       = useParams()
  const navigate     = useNavigate()
  const isNew        = id === 'new'
  const [form, setForm]     = useState(EMPTY)
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState(null)
  const [kpInput, setKpInput] = useState('')
  const [vocInput, setVocInput] = useState('')

  useEffect(() => {
    if (isNew) return
    callEdgeFunction('admin-lessons', { action: 'list' })
      .then(({ lessons }) => {
        const row = lessons.find((l) => l.id === Number(id))
        if (row) setForm(normalize(row))
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [id])

  const set = (field, value) => setForm((f) => ({ ...f, [field]: value }))

  const autoSlug = (title, subLevel) =>
    title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim()
    + '-' + subLevel

  const handleSave = async () => {
    if (!form.title.trim()) return setError('Title is required')
    if (!form.slug.trim()) form.slug = autoSlug(form.title, form.subLevel)
    setSaving(true)
    setError(null)
    try {
      await callEdgeFunction('admin-lessons', {
        action: isNew ? 'create' : 'update',
        id:     isNew ? undefined : Number(id),
        lesson: form,
      })
      invalidateLessonsCache()
      navigate('/admin')
    } catch (err) {
      setError(err.message)
      setSaving(false)
    }
  }

  const addKP = () => {
    if (!kpInput.trim()) return
    set('keyPoints', [...form.keyPoints, kpInput.trim()])
    setKpInput('')
  }
  const removeKP = (i) => set('keyPoints', form.keyPoints.filter((_, idx) => idx !== i))

  const addVoc = () => {
    if (!vocInput.trim()) return
    set('vocabulary', [...form.vocabulary, vocInput.trim()])
    setVocInput('')
  }
  const removeVoc = (i) => set('vocabulary', form.vocabulary.filter((_, idx) => idx !== i))

  if (loading) return (
    <div className="min-h-screen bg-app-bg flex items-center justify-center">
      <Loader2 size={32} className="text-blue-400 animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-app-bg">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-app-bg border-b border-app-border px-6 py-4 flex items-center gap-4">
        <button onClick={() => navigate('/admin')} className="w-9 h-9 rounded-full bg-app-card flex items-center justify-center">
          <ArrowLeft size={18} className="text-gray-400" />
        </button>
        <h1 className="text-slate-800 font-bold text-lg flex-1">
          {isNew ? 'New Lesson' : `Edit #${id}`}
        </h1>
        <label className="flex items-center gap-2 cursor-pointer">
          <span className="text-gray-500 text-sm">{form.isActive ? 'Published' : 'Draft'}</span>
          <div
            onClick={() => set('isActive', !form.isActive)}
            className={`w-10 h-6 rounded-full transition-colors ${form.isActive ? 'bg-emerald-500' : 'bg-gray-300'}`}
          >
            <div className={`w-4 h-4 bg-white rounded-full m-1 transition-transform ${form.isActive ? 'translate-x-4' : ''}`} />
          </div>
        </label>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-1.5 gradient-primary px-4 py-2 rounded-xl text-white text-sm font-semibold glow-purple disabled:opacity-60"
        >
          {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
          Save
        </button>
      </div>

      <div className="px-6 py-5 space-y-5 pb-20 max-w-2xl mx-auto">
        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3">
            <p className="text-rose-400 text-sm">{error}</p>
          </div>
        )}

        {/* Basic Info */}
        <div className="bg-app-card border border-app-border rounded-2xl p-4 space-y-3">
          <p className="text-slate-800 font-semibold text-sm">Basic Info</p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-gray-500 text-xs mb-1 block">Icon</label>
              <input value={form.icon} onChange={(e) => set('icon', e.target.value)}
                className="w-full bg-app-bg border border-app-border rounded-xl px-3 py-2 text-2xl text-center" />
            </div>
            <div>
              <label className="text-gray-500 text-xs mb-1 block">Est. Minutes</label>
              <input type="number" value={form.estimatedMinutes} onChange={(e) => set('estimatedMinutes', Number(e.target.value))}
                className="w-full bg-app-bg border border-app-border rounded-xl px-3 py-2 text-gray-700 text-sm" />
            </div>
          </div>

          <div>
            <label className="text-gray-500 text-xs mb-1 block">Title *</label>
            <input value={form.title}
              onChange={(e) => {
                set('title', e.target.value)
                if (isNew || !form.slug) set('slug', autoSlug(e.target.value, form.subLevel))
              }}
              placeholder="e.g. Morning Routine"
              className="w-full bg-app-bg border border-app-border rounded-xl px-3 py-2 text-gray-700 text-sm" />
          </div>

          <div>
            <label className="text-gray-500 text-xs mb-1 block">Slug (URL)</label>
            <input value={form.slug} onChange={(e) => set('slug', e.target.value)}
              placeholder="morning-routine-a1"
              className="w-full bg-app-bg border border-app-border rounded-xl px-3 py-2 text-gray-700 text-sm font-mono" />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-gray-500 text-xs mb-1 block">Level</label>
              <select value={form.level} onChange={(e) => set('level', e.target.value)}
                className="w-full bg-app-bg border border-app-border rounded-xl px-3 py-2 text-gray-700 text-sm">
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
            <div>
              <label className="text-gray-500 text-xs mb-1 block">Sub-level</label>
              <select value={form.subLevel}
                onChange={(e) => {
                  set('subLevel', e.target.value)
                  if (isNew) set('slug', autoSlug(form.title, e.target.value))
                }}
                className="w-full bg-app-bg border border-app-border rounded-xl px-3 py-2 text-gray-700 text-sm">
                {SUB_LEVELS.map((s) => (
                  <option key={s} value={s}>{SUB_LEVEL_META[s].label} — {SUB_LEVEL_META[s].desc}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-gray-500 text-xs mb-1 block">Type</label>
              <select value={form.type} onChange={(e) => set('type', e.target.value)}
                className="w-full bg-app-bg border border-app-border rounded-xl px-3 py-2 text-gray-700 text-sm">
                <option value="text">📄 Text</option>
                <option value="video">🎥 Video</option>
                <option value="audio">🎧 Audio</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-gray-500 text-xs mb-1 block">Category</label>
            <select value={form.category} onChange={(e) => set('category', e.target.value)}
              className="w-full bg-app-bg border border-app-border rounded-xl px-3 py-2 text-gray-700 text-sm">
              {CATEGORIES.filter((c) => c !== 'All').map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label className="text-gray-500 text-xs mb-1 block">Sort Order</label>
            <input type="number" value={form.sortOrder} onChange={(e) => set('sortOrder', Number(e.target.value))}
              className="w-full bg-app-bg border border-app-border rounded-xl px-3 py-2 text-gray-700 text-sm" />
          </div>
        </div>

        {/* Content */}
        <div className="bg-app-card border border-app-border rounded-2xl p-4 space-y-3">
          <p className="text-slate-800 font-semibold text-sm">Content</p>
          <div>
            <label className="text-gray-500 text-xs mb-1 block">
              {form.type === 'text' ? 'Text Content' : 'Context / Description'}
            </label>
            <textarea value={form.content} onChange={(e) => set('content', e.target.value)}
              rows={6} placeholder="The lesson text or context description..."
              className="w-full bg-app-bg border border-app-border rounded-xl px-3 py-2 text-gray-700 text-sm resize-none" />
          </div>
          {form.type === 'video' && (
            <div>
              <label className="text-gray-500 text-xs mb-1 block">YouTube URL</label>
              <input value={form.videoUrl ?? ''} onChange={(e) => set('videoUrl', e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className="w-full bg-app-bg border border-app-border rounded-xl px-3 py-2 text-gray-700 text-sm" />
            </div>
          )}
          {form.type === 'audio' && (
            <div>
              <label className="text-gray-500 text-xs mb-1 block">Audio URL</label>
              <input value={form.audioUrl ?? ''} onChange={(e) => set('audioUrl', e.target.value)}
                placeholder="https://..."
                className="w-full bg-app-bg border border-app-border rounded-xl px-3 py-2 text-gray-700 text-sm" />
            </div>
          )}
        </div>

        {/* Key Points */}
        <div className="bg-app-card border border-app-border rounded-2xl p-4 space-y-3">
          <p className="text-slate-800 font-semibold text-sm">Key Points</p>
          <div className="space-y-2">
            {form.keyPoints.map((kp, i) => (
              <div key={i} className="flex items-center gap-2 bg-app-bg border border-app-border rounded-xl px-3 py-2">
                <span className="text-blue-500 text-xs">•</span>
                <span className="text-gray-700 text-sm flex-1">{kp}</span>
                <button onClick={() => removeKP(i)}><X size={14} className="text-gray-400" /></button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input value={kpInput} onChange={(e) => setKpInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addKP()}
              placeholder="Add key point..."
              className="flex-1 bg-app-bg border border-app-border rounded-xl px-3 py-2 text-gray-700 text-sm" />
            <button onClick={addKP} className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center">
              <Plus size={16} className="text-white" />
            </button>
          </div>
        </div>

        {/* Vocabulary */}
        <div className="bg-app-card border border-app-border rounded-2xl p-4 space-y-3">
          <p className="text-slate-800 font-semibold text-sm">Vocabulary</p>
          <div className="flex flex-wrap gap-2">
            {form.vocabulary.map((v, i) => (
              <div key={i} className="flex items-center gap-1 bg-blue-500/10 border border-blue-500/20 rounded-full px-3 py-1">
                <span className="text-blue-400 text-xs">{v}</span>
                <button onClick={() => removeVoc(i)}><X size={11} className="text-blue-300" /></button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input value={vocInput} onChange={(e) => setVocInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addVoc()}
              placeholder="Add vocabulary word..."
              className="flex-1 bg-app-bg border border-app-border rounded-xl px-3 py-2 text-gray-700 text-sm" />
            <button onClick={addVoc} className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center">
              <Plus size={16} className="text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
