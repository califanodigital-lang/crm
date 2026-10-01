import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { APP_VERSION, CHANGELOG } from '../constants/changelog'
import { formatDate } from '../utils/date'

export default function ChangelogCard() {
  const [expanded, setExpanded] = useState(false)
  const [latest, ...history] = CHANGELOG
  if (!latest) return null

  return <section className="card mt-6">
    <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-brand-blue">Aggiornamenti CRM</p>
        <h2 className="text-lg font-bold text-gray-900 mt-1">Ultimo aggiornamento <span className="text-sm font-medium text-gray-500">{APP_VERSION}</span></h2>
      </div>
      <span className="text-xs text-gray-500">{formatDate(latest.date)}</span>
    </div>
    <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600 marker:text-brand-blue">
      {latest.items.map((item, index) => <li key={index}>{item}</li>)}
    </ul>
    {history.length > 0 && <details className="mt-4 border-t border-gray-100 pt-3" onToggle={event => setExpanded(event.currentTarget.open)}>
      <summary className="flex items-center justify-between cursor-pointer list-none text-sm font-semibold text-brand-blue [&::-webkit-details-marker]:hidden">
        {expanded ? 'Chiudi storico aggiornamenti' : 'Mostra storico aggiornamenti'}
        <ChevronDown aria-hidden="true" className={`w-4 h-4 ${expanded ? 'rotate-180' : ''}`} />
      </summary>
      {expanded && <div className="space-y-4 mt-4">
        {history.map(entry => <article key={entry.version} className="border border-gray-100 rounded-xl p-4">
          <div className="flex justify-between gap-3 mb-2"><h3 className="font-semibold text-gray-900">{entry.version}</h3><span className="text-xs text-gray-500">{formatDate(entry.date)}</span></div>
          <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600 marker:text-brand-blue">{entry.items.map((item, index) => <li key={index}>{item}</li>)}</ul>
        </article>)}
      </div>}
    </details>}
  </section>
}
