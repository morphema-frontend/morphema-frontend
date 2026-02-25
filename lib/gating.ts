export type GateInfo = {
  reasonCode: string
  message: string
}

const REASON_LABELS: Record<string, string> = {
  worker_onboarding_incomplete: 'Worker onboarding incomplete',
  venue_onboarding_incomplete: 'Venue onboarding incomplete',
  compliance_missing: 'Compliance requirements missing',
  documents_missing: 'Required documents missing',
  company_incomplete: 'Company profile incomplete',
}

export function describeReasonCode(reasonCode: string) {
  const normalized = reasonCode.trim()
  if (!normalized) return 'Access blocked: onboarding incomplete.'
  return REASON_LABELS[normalized] || `Access blocked: ${normalized.replace(/_/g, ' ')}.`
}

export async function readReasonCode(res: Response): Promise<string | null> {
  try {
    const text = await res.text()
    if (!text) return null
    const json = JSON.parse(text)
    if (json && typeof json === 'object') {
      if (typeof json.reason_code === 'string') return json.reason_code
      if (typeof json.reasonCode === 'string') return json.reasonCode
      if (typeof json.code === 'string') return json.code
    }
  } catch {
    return null
  }
  return null
}
