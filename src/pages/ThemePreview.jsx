import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ChevronRight, Flame, BookOpen, Check } from 'lucide-react'

const THEMES = [
  {
    id: 'blue',
    name: '💙 Electric Blue',
    desc: 'Inteligência & Tecnologia',
    bg: '#FFFFFF',
    surface: '#F0F4FF',
    card: '#FFFFFF',
    border: '#DBEAFE',
    primary: '#2563EB',
    primaryLight: '#EFF6FF',
    primaryText: '#1D4ED8',
    accent: '#0EA5E9',
    text: '#0F172A',
    subtext: '#64748B',
    shadow: '0 2px 12px rgba(37,99,235,0.12)',
    badgeBg: '#EFF6FF',
    badgeBorder: '#BFDBFE',
    badgeText: '#1D4ED8',
    navBg: '#FFFFFF',
    navActive: '#2563EB',
    navShadow: '0 -2px 16px rgba(37,99,235,0.10)',
    streak: '#F97316',
  },
  {
    id: 'coral',
    name: '🧡 Coral & Teal',
    desc: 'Vibrante & Jovem',
    bg: '#FAFAFA',
    surface: '#FFF1F2',
    card: '#FFFFFF',
    border: '#FFE4E6',
    primary: '#F43F5E',
    primaryLight: '#FFF1F2',
    primaryText: '#E11D48',
    accent: '#0D9488',
    text: '#0F172A',
    subtext: '#6B7280',
    shadow: '0 2px 12px rgba(244,63,94,0.12)',
    badgeBg: '#F0FDFA',
    badgeBorder: '#99F6E4',
    badgeText: '#0F766E',
    navBg: '#FFFFFF',
    navActive: '#F43F5E',
    navShadow: '0 -2px 16px rgba(244,63,94,0.10)',
    streak: '#F59E0B',
  },
  {
    id: 'indigo',
    name: '🟣 Índigo & Laranja',
    desc: 'Contraste Marcante',
    bg: '#FFFFFF',
    surface: '#EEF2FF',
    card: '#FFFFFF',
    border: '#E0E7FF',
    primary: '#4F46E5',
    primaryLight: '#EEF2FF',
    primaryText: '#4338CA',
    accent: '#F97316',
    text: '#111827',
    subtext: '#6B7280',
    shadow: '0 2px 12px rgba(79,70,229,0.13)',
    badgeBg: '#FFF7ED',
    badgeBorder: '#FED7AA',
    badgeText: '#C2410C',
    navBg: '#FFFFFF',
    navActive: '#4F46E5',
    navShadow: '0 -2px 16px rgba(79,70,229,0.10)',
    streak: '#F97316',
  },
  {
    id: 'teal',
    name: '🟢 Teal & Roxo',
    desc: 'Calmo mas Animado',
    bg: '#F9FAFB',
    surface: '#F0FDFA',
    card: '#FFFFFF',
    border: '#CCFBF1',
    primary: '#0F766E',
    primaryLight: '#F0FDFA',
    primaryText: '#0F766E',
    accent: '#7C3AED',
    text: '#111827',
    subtext: '#6B7280',
    shadow: '0 2px 12px rgba(15,118,110,0.12)',
    badgeBg: '#F5F3FF',
    badgeBorder: '#DDD6FE',
    badgeText: '#6D28D9',
    navBg: '#FFFFFF',
    navActive: '#0F766E',
    navShadow: '0 -2px 16px rgba(15,118,110,0.10)',
    streak: '#F59E0B',
  },
  {
    id: 'orange-blue',
    name: '🔥 Orange & Electric Blue',
    desc: 'Energia + Clareza',
    bg: '#FFFBF7',
    surface: '#FFF3E0',
    card: '#FFFFFF',
    border: '#FFE0B2',
    primary: '#F97316',
    primaryLight: '#FFF3E0',
    primaryText: '#EA580C',
    accent: '#2563EB',
    text: '#1E293B',
    subtext: '#64748B',
    shadow: '0 2px 12px rgba(249,115,22,0.15)',
    badgeBg: '#EFF6FF',
    badgeBorder: '#BFDBFE',
    badgeText: '#2563EB',
    navBg: '#FFFFFF',
    navActive: '#F97316',
    navShadow: '0 -2px 16px rgba(249,115,22,0.12)',
    streak: '#F97316',
  },
  {
    id: 'blue-orange',
    name: '⚡ Electric Blue & Orange',
    desc: 'Bold & Moderno',
    bg: '#EFF6FF',
    surface: '#DBEAFE',
    card: '#FFFFFF',
    border: '#BFDBFE',
    primary: '#2563EB',
    primaryLight: '#DBEAFE',
    primaryText: '#1D4ED8',
    accent: '#F97316',
    text: '#1E293B',
    subtext: '#475569',
    shadow: '0 2px 12px rgba(37,99,235,0.15)',
    badgeBg: '#FFF7ED',
    badgeBorder: '#FED7AA',
    badgeText: '#EA580C',
    navBg: '#FFFFFF',
    navActive: '#2563EB',
    navShadow: '0 -2px 16px rgba(37,99,235,0.12)',
    streak: '#F97316',
  },
  {
    id: 'blue-green',
    name: '💎 Blue & Green',
    desc: 'Azul elétrico + Verde',
    bg: '#EFF6FF',
    surface: '#DBEAFE',
    card: '#FFFFFF',
    border: '#BFDBFE',
    primary: '#2563EB',
    primaryLight: '#DBEAFE',
    primaryText: '#1D4ED8',
    accent: '#58CC02',
    text: '#1E293B',
    subtext: '#475569',
    shadow: '0 2px 12px rgba(37,99,235,0.15)',
    badgeBg: '#F0FCE3',
    badgeBorder: '#BBF7A0',
    badgeText: '#3D9900',
    navBg: '#FFFFFF',
    navActive: '#2563EB',
    navShadow: '0 -2px 16px rgba(37,99,235,0.12)',
    streak: '#58CC02',
  },
  {
    id: 'dark-green-orange',
    name: '🌲 Verde Escuro & Laranja',
    desc: 'Mais sério que Duolingo',
    bg: '#FFFFFF',
    surface: '#F0FCE3',
    card: '#FFFFFF',
    border: '#BBF7A0',
    primary: '#3D9900',
    primaryLight: '#F0FCE3',
    primaryText: '#2D7A00',
    accent: '#F97316',
    text: '#1E293B',
    subtext: '#6B7280',
    shadow: '0 4px 0px #3D990022',
    badgeBg: '#FFF7ED',
    badgeBorder: '#FED7AA',
    badgeText: '#EA580C',
    navBg: '#FFFFFF',
    navActive: '#3D9900',
    navShadow: '0 -2px 12px rgba(61,153,0,0.12)',
    streak: '#F97316',
  },
  {
    id: 'duolingo',
    name: '🦉 Duolingo Style',
    desc: 'Gamificado & Motivador',
    bg: '#FFFFFF',
    surface: '#F7FEF0',
    card: '#FFFFFF',
    border: '#D4F5A2',
    primary: '#58CC02',
    primaryLight: '#F0FCE3',
    primaryText: '#3D9900',
    accent: '#1CB0F6',
    text: '#3C3C3C',
    subtext: '#777777',
    shadow: '0 4px 0px #58CC0244',
    badgeBg: '#E8F9FF',
    badgeBorder: '#A5E3FC',
    badgeText: '#0B7BB5',
    navBg: '#FFFFFF',
    navActive: '#58CC02',
    navShadow: '0 -2px 12px rgba(88,204,2,0.12)',
    streak: '#FF9600',
  },
]

