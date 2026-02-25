import MorphemaLogo from '@/components/MorphemaLogo'
import PrimaryGhostButton from '@/components/PrimaryGhostButton'

export default function WorkerHubPage() {
  return (
    <div className="landing-shell">
      <header className="landing-header">
        <MorphemaLogo />
      </header>

      <div className="card max-w-xl text-center">
        <div className="badge">Worker</div>
        <h1 className="mt-3 text-2xl font-semibold text-main">Accesso e registrazione</h1>
        <p className="mt-2 text-sm text-soft">
          Crea il profilo, completa onboarding e invia i documenti richiesti per lavorare.
        </p>
        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <PrimaryGhostButton href="/worker/auth/login" label="Login Worker" />
          <PrimaryGhostButton href="/worker/auth/signup" label="Signup Worker" arrowAccent />
        </div>
      </div>
    </div>
  )
}
