import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { generatePolicy, previewPolicy } from '../api/endpoints'
import toast from 'react-hot-toast'
import {
  Wand2, Save, Brain, Layers,
  CheckCircle, XCircle, Flag, Copy, Check,
  AlertCircle, RotateCcw, ArrowRight, Tag,
  CreditCard, Users, HeartPulse, KeyRound
} from 'lucide-react'

const EXAMPLE_PROMPTS = [
  {
    label:  'Loan Eligibility',
    icon:   CreditCard,
    prompt: 'Create a loan eligibility policy. Approve applicants who are over 18 years old, have a credit score above 600, and are employed full-time. Deny applicants under 18, or with credit score below 300. Flag applications where credit score is between 300 and 600 for manual review.',
  },
  {
    label:  'KYC Compliance',
    icon:   Users,
    prompt: 'Create a KYC compliance policy. Allow users who have verified email, phone number, and government ID. Deny users with a risk score above 80 or accounts flagged as suspicious. Flag new users for review if any document is missing.',
  },
  {
    label:  'Health Insurance',
    icon:   HeartPulse,
    prompt: 'Create a health insurance eligibility policy. Approve applicants aged 18 to 60 with no pre-existing chronic conditions and BMI under 35. Deny applicants above 70 years old. Flag applications from smokers or applicants with BMI over 30 for additional review.',
  },
  {
    label:  'Employee Access',
    icon:   KeyRound,
    prompt: 'Create an employee system access control policy. Allow access to employees with active status, role set to admin or manager, and department in Engineering or Operations. Deny access to terminated employees. Flag contract workers for limited access review.',
  },
]

const ACTION_META = {
  allow: { bg: '#dcfce7', text: '#166534', border: '#bbf7d0', icon: CheckCircle, label: 'ALLOW' },
  deny:  { bg: '#fee2e2', text: '#991b1b', border: '#fca5a5', icon: XCircle,     label: 'DENY'  },
  flag:  { bg: '#fef9c3', text: '#854d0e', border: '#fde047', icon: Flag,        label: 'FLAG'  },
}

