import MorphemaLogo from '@/components/MorphemaLogo'
import PrimaryGhostButton from '@/components/PrimaryGhostButton'

export default function VenueHubPage() {
  return (
    <div className="landing-shell">
      <header className="landing-header">
        <MorphemaLogo />
      </header>

      <div className="card max-w-xl text-center">
        <div className="badge">Venue</div>
        <h1 className="mt-3 text-2xl font-semibold text-main">Accesso e registrazione</h1>
        <p className="mt-2 text-sm text-soft">
          Registra la struttura, completa onboarding e pubblica incarichi in modo conforme.
        </p>
        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <PrimaryGhostButton href="/venue/auth/login" label="Login Venue" />
          <PrimaryGhostButton href="/venue/auth/signup" label="Signup Venue" arrowAccent />
        </div>
      </div>
    </div>
  )
}
