import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export default function Privacy() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-app-bg px-5 py-6 text-slate-800">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1 text-sm text-gray-500 mb-4"
      >
        <ArrowLeft size={16} /> Back
      </button>

      <h1 className="text-2xl font-bold mb-1">Privacy Policy</h1>
      <p className="text-xs text-gray-500 mb-6">Last updated: July 27, 2026</p>

      <div className="space-y-5 text-sm leading-relaxed text-slate-700">
        <section>
          <p>
            FeynLearn ("we", "our", "the app") respects your privacy. This
            policy explains what data we collect, why, and how it's handled
            when you use the FeynLearn app or website.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-slate-800 mb-1">Information we collect</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Account data</strong>: your name, email address, and authentication data, handled by our authentication provider, Clerk.</li>
            <li><strong>Learning progress</strong>: your XP, streaks, completed lessons, gaps, and session history, stored in our database (Supabase) to sync your progress across devices.</li>
            <li><strong>Lesson content you submit</strong>: text explanations and, if you use Voice Mode, audio recordings you provide during lessons. These are sent to OpenAI's API to generate feedback and are not used to train OpenAI's models.</li>
            <li><strong>Payment data</strong>: if you subscribe to Premium, payment is processed by Mercado Pago. We do not store your full card details — Mercado Pago handles that directly.</li>
            <li><strong>Basic usage analytics</strong>: aggregated, non-identifying product usage (e.g. which lesson types are most used) to improve the app.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-semibold text-slate-800 mb-1">How we use it</h2>
          <p>
            We use your data to operate the app: to authenticate you, save and
            sync your learning progress, generate AI feedback on your lesson
            answers, process Premium subscription payments, and improve the
            product. We do not sell your personal data to third parties.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-slate-800 mb-1">Third-party services</h2>
          <p>
            We rely on the following processors, each under their own privacy
            policy: <strong>Clerk</strong> (authentication),{' '}
            <strong>Supabase</strong> (database and backend functions),{' '}
            <strong>OpenAI</strong> (AI-generated lesson feedback), and{' '}
            <strong>Mercado Pago</strong> (subscription payments).
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-slate-800 mb-1">Your rights</h2>
          <p>
            You can request access to, correction of, or deletion of your
            personal data at any time by contacting us (see below). You can
            delete your account and associated learning data directly from
            the app's Profile screen. If you're in Brazil, these rights are
            protected under the LGPD (Lei Geral de Proteção de Dados); if
            you're in the EU/UK, under the GDPR.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-slate-800 mb-1">Data retention</h2>
          <p>
            We keep your account and progress data for as long as your account
            is active. If you delete your account, we delete your personal
            data within a reasonable period, except where we're required to
            keep records (e.g. payment records) for legal or accounting reasons.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-slate-800 mb-1">Children's privacy</h2>
          <p>
            FeynLearn is not directed at children under 13. We do not
            knowingly collect personal data from children under 13.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-slate-800 mb-1">Changes to this policy</h2>
          <p>
            We may update this policy from time to time. Material changes will
            be reflected by updating the "Last updated" date above.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-slate-800 mb-1">Contact</h2>
          <p>
            Questions about this policy or your data? Contact us at{' '}
            <a href="mailto:contact@feynlearn.com.br" className="text-violet-600 underline">
              contact@feynlearn.com.br
            </a>.
          </p>
        </section>
      </div>
    </div>
  )
}