// ── Rule Card ─────────────────────────────────────────────────
function RuleCard({ rule, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen)
  const meta   = ACTION_META[rule.actions?.[0]?.type] || ACTION_META.allow
  const Icon   = meta.icon

  return (
    <div style={{ border: '1px solid #e4e7ed', borderRadius: 12, overflow: 'hidden', background: '#fff' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 10,
          padding: '11px 14px', background: 'none', border: 'none',
          cursor: 'pointer', textAlign: 'left',
        }}
      >
        <span style={{
          width: 26, height: 26, borderRadius: 7, flexShrink: 0,
          background: meta.bg, color: meta.text, border: `1px solid ${meta.border}`,
          fontSize: 10, fontWeight: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {rule.priority}
        </span>
        <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: '#111827' }}>{rule.name}</span>
        {rule.description && (
          <span style={{ fontSize: 11, color: '#9ca3af', marginRight: 4 }}>{rule.description}</span>
        )}
        <span style={{
          display: 'flex', alignItems: 'center', gap: 4,
          fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 20,
          background: meta.bg, color: meta.text, border: `1px solid ${meta.border}`,
          flexShrink: 0,
        }}>
          <Icon size={10} /> {meta.label}
        </span>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, color: '#9ca3af', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>
          <path d="M2.5 5L7 9.5L11.5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div style={{ padding: '0 14px 13px', borderTop: '1px solid #f3f4f6' }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '10px 0 8px' }}>
            Conditions ({rule.logic})
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {rule.conditions?.map((c, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 11, fontFamily: 'monospace', background: '#eef2ff', color: '#3730a3', padding: '3px 8px', borderRadius: 6, border: '1px solid #e0e7ff' }}>{c.field}</span>
                <span style={{ fontSize: 11, color: '#9ca3af' }}>{c.operator}</span>
                <span style={{ fontSize: 11, fontFamily: 'monospace', fontWeight: 600, background: '#f9fafb', color: '#111827', padding: '3px 8px', borderRadius: 6, border: '1px solid #e4e7ed' }}>{c.value}</span>
                <span style={{ fontSize: 10, color: '#9ca3af', background: '#f3f4f6', padding: '2px 6px', borderRadius: 5 }}>{c.data_type}</span>
              </div>
            ))}
          </div>
          {rule.actions?.[0]?.message && (
            <div style={{ display: 'flex', gap: 6, marginTop: 10, alignItems: 'flex-start' }}>
              <ArrowRight size={11} color="#9ca3af" style={{ flexShrink: 0, marginTop: 2 }} />
              <span style={{ fontSize: 11, fontStyle: 'italic', color: meta.text }}>{rule.actions[0].message}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Preview Panel ─────────────────────────────────────────────
function PolicyPreview({ preview, onSave, isSaving }) {
  const [copied, setCopied] = useState(false)
  const { policy, rules = [] } = preview

  const counts = rules.reduce((acc, r) => {
    const t = r.actions?.[0]?.type || 'allow'
    acc[t] = (acc[t] || 0) + 1
    return acc
  }, {})

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(preview, null, 2))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const CAT_COLOR = {
    Financial:         { bg: '#dcfce7', text: '#166534' },
    Compliance:        { bg: '#eef2ff', text: '#3730a3' },
    Security:          { bg: '#fee2e2', text: '#991b1b' },
    'Access Control':  { bg: '#fef9c3', text: '#854d0e' },
    'Data Governance': { bg: '#e0f2fe', text: '#075985' },
    Other:             { bg: '#f3f4f6', text: '#374151' },
  }
  const catStyle = CAT_COLOR[policy.category] || CAT_COLOR.Other

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* Policy info */}
      <div style={{ background: '#fff', border: '1px solid #e4e7ed', borderRadius: 14, padding: '18px 18px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#111827', margin: 0 }}>{policy.name}</h3>
              <span style={{ fontSize: 10, background: '#f3f4f6', color: '#6b7280', padding: '2px 8px', borderRadius: 20, fontWeight: 600 }}>draft</span>
            </div>
            <p style={{ fontSize: 12, color: '#6b7280', margin: 0, lineHeight: 1.5 }}>{policy.description}</p>
          </div>
          <span style={{ fontSize: 11, fontWeight: 600, background: catStyle.bg, color: catStyle.text, padding: '4px 10px', borderRadius: 20, flexShrink: 0, border: `1px solid ${catStyle.bg}` }}>
            {policy.category}
          </span>
        </div>

        {policy.tags?.length > 0 && (
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 12 }}>
            {policy.tags.map(t => (
              <span key={t} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, background: '#f9fafb', color: '#9ca3af', padding: '3px 8px', borderRadius: 20, border: '1px solid #f3f4f6' }}>
                <Tag size={8} /> {t}
              </span>
            ))}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {[['allow', 'Eligible'], ['deny', 'Denied'], ['flag', 'Review']].map(([type, label]) => {
            const m = ACTION_META[type]
            return (
              <div key={type} style={{ background: m.bg, border: `1px solid ${m.border}`, borderRadius: 10, padding: '8px 10px', textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: m.text }}>{counts[type] || 0}</div>
                <div style={{ fontSize: 10, color: m.text, marginTop: 1 }}>{label} rules</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Rules list */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 9 }}>
          <Layers size={13} color="#9ca3af" />
          <span style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {rules.length} Generated Rules
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          {rules.map((r, i) => (
            <RuleCard key={i} rule={r} defaultOpen={i === 0} />
          ))}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={onSave}
          disabled={isSaving}
          style={{
            flex: 1, background: '#4f6ef7', color: '#fff', border: 'none',
            borderRadius: 11, padding: '12px', fontSize: 13, fontWeight: 600,
            cursor: isSaving ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
            opacity: isSaving ? 0.6 : 1, transition: 'opacity 0.15s',
          }}
        >
          {isSaving
            ? <><div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /> Saving...</>
            : <><Save size={14} /> Save Policy & Rules</>}
        </button>
        <button
          onClick={handleCopy}
          style={{
            background: '#f9fafb', color: '#374151',
            border: '1px solid #e4e7ed', borderRadius: 11,
            padding: '12px 16px', fontSize: 13, fontWeight: 500,
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
          }}
        >
          {copied
            ? <><Check size={13} color="#16a34a" /> Copied</>
            : <><Copy size={13} /> JSON</>}
        </button>
      </div>
    </div>
  )
}

