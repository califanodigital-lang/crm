// src/pages/ImportPage.jsx

import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Upload, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'
import * as XLSX from 'xlsx'
import { supabase } from '../lib/supabase'

export default function ImportPage() {
  const { userProfile } = useAuth()
  const [importing, setImporting] = useState(false)
  const [results, setResults] = useState(null)

  const cleanValue = (val) => {
    if (val === null || val === undefined || val === '' || val === 'nan') return null
    if (typeof val === 'number' && isNaN(val)) return null  // <-- AGGIUNGI
    if (typeof val === 'string') {
      return val.trim().replace(/[\x00-\x1f]/g, '')  // <-- Rimuovi caratteri speciali
    }
    return val
  }

  const parseExcelDate = (v) => {
  if (v === null || v === undefined || v === '') return null

  // Date object
  if (v instanceof Date && !isNaN(v)) {
    return v.toISOString().split('T')[0]
  }

  // String
  if (typeof v === 'string') {
    const s = v.trim()
    if (!s) return null
    const d = new Date(s)
    if (!isNaN(d)) return d.toISOString().split('T')[0]
    return s
  }

  // Excel serial
  if (typeof v === 'number' && !isNaN(v)) {
    const utc_days = Math.floor(v - 25569)
    const date = new Date(utc_days * 86400 * 1000)
    return isNaN(date) ? null : date.toISOString().split('T')[0]
  }

  return null
}

  const handleImportCreators = async (file) => {
      setImporting(true)
      const results = { success: 0, errors: [] }

      try {
        const data = await file.arrayBuffer()
        const workbook = XLSX.read(data)
        const worksheet = workbook.Sheets[workbook.SheetNames[0]]
        const rows = XLSX.utils.sheet_to_json(worksheet)

        console.log(`Processing ${rows.length} creators...`)

        for (const row of rows) {
          try {
            const creator = {
              nome: cleanValue(row['NOME']),
              nome_completo: cleanValue(row['NOME COMPLETO']),
              integrazione_video_youtube: parseFloat(row['INTEGRAZIONE VIDEO YUTUBE']) || null,
              video_short_form: parseFloat(row['VIDEO SHORT FORM + STORIES']) || null,
              story_set: parseFloat(row['STORY SET ']) || null,
              logo_schermo_twitch: parseFloat(row['LOGO A SCHERMO + CTA TWITCH']) || null,
              collaborazioni_lunghe: parseFloat(row['COLLABORAZIONI LUNGHE']) || null,
              fiere_eventi: parseFloat(row['FIERE ED EVENTI']) || null,
              obiettivo: cleanValue(row['OBIETTIVO']),
              preferenza_collaborazioni: cleanValue(row['PREFERENZA COLLABORAZIONI ']),
              strategia: cleanValue(row['STRATEGIA']),
              mediakit: cleanValue(row['MEDIAKIT']),
              ultimo_aggiornamento_mediakit: parseExcelDate(row['ULTIMO AGGIORNAMENTO MEDIAKIT']),
              data_firma_contratto: parseExcelDate(row['DATA FIRMA CONTRATTO']),
              sales: cleanValue(row['SALES']),
              categoria_adv: cleanValue(row['CATEGORIA ADV']),
            }

            if (!creator.nome) {
              results.errors.push(`Row skipped: missing NOME`)
              continue
            }

            const { error } = await supabase
              .from('creators')
              .insert([creator])

            if (error) {
              results.errors.push(`${creator.nome}: ${error.message}`)
            } else {
              results.success++
            }
          } catch (err) {
            results.errors.push(`Row error: ${err.message}`)
          }
        }
      } catch (err) {
        results.errors.push(`File error: ${err.message}`)
      }

      setResults(results)
      setImporting(false)
    }

    const handleImportBrands = async (file) => {
  setImporting(true)
  const results = { success: 0, errors: [], skipped: 0 }

  try {
    const data = await file.arrayBuffer()
    const workbook = XLSX.read(data)
    const worksheet = workbook.Sheets[workbook.SheetNames[0]]
    const rows = XLSX.utils.sheet_to_json(worksheet)

    console.log(`Processing ${rows.length} brands...`)

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      try {
        const nome = cleanValue(row['BRAND'])
        if (!nome) {
          results.skipped++
          continue
        }

        // Brand object - MAPPING CORRETTO
        const brand = {
          nome: nome,
          settore: cleanValue(row['SETTORE']),
          target_dem: cleanValue(row['TARGET DEM']),              // ✅ target_dem
          topic_target: cleanValue(row['TOPIC EL TARGET']),
          data_contatto: parseExcelDate(row['DATA CONTATTO']),
          categoria: cleanValue(row['Categoria']),                // ✅ text, non array
          risposta: cleanValue(row['RISPOSTA']),
          contattato_per: cleanValue(row['CONTATTATO PER']),
          referenti: cleanValue(row['REFERENTI E RUOLO']),
          contatto: cleanValue(row['MAIL']),                         // ✅ email, non contatto
          telefono: cleanValue(row['TELEFONO']),
          agente: cleanValue(row['AGENTE']),
          sito_web: cleanValue(row['SITO WEB']),
          note: cleanValue(row['NOTE']),
          categoria_adv: cleanValue(row['CATEGORIA ADV']),
          creator_suggeriti: cleanValue(row['CREATOR SUGGERITI']), // ✅ text, non array
          priorita: 'NORMALE'
          // stato: RIMOSSO - non esiste in DB
        }

        const { error } = await supabase
          .from('brands')
          .insert([brand])

        if (error) {
          console.error("INSERT ERROR:", {
            row: i + 1,
            nome,
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          })
          
          if (error.code === '23505') {
            results.skipped++
          } else {
            results.errors.push(`Row ${i + 1} (${nome}): ${error.message}`)
          }
        } else {
          results.success++
        }

        if ((i + 1) % 50 === 0) {
          console.log(`✓ ${i + 1}/${rows.length}`)
        }

      } catch (err) {
        results.errors.push(`Row ${i + 1}: ${err.message}`)
      }
    }
  } catch (err) {
    results.errors.push(`File error: ${err.message}`)
  }

  console.log(`✅ Done: ${results.success} success, ${results.skipped} skipped, ${results.errors.length} errors`)
  setResults(results)
  setImporting(false)
}

  if (userProfile?.role !== 'ADMIN') {
    return <div className="card"><p>Accesso negato - Solo Amministratori</p></div>
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Import Dati Excel</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Import Creators */}
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <Upload className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-bold">Import Creator</h2>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Carica file _CLIENTI.xlsx per importare tutti i creator
          </p>
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={(e) => e.target.files[0] && handleImportCreators(e.target.files[0])}
            disabled={importing}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>

        {/* Import Brands */}
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <Upload className="w-6 h-6 text-green-600" />
            <h2 className="text-xl font-bold">Import Brand</h2>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Carica file _BRAND.xlsx per importare tutti i brand
          </p>
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={(e) => e.target.files[0] && handleImportBrands(e.target.files[0])}
            disabled={importing}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
          />
        </div>
      </div>

      {/* Loading */}
      {importing && (
        <div className="card bg-blue-50 border-blue-200">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <p className="font-semibold text-blue-900">Importazione in corso...</p>
          </div>
        </div>
      )}

      {/* Results */}
      {results && !importing && (
        <div className="card">
          <h3 className="text-lg font-bold mb-4">Risultati Importazione</h3>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-green-900">{results.success}</p>
                <p className="text-sm text-green-700">Importati</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-red-50 rounded-lg">
              <XCircle className="w-8 h-8 text-red-600" />
              <div>
                <p className="text-2xl font-bold text-red-900">{results.errors.length}</p>
                <p className="text-sm text-red-700">Errori</p>
              </div>
            </div>
          </div>

          {results.errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3 mb-3">
                <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                <h4 className="font-semibold text-red-900">Errori:</h4>
              </div>
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {results.errors.map((err, idx) => (
                  <p key={idx} className="text-sm text-red-700">• {err}</p>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Instructions */}
      <div className="card bg-gray-50">
        <h3 className="font-bold mb-3">📋 Istruzioni:</h3>
        <ol className="space-y-2 text-sm text-gray-700">
          <li>1. <strong>Importa prima i Creator</strong> (necessari per link brand)</li>
          <li>2. <strong>Importa poi i Brand</strong></li>
          <li>3. I duplicati saranno rifiutati (verifica via nome)</li>
          <li>4. Categorie brand separate da virgola</li>
          <li>5. Creator Suggeriti da configurare manualmente dopo</li>
        </ol>
      </div>
    </div>
  )
}
