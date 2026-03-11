import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { generatePolicy, previewPolicy } from '../api/endpoints'
import toast from 'react-hot-toast'
import {
  Sparkles, Wand2, ArrowRight, Shield, Layers,
  CheckCircle, XCircle, Flag, ChevronDown, ChevronUp,
  Save, Eye, RotateCcw, Zap, Brain, Info,
  Tag, Activity, AlertCircle, Copy, Check
} from 'lucide-react'

// ── Example prompts ────────────────────────────────────────────────────────────
const EXAMPLE_PROMPTS = [
  {
    label:  'Loan Eligibility',
    icon:   '🏦',
    color:  'rgba(16,185,129,0.1)',
    border: 'rgba(16,185,129,0.2)',
    text:   'text-emerald-400',
    prompt: 'Create a loan eligibility policy. Approve applicants who are over 18 years old, have a credit score above 600, and are employed full-time. Deny applicants under 18, or with credit score below 300. Flag applications where credit score is between 300 and 600 for manual review.',
  },
  {
    label:  'KYC Compliance',
    icon:   '🔐',
    color:  'rgba(99,102,241,0.1)',
    border: 'rgba(99,102,241,0.2)',
    text:   'text-indigo-400',
    prompt: 'Create a KYC (Know Your Customer) compliance policy. Allow users who have verified email, phone number, and government ID. Deny users with a risk score above 80 or accounts flagged as suspicious. Flag new users for review if any document is missing.',
  },
  {
    label:  'Insurance',
    icon:   '🏥',
    color:  'rgba(245,158,11,0.1)',
    border: 'rgba(245,158,11,0.2)',
    text:   'text-amber-400',
    prompt: 'Create a health insurance eligibility policy. Approve applicants aged 18 to 60 with no pre-existing chronic conditions and BMI under 35. Deny applicants above 70 years old. Flag applications from smokers or applicants with BMI over 30 for additional review.',
  },
  {
    label:  'Employee Access',
    icon:   '🔑',
    color:  'rgba(6,182,212,0.1)',
    border: 'rgba(6,182,212,0.2)',
    text:   'text-cyan-400',
    prompt: 'Create an employee system access control policy. Allow access to employees with active status, role set to admin or manager, and department in Engineering or Operations. Deny access to terminated employees. Flag contract workers and interns for limited access review.',
  },
]

// ── Action meta ────────────────────────────────────────────────────────────────
const ACTION_META = {
  allow:  { bg: 'rgba(16,185,129,0.12)', text: '#34d399', border: 'rgba(16,185,129,0.25)', icon: CheckCircle, label: 'ALLOW' },
  deny:   { bg: 'rgba(239,68,68,0.12)',  text: '#f87171', border: 'rgba(239,68,68,0.25)',  icon: XCircle,     label: 'DENY'  },
  flag:   { bg: 'rgba(245,158,11,0.12)', text: '#fbbf24', border: 'rgba(245,158,11,0.25)', icon: Flag,        label: 'FLAG'  },
}

