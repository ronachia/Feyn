import { useState } from 'react'
import { extractYouTubeId } from '../../data/lessonHelpers'

export default function LessonRead({ lesson, timeLeft, onReady }) {
  const type    = lesson.type || 'text'
  const videoId = extractYouTubeId(lesson.videoUrl)
  const [embedError, setEmbedError] = useState(false)

  return (
    <div className="pt-2 space-y-5">
      {type === 'text' && (
        <div className="flex items-center justify-between">
          <h3 className="text-slate-800 font-bold text-lg">📖 Read carefully</h3>
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold transition-colors ${
            timeLeft <= 15 ? 'bg-rose-500/20 text-rose-400' : 'bg-app-card text-cyan-400'
          }`}>
            ⏱ {timeLeft}s
          </div>
        </div>
      )}

      {type === 'video' && (
        <div className="space-y-4">
          <h3 className="text-slate-800 font-bold text-lg">🎥 Watch the video</h3>
          {videoId && !embedError ? (
            <>
              <div className="rounded-2xl overflow-hidden border border-app-border" style={{ aspectRatio: '16/9' }}>
                <iframe
                  src={`https://www.youtube.com/embed/${videoId}?rel=0&cc_load_policy=1&cc_lang_pref=en&hl=en`}
                  title={lesson.title}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  onError={() => setEmbedError(true)}
                />
              </div>
              <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
                <span className="text-lg">💡</span>
                <div>
                  <p className="text-amber-400 text-xs font-semibold">Watch once — then explain from memory</p>
                  <p className="text-gray-500 text-xs">English subtitles enabled. Click the CC button if not visible.</p>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-5 text-center space-y-3">
              <p className="text-rose-400 text-sm font-semibold">
                {!videoId ? '⚠️ Invalid video URL' : '⚠️ Video cannot be embedded'}
              </p>
              <p className="text-gray-500 text-xs">
                {!videoId
                  ? 'The video URL stored for this lesson is not a valid YouTube link.'
                  : 'This video is restricted from embedding. Watch it directly on YouTube.'}
              </p>
              {lesson.videoUrl && (
                <a
                  href={lesson.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block bg-rose-500/20 text-rose-300 text-sm font-medium px-4 py-2 rounded-xl hover:bg-rose-500/30 transition-colors"
                >
                  ▶ Open on YouTube →
                </a>
              )}
            </div>
          )}
        </div>
      )}

      {type === 'audio' && lesson.audioUrl && (
        <div className="space-y-4">
          <h3 className="text-slate-800 font-bold text-lg">🎧 Listen carefully</h3>
          <div className="bg-app-card border border-app-border rounded-2xl p-5">
            <audio controls className="w-full" controlsList="nodownload">
              <source src={lesson.audioUrl} />
              Your browser does not support the audio element.
            </audio>
          </div>
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
            <p className="text-amber-400 text-xs font-semibold">💡 Listen as many times as you need — then explain</p>
          </div>
        </div>
      )}

      {type === 'text' && (
        <div className="bg-app-card border border-app-border rounded-2xl p-5">
          <p className="text-gray-700 leading-relaxed text-base">{lesson.content}</p>
        </div>
      )}

      {type !== 'text' && lesson.content && (
        <div className="bg-app-card border border-app-border rounded-2xl p-4">
          <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1">Context</p>
          <p className="text-gray-400 text-sm leading-relaxed">{lesson.content}</p>
        </div>
      )}

      <div className="bg-app-card border border-blue-500/20 rounded-2xl p-4">
        <p className="text-blue-400 text-sm font-semibold mb-2">🎯 Focus on understanding:</p>
        <ul className="space-y-1">
          {lesson.keyPoints.slice(0, 3).map((kp, i) => (
            <li key={i} className="text-gray-400 text-sm flex items-start gap-2">
              <span className="text-blue-500 mt-0.5">•</span>
              <span>{kp}</span>
            </li>
          ))}
        </ul>
      </div>

      <button
        onClick={onReady}
        className="w-full py-4 rounded-2xl gradient-primary text-white font-semibold text-lg glow-purple"
      >
        I'm Ready to Explain →
      </button>
    </div>
  )
}
