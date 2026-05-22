import { useState } from 'react'
import toast from 'react-hot-toast'

const OPTIONS = [
  {
    key: 'allow',
    label: 'Accepted',
    desc: 'Download only approved / eligible results',
    icon: '✅',
    bg: 'linear-gradient(135deg, #d1fae5, #a7f3d0)',
    border: '#6ee7b7',
    color: '#065f46',
    badge: '#16a34a',
  },
  {
    key: 'deny',
    label: 'Rejected',
    desc: 'Download only denied / not-eligible results',
    icon: '❌',
    bg: 'linear-gradient(135deg, #fee2e2, #fecaca)',
    border: '#fca5a5',
    color: '#7f1d1d',
    badge: '#dc2626',
  },
  {
    key: 'flag',
    label: 'Under Review',
    desc: 'Download only flagged / needs-review results',
    icon: '🚩',
    bg: 'linear-gradient(135deg, #fef9c3, #fde68a)',
    border: '#fcd34d',
    color: '#78350f',
    badge: '#d97706',
  },
  {
    key: 'all',
    label: 'All Results',
    desc: 'Download all evaluations in one PDF',
    icon: '📄',
    bg: 'linear-gradient(135deg, #e0e7ff, #c7d2fe)',
    border: '#a5b4fc',
    color: '#1e1b4b',
    badge: '#4f6ef7',
  },
]

/**
 * PDFDownloadModal
 * Props:
 *   open        {boolean}
 *   onClose     {() => void}
 *   onDownload  {(filterKey: string) => void | {empty: true}}
 *   title       {string}   (optional)
 *   loading     {boolean}  (optional)
 */
export default function PDFDownloadModal({ open, onClose, onDownload, title = 'Download PDF Report', loading = false }) {
  const [selected, setSelected] = useState(null)
  const [isDownloading, setIsDownloading] = useState(false)
  const [hoveredKey, setHoveredKey] = useState(null)

  const handleDownload = async () => {
    if (!selected) return
    setIsDownloading(true)
    try {
      const result = onDownload(selected)
      if (result?.empty) {
        toast.error(`No ${OPTIONS.find(o => o.key === selected)?.label || ''} results to download.`)
      } else if (!result?.skipped) {
        toast.success('PDF downloaded successfully! 🎉')
        onClose()
        setSelected(null)
      } else {
        toast.error('This result does not match the selected filter.')
      }
    } catch (err) {
      toast.error('Failed to generate PDF')
      console.error(err)
    }
    setIsDownloading(false)
  }

  if (!open) return null

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(15, 23, 42, 0.55)',
        backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
        animation: 'fadeInOverlay 0.2s ease',
      }}
      onClick={e => { if (e.target === e.currentTarget) { onClose(); setSelected(null) } }}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 20,
          padding: '32px 28px 24px',
          width: '100%',
          maxWidth: 500,
          boxShadow: '0 24px 64px rgba(15,23,42,0.22)',
          animation: 'slideUpModal 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: 'linear-gradient(135deg, #4f6ef7, #7c3aed)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18,
              }}>📥</div>
              <h2 style={{ fontSize: 17, fontWeight: 700, color: '#0f172a', margin: 0 }}>{title}</h2>
            </div>
            <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 0 46px' }}>
              Choose which results to include in the PDF
            </p>
          </div>
          <button
            onClick={() => { onClose(); setSelected(null) }}
            style={{
              width: 30, height: 30, borderRadius: 8,
              background: '#f1f5f9', border: 'none', cursor: 'pointer',
              fontSize: 16, color: '#64748b', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#e2e8f0'}
            onMouseLeave={e => e.currentTarget.style.background = '#f1f5f9'}
          >✕</button>
        </div>

        {/* Option cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
          {OPTIONS.map(opt => {
            const isSelected = selected === opt.key
            const isHovered = hoveredKey === opt.key
            return (
              <button
                key={opt.key}
                onClick={() => setSelected(opt.key)}
                onMouseEnter={() => setHoveredKey(opt.key)}
                onMouseLeave={() => setHoveredKey(null)}
                style={{
                  border: `2px solid ${isSelected ? opt.badge : isHovered ? opt.border : '#e2e8f0'}`,
                  borderRadius: 14,
                  padding: '14px 14px 12px',
                  background: isSelected ? opt.bg : isHovered ? '#f8faff' : '#fafafa',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.18s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  transform: isSelected ? 'scale(1.03)' : isHovered ? 'scale(1.01)' : 'scale(1)',
                  boxShadow: isSelected
                    ? `0 4px 16px ${opt.badge}30`
                    : isHovered ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {isSelected && (
                  <div style={{
                    position: 'absolute', top: 8, right: 8,
                    width: 18, height: 18, borderRadius: '50%',
                    background: opt.badge,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10, color: '#fff', fontWeight: 700,
                  }}>✓</div>
                )}
                <div style={{ fontSize: 22, marginBottom: 6 }}>{opt.icon}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: isSelected ? opt.color : '#0f172a', marginBottom: 3 }}>
                  {opt.label}
                </div>
                <div style={{ fontSize: 10, color: isSelected ? opt.color : '#64748b', lineHeight: 1.4 }}>
                  {opt.desc}
                </div>
              </button>
            )
          })}
        </div>

        {/* Selected info */}
        {selected && (
          <div style={{
            background: '#f0f9ff', border: '1px solid #bae6fd',
            borderRadius: 10, padding: '10px 14px',
            fontSize: 12, color: '#0369a1',
            marginBottom: 16,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <span>ℹ️</span>
            <span>
              PDF will include only <strong>{OPTIONS.find(o => o.key === selected)?.label}</strong> results,
              sorted and formatted with full rule breakdown.
            </span>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => { onClose(); setSelected(null) }}
            style={{
              flex: 1, padding: '11px', borderRadius: 11, border: '1px solid #e2e8f0',
              background: '#fff', fontSize: 13, fontWeight: 600,
              color: '#475569', cursor: 'pointer', transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#cbd5e1' }}
            onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#e2e8f0' }}
          >
            Cancel
          </button>
          <button
            onClick={handleDownload}
            disabled={!selected || isDownloading || loading}
            style={{
              flex: 2, padding: '11px', borderRadius: 11, border: 'none',
              background: !selected || isDownloading || loading
                ? '#e2e8f0'
                : 'linear-gradient(135deg, #4f6ef7, #7c3aed)',
              color: !selected || isDownloading || loading ? '#94a3b8' : '#fff',
              fontSize: 13, fontWeight: 700,
              cursor: !selected || isDownloading || loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.18s',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              boxShadow: selected && !isDownloading ? '0 4px 14px rgba(79,110,247,0.35)' : 'none',
            }}
          >
            {isDownloading ? (
              <>
                <div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                Generating PDF…
              </>
            ) : (
              <>📥 Download PDF</>
            )}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeInOverlay { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUpModal { from { opacity: 0; transform: translateY(20px) scale(0.97) } to { opacity: 1; transform: translateY(0) scale(1) } }
        @keyframes spin { to { transform: rotate(360deg) } }
      `}</style>
    </div>
  )
}
