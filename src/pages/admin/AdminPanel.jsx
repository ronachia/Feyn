import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Plus, Edit2, Eye, EyeOff, Trash2, ArrowLeft, RefreshCw, BarChart2 } from 'lucide-react'
import { callEdgeFunction } from '../../services/supabase'
import { invalidateLessonsCache } from '../../hooks/useLessons'
import { getLevelColor, getSubLevelLabel, getContentTypeInfo } from '../../data/lessonHelpers'

function normalize(row) {
  return {
    id:               row.id,
    slug:             row.slug,
    title:            row.title,
    level:            row.level,
    subLevel:         row.sub_level,
    category:         row.category,
    icon:             row.icon ?? '📖',
    type:             row.type ?? 'text',
    estimatedMinutes: row.estimated_minutes ?? 15,
    content:          row.content ?? '',
    keyPoints:        row.key_points ?? [],
    vocabulary:       row.vocabulary ?? [],
    videoUrl:         row.video_url ?? null,
    audioUrl:         row.audio_url ?? null,
    isActive:         row.is_active,
    sortOrder:        row.sort_order,
  }
}

export default function AdminPanel() {
  const navigate           = useNavigate()
  const [lessons, setLessons] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)
  const [toggling, setToggling] = useState(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const { lessons: rows } = await callEdgeFunction('admin-lessons', { action: 'list' })
      setLessons(rows.map(normalize))
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleToggle = async (lesson) => {
    setToggling(lesson.id)
    try {
      await callEdgeFunction('admin-lessons', {
        action: 'toggle', id: lesson.id, lesson: { isActive: !lesson.isActive },
      })
      setLessons((prev) =>
        prev.map((l) => l.id === lesson.id ? { ...l, isActive: !l.isActive } : l)
      )
      invalidateLessonsCache()
    } catch (err) {
      alert(err.message)
    } finally {
      setToggling(null)
    }
  }

  const handleDelete = async (lesson) => {
    if (!window.confirm(`Delete "${lesson.title}"? This cannot be undone.`)) return
    try {
      await callEdgeFunction('admin-lessons', { action: 'delete', id: lesson.id })
      setLessons((prev) => prev.filter((l) => l.id !== lesson.id))
      invalidateLessonsCache()
    } catch (err) {
      alert(err.message)
    }
  }

  const active   = lessons.filter((l) => l.isActive).length
  const inactive = lessons.length - active

  return (
    <div className="min-h-screen bg-app-bg">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-app-bg border-b border-app-border px-6 py-4 flex items-center gap-4">
        <button onClick={() => navigate('/home')} className="w-9 h-9 rounded-full bg-app-card flex items-center justify-center">
          <ArrowLeft size={18} className="text-gray-400" />
        </button>
        <div className="flex-1">
          <h1 className="text-slate-800 font-bold text-lg">Admin — Lessons</h1>
          <p className="text-gray-500 text-xs">{lessons.length} total · {active} published · {inactive} drafts</p>
        </div>
        <button
          onClick={load}
          className="w-9 h-9 rounded-full bg-app-card flex items-center justify-center"
          title="Refresh"
        >
          <RefreshCw size={16} className={`text-gray-400 ${loading ? 'animate-spin' : ''}`} />
        </button>
        <button
          onClick={() => navigate('/admin/analytics')}
          className="w-9 h-9 rounded-full bg-app-card flex items-center justify-center border border-app-border"
          title="Analytics"
        >
          <BarChart2 size={16} className="text-purple-400" />
        </button>
        <button
          onClick={() => navigate('/admin/lesson/new')}
          className="flex items-center gap-1.5 gradient-primary px-4 py-2 rounded-xl text-white text-sm font-semibold glow-purple"
        >
          <Plus size={15} /> New
        </button>
      </div>

      <div className="px-6 py-4">
        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 mb-4">
            <p className="text-rose-400 text-sm">{error}</p>
          </div>
        )}

        {loading && lessons.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
          </div>
        ) : (
          <div className="space-y-2 pb-10">
            {lessons.map((lesson, i) => {
              const c  = getLevelColor(lesson.level)
              const ct = getContentTypeInfo(lesson.type)
              return (
                <motion.div
                  key={lesson.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02 }}
                  className={`bg-app-card border rounded-2xl p-4 flex items-center gap-3 ${
                    lesson.isActive ? 'border-app-border' : 'border-dashed border-gray-300 opacity-60'
                  }`}
                >
                  <span className="text-2xl flex-shrink-0">{lesson.icon}</span>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-slate-800 font-semibold text-sm truncate">{lesson.title}</p>
                      {!lesson.isActive && (
                        <span className="text-[10px] bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded-full flex-shrink-0">draft</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${c.bg} ${c.text}`}>
                        {getSubLevelLabel(lesson.subLevel)}
                      </span>
                      <span className="text-gray-500 text-[10px]">{ct.icon} {ct.label}</span>
                      {lesson.category && <span className="text-gray-400 text-[10px]">{lesson.category}</span>}
                      <span className="text-gray-400 text-[10px]">#{lesson.id}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => navigate(`/admin/lesson/${lesson.id}`)}
                      className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center"
                      title="Edit"
                    >
                      <Edit2 size={14} className="text-blue-400" />
                    </button>
                    <button
                      onClick={() => handleToggle(lesson)}
                      disabled={toggling === lesson.id}
                      className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                        lesson.isActive ? 'bg-emerald-500/10' : 'bg-gray-200'
                      }`}
                      title={lesson.isActive ? 'Unpublish' : 'Publish'}
                    >
                      {lesson.isActive
                        ? <Eye size={14} className="text-emerald-500" />
                        : <EyeOff size={14} className="text-gray-400" />
                      }
                    </button>
                    <button
                      onClick={() => handleDelete(lesson)}
                      className="w-8 h-8 rounded-xl bg-rose-500/10 flex items-center justify-center"
                      title="Delete"
                    >
                      <Trash2 size={14} className="text-rose-400" />
                    </button>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
