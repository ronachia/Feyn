import { callEdgeFunction, callEdgeFunctionFormData } from './supabase'

export async function transcribeAudio(audioBlob) {
  const ext  = audioBlob.type.includes('ogg') ? 'ogg'
             : audioBlob.type.includes('mp4') ? 'mp4'
             : 'webm'
  const formData = new FormData()
  formData.append('audio', new File([audioBlob], `recording.${ext}`, { type: audioBlob.type }))
  return callEdgeFunctionFormData('transcribe-audio', formData)
}

export async function analyzeFluency({ text, duration }) {
  return callEdgeFunction('analyze-fluency', { text, duration })
}
