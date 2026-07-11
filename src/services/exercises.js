import { callEdgeFunction } from './supabase'

export async function generateExercises({ gaps }) {
  return callEdgeFunction('generate-exercises', { gaps })
}