// ── Generating State ──────────────────────────────────────────
function GeneratingState() {
  return (
    <div style={{
      background: '#fff', border: '1px solid #e4e7ed', borderRadius: 14,
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '72px 20px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    }}>
      <div style={{ width: 56, height: 56, borderRadius: 16, background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
        <Brain size={26} color="#4f6ef7" />
      </div>
      <p style={{ fontWeight: 700, fontSize: 15, color: '#111827', margin: '0 0 6px' }}>Generating your policy…</p>
      <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 20px' }}>Building rules, conditions &amp; actions</p>
      <div style={{ display: 'flex', gap: 6 }}>
        {[0, 1, 2, 3].map(i => (
          <div key={i} style={{
            width: 7, height: 7, borderRadius: '50%', background: '#4f6ef7',
            animation: `dotPulse 1.2s ease-in-out ${i * 0.2}s infinite`,
          }} />
        ))}
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════
export default function AIGeneratorPage() {
  const navigate    = useNavigate()
  const qc          = useQueryClient()
  const textareaRef = useRef(null)

  const [prompt,     setPrompt]     = useState('')
  const [preview,    setPreview]    = useState(null)
  const [generating, setGenerating] = useState(false)

  const previewMut = useMutation({
    mutationFn: (p) => previewPolicy({ prompt: p }),
    onMutate:   () => { setGenerating(true); setPreview(null) },
    onSuccess:  (data) => { setPreview(data); setGenerating(false) },
    onError:    (err)  => { setGenerating(false); toast.error(err.response?.data?.detail || 'Generation failed.') },
  })

  const saveMut = useMutation({
    mutationFn: (p) => generatePolicy({ prompt: p, save_to_db: true }),
    onSuccess: (data) => {
      qc.invalidateQueries(['policies'])
      toast.success(`"${data.policy_name}" saved with ${data.rules_count} rules!`)
      navigate(`/policies/${data.policy_id}`)
    },
    onError: (err) => toast.error(err.response?.data?.detail || 'Save failed.'),
  })

  const handleGenerate = () => {
    if (prompt.trim().length < 10) { toast.error('Please write at least one sentence.'); return }
    previewMut.mutate(prompt)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleGenerate()
  }

  const isDisabled = generating || saveMut.isPending || prompt.trim().length < 10

  return (
    <div style={{ padding: 28, background: '#f8f9fb', minHeight: '100vh', fontFamily: 'system-ui, -apple-system, sans-serif' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 26 }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: '#4f6ef7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Wand2 size={18} color="#fff" />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: '#111827', margin: 0 }}>AI Policy Generator</h1>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#4f6ef7', background: '#eef2ff', border: '1px solid #c7d2fe', borderRadius: 20, padding: '2px 10px' }}>
              Powered by Claude
            </span>
          </div>
          <p style={{ color: '#6b7280', fontSize: 12, margin: '3px 0 0' }}>
            Describe your policy in plain English — AI generates rules, conditions &amp; actions.
          </p>
        </div>
      </div>

      {/* Two-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start' }}>

        {/* ── Left: Input ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Example chips */}
          <div>
            <p style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 8px' }}>
              Try an example
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7 }}>
              {EXAMPLE_PROMPTS.map(ex => {
                const ExIcon = ex.icon
                return (
                  <button
                    key={ex.label}
                    onClick={() => { setPrompt(ex.prompt); setPreview(null); textareaRef.current?.focus() }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '10px 13px', background: '#fff',
                      border: '1px solid #e4e7ed', borderRadius: 10,
                      cursor: 'pointer', textAlign: 'left',
                      fontSize: 12, fontWeight: 600, color: '#374151',
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#a5b4fc'; e.currentTarget.style.background = '#fafbff' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#e4e7ed'; e.currentTarget.style.background = '#fff' }}
                  >
                    <div style={{ width: 28, height: 28, borderRadius: 7, background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <ExIcon size={14} color="#4f6ef7" />
                    </div>
                    {ex.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Textarea */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>Policy Description</label>
              <span style={{ fontSize: 11, color: '#9ca3af' }}>{prompt.length} chars</span>
            </div>
            <textarea
              ref={textareaRef}
              value={prompt}
              onChange={e => { setPrompt(e.target.value); setPreview(null) }}
              onKeyDown={handleKeyDown}
              rows={9}
              placeholder={"Describe your policy in plain English…\n\nExample:\n\"Approve applicants over 18 with credit score above 600. Deny anyone under 18 or with score below 300. Flag borderline cases for manual review.\""}
              style={{
                width: '100%', background: '#fff', border: '1px solid #e4e7ed',
                borderRadius: 12, padding: '12px 14px', fontSize: 13, color: '#111827',
                resize: 'none', outline: 'none', lineHeight: 1.65,
                fontFamily: 'system-ui, -apple-system, sans-serif',
                boxSizing: 'border-box', transition: 'border-color 0.15s',
              }}
              onFocus={e => e.target.style.borderColor = '#a5b4fc'}
              onBlur={e  => e.target.style.borderColor = '#e4e7ed'}
            />
            <p style={{ fontSize: 11, color: '#9ca3af', margin: '5px 0 0' }}>
              <kbd style={{ background: '#f3f4f6', border: '1px solid #e4e7ed', borderRadius: 5, padding: '1px 6px', fontSize: 10 }}>
                Cmd Enter
              </kbd>{' '}to generate
            </p>
          </div>

          {/* Generate button */}
          <button
            onClick={handleGenerate}
            disabled={isDisabled}
            style={{
              width: '100%', background: '#4f6ef7', color: '#fff', border: 'none',
              borderRadius: 12, padding: '13px', fontSize: 14, fontWeight: 600,
              cursor: isDisabled ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              opacity: isDisabled ? 0.45 : 1, transition: 'opacity 0.15s',
            }}
          >
            {generating
              ? <>
                  <div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                  Generating…
                </>
              : <><Wand2 size={15} /> Generate Policy with AI</>}
          </button>
        </div>

        {/* ── Right: Output ── */}
        <div>
          {/* Idle */}
          {!generating && !preview && (
            <div style={{
              background: '#fff', border: '2px dashed #e4e7ed', borderRadius: 14,
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', padding: '72px 20px', minHeight: 360,
            }}>
              <div style={{ width: 48, height: 48, borderRadius: 13, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                <Wand2 size={20} color="#d1d5db" />
              </div>
              <p style={{ fontWeight: 600, color: '#9ca3af', fontSize: 13, margin: 0 }}>
                Policy preview will appear here
              </p>
              <p style={{ color: '#d1d5db', fontSize: 12, margin: '4px 0 0' }}>
                Write a description and click generate
              </p>
            </div>
          )}

          {/* Generating */}
          {generating && <GeneratingState />}

          {/* Success */}
          {!generating && preview?.status === 'success' && (
            <PolicyPreview
              preview={preview.preview}
              onSave={() => saveMut.mutate(prompt)}
              isSaving={saveMut.isPending}
            />
          )}

          {/* Error */}
          {!generating && preview && preview.status !== 'success' && (
            <div style={{
              background: '#fff', border: '1px solid #fca5a5', borderRadius: 14,
              padding: 28, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
            }}>
              <AlertCircle size={28} color="#dc2626" />
              <p style={{ fontWeight: 600, color: '#dc2626', fontSize: 14, margin: 0 }}>Generation Failed</p>
              <p style={{ fontSize: 12, color: '#6b7280', textAlign: 'center', margin: 0, maxWidth: 280, lineHeight: 1.5 }}>{preview.message}</p>
              <button
                onClick={() => setPreview(null)}
                style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer', marginTop: 4 }}
              >
                <RotateCcw size={12} /> Try again
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes dotPulse { 0%,100% { opacity: 0.25; transform: scale(0.9) } 50% { opacity: 1; transform: scale(1.1) } }
      `}</style>
    </div>
  )
}