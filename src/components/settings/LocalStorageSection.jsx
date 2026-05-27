import { useRef, useState } from 'react'
import useAppStore from '@/stores/useAppStore'
import {
  downloadFormaProject, exportToLocalDirectory, importFormaProjectFile,
  supportsDirectoryExport, getLocalStorageStats,
} from '@/lib/localStorage/formaProject'

export default function LocalStorageSection({ T }) {
  const addNotification = useAppStore((s) => s.addNotification)
  const fileRef = useRef(null)
  const [busy, setBusy] = useState(false)
  const stats = getLocalStorageStats()

  const exportFile = async () => {
    setBusy(true)
    try {
      const res = await downloadFormaProject({ label: 'forma-projet' })
      addNotification(`Export ${res.keyCount} clé(s)${res.compressed ? ' (compressé)' : ''}`, 'success')
    } catch (e) {
      addNotification(e.message || 'Export échoué', 'error')
    } finally {
      setBusy(false)
    }
  }

  const exportDir = async () => {
    setBusy(true)
    try {
      const res = await exportToLocalDirectory({ label: 'forma-backup' })
      addNotification(`Sauvegardé : ${res.fileName}`, 'success')
    } catch (e) {
      if (e.name !== 'AbortError') addNotification(e.message || 'Export dossier échoué', 'error')
    } finally {
      setBusy(false)
    }
  }

  const onImport = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
      const merge = confirm('Fusionner avec les données existantes ?\n\nOK = fusion (ne pas écraser)\nAnnuler = remplacer les clés importées')
    setBusy(true)
    try {
      const res = await importFormaProjectFile(file, { merge })
      addNotification(`${res.imported}/${res.total} entrée(s) importée(s). Rechargez la page.`, 'success')
    } catch (err) {
      addNotification(err.message || 'Import échoué', 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={card(T)}>
      <h3 style={sectionTitle}>Stockage local Forma</h3>
      <p style={hint}>
        Sauvegarde automatique sur cet appareil (carnets, dossiers, documents, préférences).
        {' '}{stats.keyCount} clé(s) · ~{stats.approxKb} Ko.
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        <Btn T={T} onClick={exportFile} disabled={busy}>⬇ Exporter .forma</Btn>
        {supportsDirectoryExport() && (
          <Btn T={T} onClick={exportDir} disabled={busy}>📁 Dossier local</Btn>
        )}
        <Btn T={T} onClick={() => fileRef.current?.click()} disabled={busy}>⬆ Importer</Btn>
        <input ref={fileRef} type="file" accept=".forma,.forma.gz,.json" hidden onChange={onImport} />
      </div>
      {!supportsDirectoryExport() && (
        <p style={{ ...hint, marginTop: 10, marginBottom: 0 }}>
          Sélection de dossier non disponible — utilisez l&apos;export fichier (.forma JSON).
        </p>
      )}
    </div>
  )
}

function Btn({ children, onClick, disabled, T }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} style={{
      padding: '8px 12px', borderRadius: 8, border: `1px solid ${T.border}`,
      background: T.surface, color: T.ink, fontSize: 12, fontWeight: 600,
      cursor: disabled ? 'wait' : 'pointer', opacity: disabled ? 0.6 : 1,
    }}>
      {children}
    </button>
  )
}

const sectionTitle = { margin: '0 0 12px', fontSize: 14, fontWeight: 700 }
const hint = { margin: '0 0 12px', fontSize: 12, color: '#8b95a8', lineHeight: 1.45 }
const card = (T) => ({
  background: T.surface || '#151820',
  border: `1px solid ${T.border || '#2a3144'}`,
  borderRadius: 12,
  padding: 16,
  marginBottom: 16,
})
