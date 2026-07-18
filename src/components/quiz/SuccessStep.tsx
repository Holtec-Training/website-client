interface Props { variant: 'free' | 'paid'; email: string }

export default function SuccessStep({ variant, email }: Props) {
  return (
    <section className="qp-success">
      <div className="qp-success-check">✓</div>
      {variant === 'free' ? (
        <>
          <h1 className="qp-success-title">Check your inbox</h1>
          <p className="qp-success-body">
            Your program will arrive at <strong>{email}</strong> in about a minute. If it's not there, check your spam folder.
          </p>
        </>
      ) : (
        <>
          <h1 className="qp-success-title">Thanks — Milan's on it.</h1>
          <p className="qp-success-body">
            Milan will set up your Everfit account within 24 hours. You'll get an email from her when it's ready. In the meantime, we sent your welcome + subscription details to <strong>{email}</strong>.
          </p>
        </>
      )}
    </section>
  )
}
