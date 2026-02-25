import MorphemaLogo from '@/components/MorphemaLogo'
import PrimaryGhostButton from '@/components/PrimaryGhostButton'

export default function LoginPage() {
  return (
    <div className="landing-shell">
      <header className="landing-header">
        <MorphemaLogo />
      </header>

      <div className="card max-w-xl text-center">
        <div className="badge">Access</div>
        <h1 className="mt-3 text-2xl font-semibold text-main">Scegli il percorso</h1>
        <p className="mt-2 text-sm text-soft">
          Accedi o registrati come worker o venue per completare il flusso onboarding.
        </p>
        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <PrimaryGhostButton href="/worker" label="Worker flow" />
          <PrimaryGhostButton href="/venue" label="Venue flow" arrowAccent />
        </div>
      </div>
    </div>
  )
}
