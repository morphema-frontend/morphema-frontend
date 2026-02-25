import Link from 'next/link'
import { describeReasonCode } from '@/lib/gating'

export default function GatedScreen({
  reasonCode,
  ctaHref,
}: {
  reasonCode: string
  ctaHref: string
}) {
  return (
    <div className="mx-auto mt-16 max-w-lg px-4">
      <div className="card text-center">
        <div className="badge">Access blocked</div>
        <h1 className="mt-3 text-xl font-semibold text-main">Complete onboarding to continue</h1>
        <p className="mt-2 text-sm text-soft">{describeReasonCode(reasonCode)}</p>
        <Link className="ghost-button mt-5 inline-flex" href={ctaHref}>
          <span>Complete onboarding</span>
          <span className="ghost-arrow accent" aria-hidden="true">
            &rarr;
          </span>
        </Link>
      </div>
    </div>
  )
}
