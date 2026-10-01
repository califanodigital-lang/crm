import { useDeferredValue, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { BookOpen, ArrowUpRight, Search } from 'lucide-react'
import { DOCUMENTATION, searchDocumentation } from '../constants/documentation'
import { useAuth } from '../contexts/AuthContext'
import { canAccessAdministration } from '../utils/permissions'

export default function DocsPage() {
  const [params, setParams] = useSearchParams()
  const [query, setQuery] = useState('')
  const deferredQuery = useDeferredValue(query)
  const guides = searchDocumentation(deferredQuery)
  const selected = guides.find(guide => guide.id === params.get('section')) || guides[0]
  const { userProfile } = useAuth()
  const isAdmin = canAccessAdministration(userProfile)
  const selectGuide = id => setParams({ section: id })

  return (
    <div className="max-w-7xl mx-auto">
      <header className="rounded-2xl bg-gradient-to-br from-blue-950 to-blue-800 text-white p-6 lg:p-9 mb-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-yellow-300 flex items-center gap-2"><BookOpen className="w-4 h-4" /> C3 Agency / Docs</p>
        <h1 className="text-3xl lg:text-4xl font-bold mt-3">Il CRM, spiegato bene.</h1>
        <p className="text-blue-100 mt-3 max-w-2xl">Guide operative, dal primo contatto al saldo. Scegli una sezione o cerca una parola: trovi cosa fare, cosa controllare e cosa evitare.</p>
      </header>
      <div className="grid lg:grid-cols-[260px_minmax(0,1fr)] gap-6 items-start">
        <aside className="lg:sticky lg:top-6 rounded-2xl border border-gray-200 bg-white p-4">
          <label htmlFor="docs-search" className="text-xs font-semibold uppercase tracking-wider text-gray-500">Cerca nelle guide</label>
          <div className="relative mt-2 mb-4">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" aria-hidden="true" />
            <input id="docs-search" type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Es. rimborsi, fatture..." className="w-full rounded-xl border border-gray-200 pl-9 pr-3 py-2 text-sm" />
          </div>
          <p className="text-xs text-gray-500 mb-3" role="status">{guides.length} guide disponibili</p>
          <label htmlFor="docs-section" className="sr-only">Sezione della guida</label>
          <select id="docs-section" className="lg:hidden w-full rounded-lg border border-gray-200 p-2" value={selected?.id || ''} onChange={event => selectGuide(event.target.value)} disabled={!guides.length}>
            {!guides.length && <option value="">Nessun risultato</option>}
            {guides.map(guide => <option key={guide.id} value={guide.id}>{guide.title}</option>)}
          </select>
          <nav aria-label="Indice documentazione" className="hidden lg:block max-h-[65vh] overflow-y-auto space-y-1">
            {guides.map((guide, index) => <div key={guide.id}>
              {guides[index - 1]?.group !== guide.group && <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 pt-4 pb-2">{guide.group}</p>}
              <Link to={`/docs?section=${guide.id}`} aria-current={selected?.id === guide.id ? 'page' : undefined} className={`block rounded-lg px-3 py-2 text-sm ${selected?.id === guide.id ? 'bg-yellow-100 text-blue-950 font-semibold' : 'text-gray-600 hover:bg-blue-50'}`}>{guide.title}</Link>
            </div>)}
          </nav>
        </aside>
        {selected ? <article key={selected.id} className="min-w-0 rounded-2xl border border-gray-200 bg-white p-6 lg:p-9" aria-labelledby="guide-title">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-700">{selected.group}</p>
            {selected.adminOnly && <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">Sezione riservata agli Admin</span>}
            {selected.route && (!selected.adminOnly || isAdmin) && <Link to={selected.route} className="text-sm font-semibold text-blue-800 inline-flex items-center gap-1">Apri sezione <ArrowUpRight className="w-4 h-4" /></Link>}
          </div>
          <h2 id="guide-title" className="text-2xl lg:text-3xl font-bold text-gray-900">{selected.title}</h2>
          <p className="text-gray-500 mt-3 leading-relaxed">{selected.summary}</p>
          <nav aria-label="In questa guida" className="flex flex-wrap gap-2 border-y border-gray-100 py-4 my-6">
            {selected.topics.map((item, index) => <a key={item.title} href={`#${selected.id}-${index}`} className="text-xs bg-blue-50 text-blue-800 px-3 py-2 rounded-lg hover:bg-blue-100">{item.title}</a>)}
          </nav>
          <div className="space-y-8">
            {selected.topics.map((item, index) => <section key={item.title} id={`${selected.id}-${index}`} className="scroll-mt-20">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">{item.title}</h3>
              <div className="space-y-3 text-sm lg:text-base leading-relaxed text-gray-600">{item.paragraphs.map(paragraph => <p key={paragraph}>{paragraph}</p>)}</div>
              {item.steps.length > 0 && <ol className="mt-4 list-decimal pl-5 space-y-2 text-sm lg:text-base text-gray-700">{item.steps.map(step => <li key={step} className="pl-1 leading-relaxed">{step}</li>)}</ol>}
            </section>)}
          </div>
          <footer className="mt-8 border-t border-gray-100 pt-5 text-xs text-gray-500">Guida aggiornata al 1 ottobre 2026. Per dati o accordi specifici, verifica sempre il record e i documenti collegati.</footer>
        </article> : <div className="rounded-2xl border border-gray-200 bg-white p-8"><h2 className="font-semibold">Nessuna guida trovata</h2><p className="text-gray-500 mt-2">Prova una parola diversa o una ricerca piu breve.</p><button className="btn-secondary mt-4" onClick={() => setQuery('')}>Mostra tutte le guide</button></div>}
      </div>
    </div>
  )
}
