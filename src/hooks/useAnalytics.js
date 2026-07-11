/**
 * useAnalytics — fire-and-forget tracking de eventos educacionais.
 * Não bloqueia o fluxo do usuário: erros são silenciados e logados apenas em dev.
 *
 * Eventos disponíveis:
 *   lesson_started, lesson_completed,
 *   analysis_requested, analysis_passed, analysis_failed,
 *   gap_detected, gap_fixed,
 *   teach_mode_started, teach_mode_completed,
 *   practice_started, practice_completed
 */

import { useCallback } from 'react'
import { callEdgeFunction } from '../services/supabase'

export default function useAnalytics() {
  const track = useCallback((eventName, properties = {}) => {
    callEdgeFunction('track-event', { event_name: eventName, properties })
      .catch((err) => {
        if (import.meta.env.DEV) console.warn('[Analytics]', eventName, err.message)
      })
  }, [])

  return {
    track,
    lessonStarted:       (lesson) => track('lesson_started', {
      lesson_id:    lesson.id,
      lesson_title: lesson.title,
      level:        lesson.level,
      sub_level:    lesson.subLevel,
      type:         lesson.type ?? 'text',
    }),
    lessonCompleted:     (lesson, scores) => track('lesson_completed', {
      lesson_id:      lesson.id,
      lesson_title:   lesson.title,
      level:          lesson.level,
      clarity_score:  scores?.clarityScore,
      coverage_score: scores?.coverageScore,
      xp_earned:      scores?.xp,
    }),
    analysisRequested:   (lesson, inputType) => track('analysis_requested', {
      lesson_id:  lesson.id,
      input_type: inputType,
    }),
    analysisPassed:      (lesson, feedback) => track('analysis_passed', {
      lesson_id:      lesson.id,
      clarity_score:  feedback?.clarityScore,
      coverage_score: feedback?.coverageScore,
      grammar_errors: feedback?.grammarErrors?.length ?? 0,
    }),
    analysisFailed:      (lesson, reason) => track('analysis_failed', {
      lesson_id: lesson.id,
      reason,
    }),
    gapDetected:         (gap, lessonId) => track('gap_detected', { gap, lesson_id: lessonId }),
    gapFixed:            (gap) => track('gap_fixed', { gap }),
    teachModeStarted:    (lesson) => track('teach_mode_started', { lesson_id: lesson.id }),
    teachModeCompleted:  (lesson, score) => track('teach_mode_completed', {
      lesson_id: lesson.id,
      score,
    }),
    practiceStarted:     (gapCount) => track('practice_started', { gap_count: gapCount }),
    practiceCompleted:   (correct, total) => track('practice_completed', { correct, total }),
  }
}
