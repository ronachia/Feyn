import { callEdgeFunction } from './supabase'

export async function getStudentQuestion({ topic, explanation, history, round }) {
  return callEdgeFunction('teach-mode', { topic, explanation, history, round })
}
