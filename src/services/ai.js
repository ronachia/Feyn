import { callEdgeFunction } from './supabase'

export async function analyzeExplanation({ originalContent, userExplanation, keyPoints }) {
  return callEdgeFunction('analyze-explanation', { originalContent, userExplanation, keyPoints })
}
