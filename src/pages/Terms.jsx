import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export default function Terms() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-app-bg px-5 py-6 text-slate-800">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1 text-sm text-gray-500 mb-4"
      >
        <ArrowLeft size={16} /> Back
      </button>

      <h1 className="text-2xl font-bold mb-1">Terms of Service</h1>
      <p className="text-xs text-gray-500 mb-6">Last updated: July 27, 2026</p>

      <div className="space-y-5 text-sm leading-relaxed text-slate-700">
        <section>
          <p>
            These Terms of Service ("Terms") govern your use of FeynLearn (the
            "app"). By creating an account or using the app, you agree to
            these Terms.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-slate-800 mb-1">The service</h2>
          <p>
            FeynLearn helps you practice English by explaining what you've
            learned, with AI-generated feedback on your answers. Some features
            (Voice Mode, Teach Mode, custom lessons, unlimited AI feedback)
            require a paid Premium subscription.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-slate-800 mb-1">Your account</h2>
          <p>
            You must provide accurate information when creating an account and
            keep your login credentials secure. You're responsible for
            activity that happens under your account.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-slate-800 mb-1">Subscriptions and payment</h2>
          <p>
            Premium is a recurring subscription billed periodically through
            our payment processor, Mercado Pago. You can cancel anytime from
            the Profile screen; cancellation stops future renewals but doesn't
            retroactively refund the current billing period unless required
            by applicable consumer protection law (e.g. Brazil's Código de
            Defesa do Consumidor's 7-day right of withdrawal for online
            purchases).
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-slate-800 mb-1">Acceptable use</h2>
          <p>
            Don't use FeynLearn to submit unlawful, abusive, or harmful
            content, attempt to disrupt the service, or circumvent usage
            limits (e.g. the daily AI feedback quota on the free plan).
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-slate-800 mb-1">AI-generated feedback</h2>
          <p>
            Feedback on your lesson answers is generated automatically by an
            AI model (via OpenAI). It's meant to support your learning and may
            occasionally be inaccurate or incomplete — use your judgment.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-slate-800 mb-1">Disclaimer and limitation of liability</h2>
          <p>
            FeynLearn is provided "as is", without warranties of any kind. To
            the extent permitted by law, we're not liable for indirect or
            incidental damages arising from your use of the app.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-slate-800 mb-1">Changes</h2>
          <p>
            We may update these Terms from time to time. Continuing to use the
            app after changes take effect means you accept the updated Terms.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-slate-800 mb-1">Governing law</h2>
          <p>
            These Terms are governed by the laws of Brazil, without regard to
            conflict of law principles.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-slate-800 mb-1">Contact</h2>
          <p>
            Questions about these Terms? Contact us at{' '}
            <a href="mailto:contact@feynlearn.com.br" className="text-violet-600 underline">
              contact@feynlearn.com.br
            </a>.
          </p>
        </section>
      </div>
    </div>
  )
}
