'use client'

import { useEffect, useMemo, useState } from 'react'
import { RequireAuth } from '@/components/RequireAuth'
import { ErrorBanner } from '@/components/ErrorBanner'
import { apiFetch } from '@/lib/api'
import type { Skill } from '@/lib/types'

export default function WorkerSkillsPage() {
  const [allSkills, setAllSkills] = useState<Skill[]>([])
  const [selected, setSelected] = useState<number[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<any>(null)

  useEffect(() => {
    ;(async () => {
      setError(null)
      try {
        const [skills, mine] = await Promise.all([
          apiFetch<Skill[]>('/skills', { auth: false }),
          apiFetch<{ skillIds: number[] }>('/users/me/skills'),
        ])
        setAllSkills(skills.filter((s) => s.active))
        setSelected(mine.skillIds)
      } catch (e) {
        setError(e)
      }
    })()
  }, [])

  const byJobType = useMemo(() => {
    const m = new Map<number, Skill[]>()
    for (const s of allSkills) {
      const arr = m.get(s.jobTypeId) || []
      arr.push(s)
      m.set(s.jobTypeId, arr)
    }
    return [...m.entries()].sort((a, b) => a[0] - b[0])
  }, [allSkills])

  async function save() {
    setBusy(true)
    setError(null)
    try {
      await apiFetch('/users/me/skills', { method: 'PUT', body: JSON.stringify({ skillIds: selected }) })
    } catch (e) {
      setError(e)
    } finally {
      setBusy(false)
    }
  }

  function toggle(id: number) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  return (
    <RequireAuth roles={['worker']}>
      <div className="grid gap-4">
        <div className="card">
          <h1 className="text-xl font-semibold">Your skills</h1>
          <p className="mt-1 text-sm text-soft">
            Seleziona le skill (puoi averne piu di una). Salva per aggiornare il profilo.
          </p>
        </div>

        {error ? <ErrorBanner title="Error" details={(error as any)?.payload ?? (error as any)?.message ?? error} /> : null}

        <div className="card">
          <div className="flex items-center justify-between">
            <div className="text-sm text-soft">Selected: {selected.length}</div>
            <button className="btn" disabled={busy} onClick={save}>
              {busy ? 'Saving...' : 'Save'}
            </button>
          </div>

          <div className="mt-4 grid gap-3">
            {byJobType.length === 0 ? <div className="text-sm text-soft">No skills catalog found.</div> : null}
            {byJobType.map(([jobTypeId, skills]) => (
              <div key={jobTypeId} className="rounded-lg border border-light p-3">
                <div className="text-sm font-semibold">JobType #{jobTypeId}</div>
                <div className="mt-2 grid gap-2 md:grid-cols-2">
                  {skills.map((s) => (
                    <label key={s.id} className="flex cursor-pointer items-center gap-2 rounded-md border border-light bg-surface p-2">
                      <input type="checkbox" checked={selected.includes(s.id)} onChange={() => toggle(s.id)} />
                      <span className="text-sm">{s.name}</span>
                      <span className="ml-auto badge">{s.code}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </RequireAuth>
  )
}
