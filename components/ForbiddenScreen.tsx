import Link from 'next/link'

export default function ForbiddenScreen() {
  return (
    <div className="mx-auto mt-16 max-w-lg px-4">
      <div className="card text-center">
        <div className="badge">403</div>
        <h1 className="mt-3 text-xl font-semibold text-main">Accesso negato</h1>
        <p className="mt-2 text-sm text-soft">Il tuo profilo non ha i permessi per accedere a questa area.</p>
        <Link className="ghost-button mt-5 inline-flex" href="/">
          <span>Torna alla home</span>
          <span className="ghost-arrow accent" aria-hidden="true">
            &rarr;
          </span>
        </Link>
      </div>
    </div>
  )
}
