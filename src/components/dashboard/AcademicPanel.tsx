/**
 * AcademicPanel — bloc session académique du dashboard : session courante,
 * semaine N/total avec progression, et définition rapide d'une session.
 */
import { useEffect, useState } from 'react'
import { Icon } from '../ui/Icon'
import {
  createSession,
  currentSession,
  sessionLabel,
  TERM_LABELS,
  todayISO,
  weekInfo,
} from '../../services/academic'
import type { AcademicSession, AcademicTerm } from '../../types'

export function AcademicPanel() {
  const [session, setSession] = useState<AcademicSession | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [term, setTerm] = useState<AcademicTerm>('automne')
  const [year, setYear] = useState(new Date().getFullYear())
  const [startDate, setStartDate] = useState(todayISO())

  const reload = async () => {
    setSession((await currentSession()) ?? null)
    setLoaded(true)
  }
  useEffect(() => { void Promise.resolve().then(reload) }, [])

  const create = async () => {
    await createSession({ term, year, startDate })
    setShowForm(false)
    await reload()
  }

  if (!loaded) return null
  const info = session ? weekInfo(session, todayISO()) : null

  return (
    <section className="rounded-2xl border border-forma-border bg-forma-surface p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-forma-text inline-flex items-center gap-1.5">
          <Icon name="book" className="w-4 h-4 text-forma-accent" />
          Session académique
        </h2>
        {session && (
          <button type="button" onClick={() => setShowForm((v) => !v)} className="text-xs text-forma-accent hover:underline">
            {showForm ? 'Fermer' : 'Modifier'}
          </button>
        )}
      </div>

      {session && !showForm ? (
        <div>
          <p className="text-sm font-medium text-forma-text">{sessionLabel(session)}</p>
          {info?.week ? (
            <>
              <p className="text-xs text-forma-muted mb-2">Semaine {info.week} sur {info.totalWeeks}</p>
              <div className="w-full bg-forma-bg rounded-full h-2 overflow-hidden">
                <div className="bg-forma-accent h-full rounded-full transition-all" style={{ width: `${info.progress}%` }} />
              </div>
            </>
          ) : (
            <p className="text-xs text-forma-muted">{info && info.progress === 100 ? 'Session terminée' : 'Session pas encore commencée'}</p>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {!session && <p className="text-xs text-forma-muted mb-1">Définissez votre session pour suivre les semaines 1–{15}.</p>}
          <div className="grid grid-cols-3 gap-2">
            <select value={term} onChange={(e) => setTerm(e.target.value as AcademicTerm)} className="text-xs border border-forma-border rounded-lg px-2 py-1.5 bg-forma-bg">
              {(Object.keys(TERM_LABELS) as AcademicTerm[]).map((t) => <option key={t} value={t}>{TERM_LABELS[t]}</option>)}
            </select>
            <input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} className="text-xs border border-forma-border rounded-lg px-2 py-1.5 bg-forma-bg" />
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} title="Début (lundi de la semaine 1)" className="text-xs border border-forma-border rounded-lg px-2 py-1.5 bg-forma-bg" />
          </div>
          <button type="button" onClick={() => void create()} className="text-xs px-3 py-1.5 rounded-lg bg-forma-accent text-white hover:bg-forma-accent-hover transition-colors">
            {session ? 'Mettre à jour' : 'Définir la session'}
          </button>
        </div>
      )}
    </section>
  )
}
