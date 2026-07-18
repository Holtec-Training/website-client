import { loadStripe, type Stripe } from '@stripe/stripe-js'
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from '@stripe/react-stripe-js'

// Loaded once for the module — Stripe recommend a single call for the whole app.
let stripePromise: Promise<Stripe | null> | null = null
function getStripe(): Promise<Stripe | null> {
  if (!stripePromise) {
    const key = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
    if (!key) {
      console.error('VITE_STRIPE_PUBLISHABLE_KEY is not set')
      stripePromise = Promise.resolve(null)
    } else {
      stripePromise = loadStripe(key)
    }
  }
  return stripePromise
}

interface Props {
  clientSecret: string
  onBack: () => void
}

export default function EmbeddedCheckoutStep({ clientSecret, onBack }: Props) {
  return (
    <section className="qp-container">
      <button
        onClick={onBack}
        className="qp-back-link"
        type="button"
      >
        ← Back to results
      </button>

      <div className="qp-checkout-frame">
        <EmbeddedCheckoutProvider
          stripe={getStripe()}
          options={{ clientSecret }}
        >
          <EmbeddedCheckout />
        </EmbeddedCheckoutProvider>
      </div>
    </section>
  )
}
