// Teo, FeynLearn's mascot — brought in from marketing/Teo_mascote.svg so the
// character actually shows up in the product, not just the app icon.
export default function TeoMascot({ className = 'w-16 h-16', mood = 'happy' }) {
  return (
    <svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="teoBody" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#a78bfa" />
          <stop offset="100%" stopColor="#c084fc" />
        </linearGradient>
        <radialGradient id="teoGlow" cx="50%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
      </defs>

      <g fill="#fbbf24">
        <path d="M 66 96 L 71 108 L 83 113 L 71 118 L 66 130 L 61 118 L 49 113 L 61 108 Z" />
        <path d="M 330 130 L 334 139 L 343 143 L 334 147 L 330 156 L 326 147 L 317 143 L 326 139 Z" />
        <circle cx="322" cy="90" r="5" />
        <circle cx="60" cy="220" r="4" />
      </g>

      <ellipse cx="200" cy="215" rx="118" ry="112" fill="url(#teoBody)" />
      <ellipse cx="200" cy="215" rx="118" ry="112" fill="url(#teoGlow)" />

      <ellipse cx="98" cy="250" rx="20" ry="34" fill="#a78bfa" transform="rotate(-18 98 250)" />
      <ellipse cx="302" cy="250" rx="20" ry="34" fill="#a78bfa" transform="rotate(18 302 250)" />

      {mood === 'happy' && (
        <>
          <ellipse cx="163" cy="205" rx="14" ry="18" fill="#1a1a2e" />
          <ellipse cx="237" cy="205" rx="14" ry="18" fill="#1a1a2e" />
          <circle cx="167" cy="199" r="4" fill="#ffffff" />
          <circle cx="241" cy="199" r="4" fill="#ffffff" />
          <path d="M 172 240 Q 200 262 228 240" stroke="#1a1a2e" strokeWidth="6" fill="none" strokeLinecap="round" />
        </>
      )}
      {mood === 'excited' && (
        <>
          <path d="M 152 200 Q 163 190 174 200" stroke="#1a1a2e" strokeWidth="6" fill="none" strokeLinecap="round" />
          <path d="M 226 200 Q 237 190 248 200" stroke="#1a1a2e" strokeWidth="6" fill="none" strokeLinecap="round" />
          <ellipse cx="200" cy="238" rx="20" ry="16" fill="#1a1a2e" />
        </>
      )}
      {mood === 'thinking' && (
        <>
          <ellipse cx="163" cy="205" rx="14" ry="18" fill="#1a1a2e" />
          <ellipse cx="237" cy="205" rx="14" ry="18" fill="#1a1a2e" />
          <circle cx="159" cy="199" r="4" fill="#ffffff" />
          <circle cx="233" cy="199" r="4" fill="#ffffff" />
          <path d="M 180 244 Q 200 236 220 244" stroke="#1a1a2e" strokeWidth="6" fill="none" strokeLinecap="round" />
        </>
      )}

      <circle cx="146" cy="234" r="12" fill="#f472b6" opacity="0.35" />
      <circle cx="254" cy="234" r="12" fill="#f472b6" opacity="0.35" />

      <line x1="200" y1="103" x2="200" y2="74" stroke="#8b5cf6" strokeWidth="6" strokeLinecap="round" />
      <circle cx="200" cy="66" r="11" fill="#fbbf24" />
    </svg>
  )
}