function ThemeCard({ t }) {
  return (
    <div
      style={{ background: t.bg, fontFamily: 'system-ui, sans-serif' }}
      className="rounded-3xl overflow-hidden border-2 border-slate-200"
    >
      {/* Mini top bar */}
      <div style={{ background: t.primary, padding: '12px 16px' }} className="flex items-center justify-between">
        <span style={{ color: '#fff', fontWeight: 700, fontSize: 13 }}>{t.name}</span>
        <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11 }}>{t.desc}</span>
      </div>

      <div style={{ padding: '14px 14px 8px', background: t.bg }}>
        {/* Streak banner */}
        <div style={{
          background: t.primaryLight, border: `1px solid ${t.border}`,
          borderRadius: 14, padding: '10px 14px', marginBottom: 10,
          display: 'flex', alignItems: 'center', gap: 8,
          boxShadow: t.shadow,
        }}>
          <span style={{ fontSize: 20 }}>🔥</span>
          <div>
            <p style={{ color: t.text, fontWeight: 700, fontSize: 14, margin: 0 }}>7-day streak!</p>
            <p style={{ color: t.subtext, fontSize: 11, margin: 0 }}>Keep it up</p>
          </div>
          <div style={{ marginLeft: 'auto', background: t.primary, color: '#fff', borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>
            +10 XP
          </div>
        </div>

        {/* Sub-level badge row */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
          {['A1', 'A2', 'B1'].map((b, i) => (
            <span key={b} style={{
              background: i === 0 ? t.primary : t.badgeBg,
              color: i === 0 ? '#fff' : t.badgeText,
              border: `1px solid ${i === 0 ? t.primary : t.badgeBorder}`,
              borderRadius: 8, padding: '3px 10px', fontSize: 11, fontWeight: 700,
            }}>{b}</span>
          ))}
        </div>

        {/* Lesson card */}
        <div style={{
          background: t.card, border: `1px solid ${t.border}`,
          borderRadius: 14, padding: '10px 12px', marginBottom: 8,
          display: 'flex', alignItems: 'center', gap: 10,
          boxShadow: t.shadow,
        }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: t.surface, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
            ☀️
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ color: t.text, fontWeight: 600, fontSize: 13, margin: 0 }}>Morning Routine</p>
            <p style={{ color: t.subtext, fontSize: 11, margin: '2px 0 0' }}>Daily Life · 15 min</p>
          </div>
          <ChevronRight size={14} color={t.subtext} />
        </div>

        {/* Completed card */}
        <div style={{
          background: t.card, border: `2px solid ${t.accent}`,
          borderRadius: 14, padding: '10px 12px', marginBottom: 10,
          display: 'flex', alignItems: 'center', gap: 10,
          boxShadow: t.shadow,
        }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: t.surface, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
            👋
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ color: t.text, fontWeight: 600, fontSize: 13, margin: 0 }}>Meeting a Friend</p>
            <p style={{ color: t.subtext, fontSize: 11, margin: '2px 0 0' }}>Social · 15 min</p>
          </div>
          <div style={{ width: 24, height: 24, borderRadius: '50%', background: t.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Check size={12} color="#fff" strokeWidth={3} />
          </div>
        </div>

        {/* CTA button */}
        <button style={{
          width: '100%', background: t.primary, color: '#fff',
          border: 'none', borderRadius: 14, padding: '11px 0',
          fontWeight: 700, fontSize: 13, cursor: 'pointer',
          boxShadow: `0 4px 14px ${t.primary}44`,
        }}>
          Start Next Lesson →
        </button>
      </div>

      {/* Mini bottom nav */}
      <div style={{
        background: t.navBg, borderTop: `1px solid ${t.border}`,
        padding: '8px 0 4px', display: 'flex', justifyContent: 'space-around',
        boxShadow: t.navShadow,
      }}>
        {[
          { icon: '🏠', label: 'Home', active: true },
          { icon: '📖', label: 'Lessons', active: false },
          { icon: '📊', label: 'Stats', active: false },
          { icon: '👤', label: 'Profile', active: false },
        ].map(({ icon, label, active }) => (
          <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <div style={{
              background: active ? t.primary : 'transparent',
              borderRadius: 10, padding: '4px 10px',
            }}>
              <span style={{ fontSize: 16 }}>{icon}</span>
            </div>
            <span style={{ fontSize: 9, color: active ? t.primary : t.subtext, fontWeight: active ? 700 : 400 }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function ThemeBlock({ t, navigate }) {
  return (
    <div>
      <ThemeCard t={t} />
      <button
        onClick={() => navigate(`/home?theme=${t.id}`)}
        style={{
          marginTop: 8, width: '100%', padding: '9px 0',
          background: t.primary, color: '#fff', border: 'none',
          borderRadius: 12, fontWeight: 700, fontSize: 12, cursor: 'pointer',
          boxShadow: `0 3px 10px ${t.primary}44`,
        }}
      >
        Quero este →
      </button>
    </div>
  )
}

export default function ThemePreview() {
  const navigate = useNavigate()
  return (
    <div style={{ background: '#F1F5F9', minHeight: '100vh', padding: '0 0 40px' }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #E2E8F0', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => navigate(-1)} style={{ background: '#F1F5F9', border: 'none', borderRadius: 10, padding: '6px 8px', cursor: 'pointer' }}>
          <ArrowLeft size={18} color="#334155" />
        </button>
        <div>
          <p style={{ margin: 0, fontWeight: 700, color: '#0F172A', fontSize: 16 }}>Escolha o Tema</p>
          <p style={{ margin: 0, color: '#64748B', fontSize: 12 }}>Toque no botão abaixo do tema preferido</p>
        </div>
      </div>

      <div style={{ padding: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          {(THEMES.length % 2 === 0 ? THEMES : THEMES.slice(0, -1)).map((t) => (
            <ThemeBlock key={t.id} t={t} navigate={navigate} />
          ))}
        </div>
        {THEMES.length % 2 !== 0 && (
          <div style={{ marginTop: 14, maxWidth: 340, margin: '14px auto 0' }}>
            <ThemeBlock t={THEMES[THEMES.length - 1]} navigate={navigate} />
          </div>
        )}
      </div>
    </div>
  )
}