// ── Rule Preview Card ──────────────────────────────────────────────────────────
function RulePreviewCard({ rule, index }) {
  const [expanded, setExpanded] = useState(index === 0)
  const action     = rule.actions?.[0]
  const actionMeta = ACTION_META[action?.type] || ACTION_META['allow']
  const ActionIcon = actionMeta.icon

  return (
    <div className="rounded-2xl overflow-hidden transition-all duration-200"
      style={{ background: 'rgba(10,16,35,0.8)', border: '1px solid rgba(255,255,255,0.06)' }}>

      {/* Rule header */}
      <button onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left">
        {/* Priority badge */}
        <div className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs flex-shrink-0"
          style={{ background: actionMeta.bg, color: actionMeta.text, border: `1px solid ${actionMeta.border}` }}>
          #{rule.priority}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-white truncate">{rule.name}</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-mono"
              style={{ background: 'rgba(255,255,255,0.05)', color: '#64748b' }}>
              {rule.logic}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 truncate">{rule.description}</p>
        </div>
        {/* Action badge */}
        <span className="flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1.5 rounded-xl flex-shrink-0"
          style={{ background: actionMeta.bg, color: actionMeta.text, border: `1px solid ${actionMeta.border}` }}>
          <ActionIcon size={11} /> {actionMeta.label}
        </span>
        <div className="w-5 h-5 flex items-center justify-center text-slate-600">
          {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </div>
      </button>

      {/* Conditions */}
      {expanded && (
        <div className="px-4 pb-4 pt-1 border-t border-white/[0.04] space-y-2">
          <div className="text-[10px] text-slate-600 uppercase tracking-wide font-semibold mb-2">Conditions</div>
          {rule.conditions?.map((c, i) => (
            <div key={i} className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-mono px-2.5 py-1.5 rounded-lg"
                style={{ background: 'rgba(99,102,241,0.1)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.15)' }}>
                {c.field}
              </span>
              <span className="text-[11px] text-slate-500 font-mono">{c.operator}</span>
              <span className="text-[11px] font-bold text-white bg-white/[0.07] px-2.5 py-1.5 rounded-lg font-mono">
                {c.value}
              </span>
              <span className="text-[10px] text-slate-600 bg-white/[0.03] px-2 py-1 rounded-lg">
                {c.data_type}
              </span>
            </div>
          ))}
          {/* Action message */}
          {action?.message && (
            <div className="mt-2 flex items-start gap-2">
              <ArrowRight size={11} className="text-slate-600 mt-0.5 flex-shrink-0" />
              <span className="text-[11px] italic"
                style={{ color: actionMeta.text }}>{action.message}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Policy Preview Panel ───────────────────────────────────────────────────────
function PolicyPreview({ preview, onSave, isSaving }) {
  const [copied, setCopied] = useState(false)
  const policy = preview.policy
  const rules  = preview.rules || []

  const handleCopyJSON = () => {
    navigator.clipboard.writeText(JSON.stringify(preview, null, 2))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const CAT_COLORS = {
    Financial:        { bg: 'rgba(16,185,129,0.1)',  text: '#34d399' },
    Compliance:       { bg: 'rgba(99,102,241,0.1)',  text: '#a5b4fc' },
    Security:         { bg: 'rgba(239,68,68,0.1)',   text: '#f87171' },
    'Access Control': { bg: 'rgba(245,158,11,0.1)',  text: '#fbbf24' },
    'Data Governance':{ bg: 'rgba(6,182,212,0.1)',   text: '#67e8f9' },
    Other:            { bg: 'rgba(100,116,139,0.1)', text: '#94a3b8' },
  }
  const catStyle = CAT_COLORS[policy.category] || CAT_COLORS['Other']

  const actionCounts = rules.reduce((acc, r) => {
    const type = r.actions?.[0]?.type || 'allow'
    acc[type] = (acc[type] || 0) + 1
    return acc
  }, {})

  return (
    <div className="space-y-4 animate-fade-up">

      {/* Policy info card */}
      <div className="relative rounded-2xl p-5"
        style={{ background: 'linear-gradient(135deg,rgba(15,25,50,0.95),rgba(8,14,28,0.98))', border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="absolute top-0 left-8 right-8 h-px"
          style={{ background: 'linear-gradient(90deg,transparent,rgba(139,92,246,0.5),transparent)' }} />

        <div className="flex items-start gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
            style={{ background: catStyle.bg }}>
            🛡️
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-white text-base">{policy.name}</h3>
            <p className="text-sm text-slate-400 mt-0.5">{policy.description}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] px-2.5 py-1 rounded-full font-semibold"
            style={{ background: catStyle.bg, color: catStyle.text, border: `1px solid ${catStyle.text}30` }}>
            {policy.category}
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full"
            style={{ background: 'rgba(100,116,139,0.1)', color: '#94a3b8', border: '1px solid rgba(100,116,139,0.2)' }}>
            draft
          </span>
          {policy.tags?.map(t => (
            <span key={t} className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(255,255,255,0.04)', color: '#64748b', border: '1px solid rgba(255,255,255,0.06)' }}>
              <Tag size={8} />{t}
            </span>
          ))}
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 mt-4">
          {Object.entries({ allow: 'Eligible', deny: 'Denied', flag: 'Review' }).map(([key, label]) => {
            const meta = ACTION_META[key]
            const count = actionCounts[key] || 0
            return (
              <div key={key} className="rounded-xl px-3 py-2 text-center"
                style={{ background: meta.bg, border: `1px solid ${meta.border}` }}>
                <div className="text-lg font-bold" style={{ color: meta.text }}>{count}</div>
                <div className="text-[10px]" style={{ color: meta.text }}>{label} rules</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Rules list */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Layers size={13} className="text-slate-600" />
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            {rules.length} Generated Rules
          </span>
        </div>
        <div className="space-y-2">
          {rules.map((rule, i) => (
            <RulePreviewCard key={i} rule={rule} index={i} />
          ))}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 pt-2">
        <button onClick={onSave} disabled={isSaving}
          className="flex-1 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all"
          style={{
            background: 'linear-gradient(135deg,#4f6ef7,#6c3de8)',
            boxShadow:  isSaving ? 'none' : '0 0 24px rgba(79,110,247,0.35)',
            color:      '#fff',
            opacity:    isSaving ? 0.7 : 1,
          }}>
          {isSaving
            ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</>
            : <><Save size={15} /> Save Policy & Rules to Database</>}
        </button>
        <button onClick={handleCopyJSON}
          className="px-4 py-3 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all btn-ghost">
          {copied ? <><Check size={14} className="text-emerald-400" /> Copied!</> : <><Copy size={14} /> JSON</>}
        </button>
      </div>
    </div>
  )
}

// ── Loading Animation ──────────────────────────────────────────────────────────
function GeneratingAnimation() {
  const steps = [
    'Reading your prompt...',
    'Identifying policy domain...',
    'Generating rule conditions...',
    'Setting priorities and logic...',
    'Finalizing actions...',
  ]
  const [step, setStep] = useState(0)

  useState(() => {
    const timer = setInterval(() => setStep(s => Math.min(s + 1, steps.length - 1)), 900)
    return () => clearInterval(timer)
  })

  return (
    <div className="flex flex-col items-center justify-center py-16 space-y-6">
      {/* Animated brain */}
      <div className="relative">
        <div className="w-20 h-20 rounded-3xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg,rgba(139,92,246,0.2),rgba(79,110,247,0.15))', border: '1px solid rgba(139,92,246,0.3)' }}>
          <Brain size={36} className="text-violet-400" />
        </div>
        <div className="absolute inset-0 rounded-3xl animate-ping"
          style={{ background: 'rgba(139,92,246,0.1)', animationDuration: '1.5s' }} />
      </div>

      <div className="text-center space-y-2">
        <p className="text-lg font-bold text-white">AI is generating your policy...</p>
        <p className="text-sm text-slate-400">{steps[step]}</p>
      </div>

      {/* Progress dots */}
      <div className="flex gap-2">
        {steps.map((_, i) => (
          <div key={i} className="w-2 h-2 rounded-full transition-all duration-300"
            style={{
              background:  i <= step ? '#8b5cf6' : 'rgba(255,255,255,0.1)',
              boxShadow:   i === step ? '0 0 8px #8b5cf6' : 'none',
              transform:   i === step ? 'scale(1.3)' : 'scale(1)',
            }} />
        ))}
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════════════════════
export default function AIGeneratorPage() {
  const navigate     = useNavigate()
  const qc           = useQueryClient()
  const textareaRef  = useRef(null)

  const [prompt,     setPrompt]     = useState('')
  const [preview,    setPreview]    = useState(null)
  const [generating, setGenerating] = useState(false)
  const [charCount,  setCharCount]  = useState(0)

  // Preview mutation (no save)
  const previewMut = useMutation({
    mutationFn: (prompt) => previewPolicy({ prompt }),
    onMutate:   () => { setGenerating(true); setPreview(null) },
    onSuccess:  (data) => { setPreview(data); setGenerating(false) },
    onError:    (err) => {
      setGenerating(false)
      toast.error(err.response?.data?.detail || 'AI generation failed. Try again.')
    },
  })

  // Save mutation
  const saveMut = useMutation({
    mutationFn: (prompt) => generatePolicy({ prompt, save_to_db: true }),
    onSuccess: (data) => {
      qc.invalidateQueries(['policies'])
      toast.success(`✅ "${data.policy_name}" saved with ${data.rules_count} rules!`, { duration: 4000 })
      navigate(`/policies/${data.policy_id}`)
    },
    onError: (err) => {
      toast.error(err.response?.data?.detail || 'Failed to save policy.')
    },
  })

  const handleGenerate = () => {
    if (!prompt.trim() || prompt.trim().length < 10) {
      toast.error('Please describe your policy in at least one sentence.')
      return
    }
    previewMut.mutate(prompt)
  }

  const handleSave = () => {
    saveMut.mutate(prompt)
  }

  const handleExampleClick = (example) => {
    setPrompt(example.prompt)
    setCharCount(example.prompt.length)
    setPreview(null)
    textareaRef.current?.focus()
  }

  const handlePromptChange = (e) => {
    setPrompt(e.target.value)
    setCharCount(e.target.value.length)
    setPreview(null)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleGenerate()
    }
  }

  return (
    <div className="p-7 space-y-6 animate-fade-up">

      {/* ── Page Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,#7c3aed,#4f6ef7)', boxShadow: '0 0 24px rgba(124,58,237,0.4)' }}>
              <Wand2 size={20} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">AI Policy Generator</h1>
            <span className="text-[11px] px-2.5 py-1 rounded-full font-bold"
              style={{ background: 'rgba(139,92,246,0.15)', color: '#c4b5fd', border: '1px solid rgba(139,92,246,0.3)' }}>
              Powered by Claude
            </span>
          </div>
          <p className="text-slate-500 text-sm ml-13">
            Describe your policy in plain English — AI will generate the complete policy with rules, conditions, and actions.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">

        {/* ── Left Column: Input ── */}
        <div className="space-y-4">

          {/* How it works */}
          <div className="flex items-start gap-3 p-4 rounded-2xl"
            style={{ background: 'rgba(79,110,247,0.06)', border: '1px solid rgba(79,110,247,0.15)' }}>
            <Info size={14} className="text-indigo-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-xs font-semibold text-indigo-300">How it works</p>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Type a description of your policy → AI generates Policy + Rules + Conditions + Actions → Preview it → Save to database with one click.
              </p>
            </div>
          </div>

          {/* Example prompts */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={12} className="text-slate-600" />
              <span className="text-[11px] text-slate-600 uppercase tracking-wide font-semibold">Example Prompts</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {EXAMPLE_PROMPTS.map((ex) => (
                <button key={ex.label} onClick={() => handleExampleClick(ex)}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-left transition-all group"
                  style={{ background: ex.color, border: `1px solid ${ex.border}` }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                  <span className="text-base flex-shrink-0">{ex.icon}</span>
                  <span className={`text-xs font-semibold ${ex.text}`}>{ex.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Prompt textarea */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Your Policy Description
              </label>
              <span className="text-[11px] text-slate-700">{charCount} chars</span>
            </div>
            <div className="relative rounded-2xl overflow-hidden"
              style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="absolute top-0 left-8 right-8 h-px"
                style={{ background: 'linear-gradient(90deg,transparent,rgba(139,92,246,0.4),transparent)' }} />
              <textarea
                ref={textareaRef}
                value={prompt}
                onChange={handlePromptChange}
                onKeyDown={handleKeyDown}
                rows={7}
                placeholder={`Describe your policy in plain English...\n\nExample:\n"Create a loan policy that approves applicants over 18 with credit score above 600. Deny anyone under 18 or with score below 300. Flag borderline cases for review."`}
                className="w-full text-sm text-slate-200 placeholder-slate-600 resize-none outline-none p-4 leading-relaxed"
                style={{ background: 'rgba(8,14,30,0.9)' }}
              />
            </div>
            <p className="text-[11px] text-slate-700 mt-1.5 flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded text-[10px]"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                ⌘ Enter
              </kbd>
              to generate
            </p>
          </div>

          {/* Generate button */}
          <button
            onClick={handleGenerate}
            disabled={generating || saveMut.isPending || prompt.trim().length < 10}
            className="w-full py-3.5 rounded-2xl text-sm font-bold flex items-center justify-center gap-2.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: 'linear-gradient(135deg,#7c3aed,#4f6ef7)',
              boxShadow:  generating ? 'none' : '0 0 28px rgba(124,58,237,0.4), 0 1px 0 rgba(255,255,255,0.1) inset',
              color:      '#fff',
            }}
            onMouseEnter={e => { if (!generating) e.currentTarget.style.transform = 'translateY(-1px)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)' }}>
            {generating
              ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Generating...</>
              : <><Wand2 size={16} /> Generate Policy with AI</>}
          </button>

          {/* Tips */}
          <div className="rounded-2xl p-4 space-y-2"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Tips for better results</p>
            {[
              'Mention specific field names (age, credit_score, employment_status)',
              'Specify exact numeric thresholds (above 600, under 18)',
              'Describe all three outcomes: approve, reject, and review cases',
              'Use domain terminology (KYC, loan, access control, insurance)',
            ].map((tip, i) => (
              <div key={i} className="flex items-start gap-2">
                <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: 'rgba(139,92,246,0.15)' }}>
                  <span className="text-[9px] font-bold text-violet-400">{i + 1}</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">{tip}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right Column: Preview / Output ── */}
        <div>
          {/* Idle state */}
          {!generating && !preview && (
            <div className="h-full flex flex-col items-center justify-center py-16 rounded-2xl"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.08)' }}>
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.15)' }}>
                <Wand2 size={28} className="text-violet-800" />
              </div>
              <p className="text-slate-600 font-semibold text-sm">Generated policy preview</p>
              <p className="text-slate-700 text-xs mt-1">will appear here</p>
              <div className="flex items-center gap-2 mt-6">
                {[Activity, Shield, Layers].map((Icon, i) => (
                  <div key={i} className="w-8 h-8 rounded-xl flex items-center justify-center"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <Icon size={14} className="text-slate-700" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Generating state */}
          {generating && (
            <div className="rounded-2xl"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(139,92,246,0.2)' }}>
              <GeneratingAnimation />
            </div>
          )}

          {/* Preview ready */}
          {!generating && preview && preview.status === 'success' && (
            <PolicyPreview
              preview={preview.preview}
              onSave={handleSave}
              isSaving={saveMut.isPending}
            />
          )}

          {/* Error state */}
          {!generating && preview && preview.status !== 'success' && (
            <div className="flex flex-col items-center justify-center py-12 rounded-2xl gap-3"
              style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <AlertCircle size={32} className="text-red-400" />
              <p className="text-sm font-semibold text-red-400">Generation Failed</p>
              <p className="text-xs text-slate-500 text-center max-w-xs">{preview.message}</p>
              <button onClick={() => setPreview(null)}
                className="flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors mt-2">
                <RotateCcw size={12} /> Try again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}