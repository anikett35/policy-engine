import { useState, useRef, useEffect } from 'react'
import {
  MessageCircle, X, Send, Bot, User,
  Minimize2, Maximize2, Trash2, Zap
} from 'lucide-react'

// ─── Knowledge Base ──────────────────────────────────────────
const QA = [
  {
    keywords: ['create policy', 'new policy', 'add policy', 'make policy', 'how policy'],
    question: 'How do I create a policy?',
    answer: `To create a Policy:\n\n1. Go to "Policies" in the sidebar\n2. Click "New Policy" (top right)\n3. Fill in Name, Description, Category, Tags, Status\n4. Click "Create Policy"\n\nYour policy is now created. Next step is to add Rules to it.`,
  },
  {
    keywords: ['edit policy', 'update policy', 'change policy', 'delete policy', 'remove policy'],
    question: 'How to edit or delete a policy?',
    answer: `To Edit:\n• Go to Policies page\n• Hover over the policy card\n• Click the edit icon\n• Update fields and save\n• Version number auto-increments\n\nTo Delete:\n• Hover over the policy card\n• Click the trash icon\n\nNote: Deleting a policy also removes all its rules.`,
  },
  {
    keywords: ['policy status', 'draft', 'active', 'archived', 'status'],
    question: 'What are policy statuses?',
    answer: `Policy has 3 statuses:\n\nDraft — being built, not yet in use\nActive — live and can be evaluated\nArchived — retired, kept for history\n\nBest practice: Start as Draft, build rules, then switch to Active.`,
  },
  {
    keywords: ['create rule', 'add rule', 'new rule', 'make rule', 'how rule', 'build rule'],
    question: 'How do I create a rule?',
    answer: `To create a Rule:\n\n1. Go to Policies and click on your policy\n2. Click "Add Rule"\n3. Fill in Name, Priority, Logic (AND/OR), Conditions, Action\n4. Click "Create Rule"\n\nExample condition:\n  Field: age\n  Operator: greater_than\n  Value: 18\n  Action: allow`,
  },
  {
    keywords: ['operator', 'operators', 'equals', 'greater', 'less', 'contains', 'condition type'],
    question: 'What operators can I use?',
    answer: `10 Available Operators:\n\nText:\n  equals, not_equals, contains, not_contains, in, not_in\n\nNumbers:\n  greater_than, less_than\n\nEmpty check:\n  is_null, is_not_null\n\nExample: age greater_than 18`,
  },
  {
    keywords: ['and or', 'logic', 'and logic', 'or logic', 'all conditions', 'any condition'],
    question: 'What is AND / OR logic?',
    answer: `AND Logic:\n  ALL conditions must be true\n  e.g. age > 18 AND salary > 30000\n\nOR Logic:\n  ANY ONE condition must be true\n  e.g. age > 18 OR experience > 2\n\nTip: Use AND for strict rules, OR for flexible ones.`,
  },
  {
    keywords: ['priority', 'rule order', 'which rule first', 'rule priority'],
    question: 'How does rule priority work?',
    answer: `Priority controls evaluation order:\n  Priority 1 = runs first\n  Priority 2 = runs second\n\nAll rules still run. Final decision:\n  DENY beats everything\n  FLAG beats ALLOW\n  ALLOW is the default\n\nTip: Put your strictest rules at Priority 1.`,
  },
  {
    keywords: ['action', 'allow', 'deny', 'flag', 'notify', 'transform', 'rule action'],
    question: 'What actions can a rule trigger?',
    answer: `Rule Actions:\n\n  allow — Applicant is approved\n  deny  — Applicant is rejected\n  flag  — Send for manual review\n  notify — Send a notification\n  transform — Transform the data\n\nDecision priority: DENY > FLAG > ALLOW\n\nIf any rule says DENY, the final result is DENY.`,
  },
  {
    keywords: ['bulk evaluate', 'csv evaluate', 'upload csv', 'bulk upload', 'evaluate file', 'multiple rows'],
    question: 'How does Bulk Evaluate work?',
    answer: `1. Go to "Bulk Evaluate" in the sidebar\n2. Click "Download Sample" to see the CSV format\n3. Select your Policy\n4. Upload your CSV file (drag & drop)\n5. Click "Run All Rows"\n6. View results in the table\n7. Click "Download Results" to export\n\nCSV Format:\n  First row = headers (field names)\n  Other rows = data\n  Headers must match your rule field names`,
  },
  {
    keywords: ['csv format', 'csv file', 'how csv', 'csv structure', 'prepare csv'],
    question: 'How should I prepare my CSV?',
    answer: `CSV Format Rules:\n\n  age,credit_score,employment_status\n  25,750,employed\n  30,350,unemployed\n\nRules:\n  First row = column headers\n  Headers must exactly match field names in rules\n  One row = one evaluation\n\nCommon mistakes:\n  Wrong field names (case sensitive)\n  Extra spaces in headers\n\nTip: Download Sample CSV from the page first.`,
  },
  {
    keywords: ['result', 'results page', 'evaluation result', 'see results', 'check result'],
    question: 'How do I read the Results page?',
    answer: `Results page has 2 tabs:\n\nDashboard Tab:\n  Stats, pie chart, bar chart\n  Eligible list ranked by rules passed\n  Denied and flagged lists\n\nAll Results Tab:\n  Full table of every evaluation\n  Search, filter by policy or decision\n  Sort by date or rules matched\n  Click any row to expand and see rule breakdown`,
  },
  {
    keywords: ['allow deny flag', 'decision', 'eligible', 'not eligible', 'under review', 'what is allow', 'what is deny', 'what is flag'],
    question: 'What do ALLOW, DENY, FLAG mean?',
    answer: `ALLOW = Eligible\n  Passed all required rules, no deny triggered\n\nDENY = Not Eligible\n  At least one deny rule triggered\n  DENY has highest priority\n\nFLAG = Under Review\n  A flag rule triggered (no deny)\n  Needs manual review\n\nPriority: DENY > FLAG > ALLOW\n\nIf 5 rules say ALLOW and 1 says DENY, final = DENY.`,
  },
  {
    keywords: ['why deny', 'why rejected', 'reason deny', 'why not eligible'],
    question: 'Why is someone getting DENIED?',
    answer: `To debug a denial:\n\n1. Go to Results page, All Results tab\n2. Click the denied row to expand it\n3. Look at Rule Breakdown\n4. Find the rule with a red failed mark\n5. Check which condition failed\n\nFix options:\n  Adjust the rule value\n  Change action from deny to flag\n  Check if input data is correct`,
  },
  {
    keywords: ['audit log', 'logs', 'audit', 'history', 'who did', 'track changes'],
    question: 'What are Audit Logs?',
    answer: `Audit Logs track every action:\n\nActions logged:\n  CREATE — new policy/rule created\n  UPDATE — policy/rule edited\n  DELETE — policy/rule deleted\n  EVALUATE — evaluation was run\n\nEach log shows: action, entity, who did it, when, details.\n\nGo to "Audit Logs" in the sidebar to view.\nFilter by: Policies, Rules, Evaluations, Users.`,
  },
  {
    keywords: ['admin role', 'analyst role', 'roles', 'difference admin analyst', 'user role', 'who can'],
    question: 'Admin vs Analyst difference?',
    answer: `Admin:\n  Create / Edit / Delete Policies and Rules\n  Run Evaluations\n  View Results, Dashboard, Audit Logs\n  Full system control\n\nAnalyst:\n  View all Policies and Rules\n  Run Bulk Evaluations\n  View Results and Dashboard\n  Cannot create, edit, or delete policies or rules\n\nChoose role during registration.`,
  },
  {
    keywords: ['dashboard', 'home page', 'main page', 'overview', 'stats'],
    question: 'What does the Dashboard show?',
    answer: `Dashboard shows a full overview:\n\n  Stat cards: Total Policies, Evaluations, Allow/Deny/Flag counts, Avg speed\n  Pie chart: visual decision breakdown\n  Recent evaluations: last 5 with decisions\n  Policies grid: all policies at a glance\n\nDashboard refreshes automatically when new data is added.`,
  },
  {
    keywords: ['version', 'policy version', 'versioning', 'v1 v2'],
    question: 'How does policy versioning work?',
    answer: `Versioning is automatic:\n\n  Policy starts at v1\n  Each edit increments the version: v1, v2, v3...\n  Version shown as badge on the policy card\n\nHelps track when the policy was changed and how many times it was updated.\nVersion history is visible in Audit Logs.`,
  },
  {
    keywords: ['execution time', 'speed', 'ms', 'milliseconds', 'how fast', 'performance'],
    question: 'What is execution time?',
    answer: `Execution time = how fast the rule engine ran (in ms).\n\n  1ms = very fast\n  10ms = fast\n  100ms+ = many rules or complex conditions\n\nVisible in:\n  Bulk Evaluate results table\n  Results page (All Results tab)\n  Dashboard stat card (average)\n\nTypically 1-5ms even with many rules.`,
  },
  {
    keywords: ['hello', 'hi', 'hey', 'good morning', 'good evening', 'namaste', 'hii'],
    question: 'Hello!',
    answer: `Welcome to PolicyEngine Assistant!\n\nI can help you with:\n  Creating and managing Policies\n  Building Rules with conditions\n  Bulk CSV Evaluation\n  Reading Results and Dashboard\n  Understanding decisions (Allow / Deny / Flag)\n  User roles (Admin vs Analyst)\n\nWhat do you need help with?`,
  },
  {
    keywords: ['thank', 'thanks', 'thank you', 'helpful', 'great', 'perfect', 'nice'],
    question: 'Thanks!',
    answer: `You're welcome!\n\nQuick reminders:\n  DENY > FLAG > ALLOW priority\n  CSV headers must match rule field names\n  Priority 1 = first rule to run\n  Expand a result row to see why someone was denied\n\nHappy evaluating!`,
  },
  {
    keywords: ['help', 'what can you do', 'what do you know', 'support', 'assist'],
    question: 'What can you help with?',
    answer: `PolicyEngine Assistant — topics I can help with:\n\n  Policies — create, edit, delete, status, versioning\n  Rules — conditions, operators, AND/OR logic, priority, actions\n  Bulk Evaluate — CSV format, upload, run, download results\n  Results Page — dashboard tab, eligible list, charts\n  Decisions — Allow, Deny, Flag explained\n  Roles — Admin vs Analyst differences\n  Audit Logs — tracking all changes\n\nJust type your question below.`,
  },
]

function findAnswer(input) {
  const q = input.toLowerCase().trim()
  for (const item of QA) {
    if (item.keywords.some(k => q.includes(k))) return item
  }
  for (const item of QA) {
    if (item.keywords.some(k => k.split(' ').some(word => word.length > 3 && q.includes(word)))) return item
  }
  return null
}

const SUGGESTIONS = [
  'How do I create a policy?',
  'How to add rules with conditions?',
  'How does bulk CSV evaluation work?',
  'What is ALLOW, DENY, FLAG?',
  'What operators can I use?',
  'Admin vs Analyst difference?',
]

// ─── Typing indicator ────────────────────────────────────────
function TypingDots() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '10px 14px' }}>
      {[0, 1, 2].map(i => (
        <div
          key={i}
          style={{
            width: 6, height: 6, borderRadius: '50%',
            background: '#4f6ef7', opacity: 0.5,
            animation: `dotBounce 0.9s ease-in-out ${i * 0.15}s infinite`,
          }}
        />
      ))}
    </div>
  )
}

// ─── Message Bubble ──────────────────────────────────────────
function MessageBubble({ msg }) {
  const isUser = msg.role === 'user'
  return (
    <div style={{ display: 'flex', gap: 10, flexDirection: isUser ? 'row-reverse' : 'row', alignItems: 'flex-start' }}>
      {/* Avatar */}
      <div style={{
        width: 28, height: 28, borderRadius: 8, flexShrink: 0, marginTop: 2,
        background: isUser ? '#4f6ef7' : '#f3f4f6',
        border: isUser ? 'none' : '1px solid #e4e7ed',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {isUser
          ? <User size={13} color="#fff" />
          : <Bot size={13} color="#4f6ef7" />}
      </div>

      {/* Bubble */}
      <div style={{
        maxWidth: '78%',
        background: isUser ? '#4f6ef7' : '#fff',
        border: isUser ? 'none' : '1px solid #e4e7ed',
        borderRadius: 14,
        borderTopRightRadius: isUser ? 4 : 14,
        borderTopLeftRadius:  isUser ? 14 : 4,
        padding: '9px 13px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      }}>
        {msg.content.split('\n').map((line, i) => (
          <p key={i} style={{
            margin: i > 0 ? '2px 0 0' : 0,
            fontSize: 12,
            lineHeight: 1.6,
            color: isUser ? '#fff' : '#374151',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}>
            {line || '\u00A0'}
          </p>
        ))}
        <p style={{ fontSize: 10, margin: '5px 0 0', color: isUser ? 'rgba(255,255,255,0.6)' : '#9ca3af', textAlign: isUser ? 'right' : 'left' }}>
          {new Date(msg.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  )
}

// ─── Main ChatBot ────────────────────────────────────────────
export default function ChatBot() {
  const [open,      setOpen]      = useState(false)
  const [minimized, setMinimized] = useState(false)
  const [messages,  setMessages]  = useState([{
    role: 'assistant',
    content: 'Welcome to PolicyEngine Assistant.\n\nI have pre-built answers for all common questions. Ask me anything about policies, rules, evaluations, CSV upload, or results.',
    ts: Date.now(),
  }])
  const [input,  setInput]  = useState('')
  const [typing, setTyping] = useState(false)
  const [unread, setUnread] = useState(0)

  const bottomRef = useRef()
  const inputRef  = useRef()

  useEffect(() => {
    if (open) {
      setUnread(0)
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    }
  }, [open, messages])

  const sendMessage = (text) => {
    const userText = (text || input).trim()
    if (!userText || typing) return
    setInput('')

    setMessages(prev => [...prev, { role: 'user', content: userText, ts: Date.now() }])
    setTyping(true)

    setTimeout(() => {
      const found = findAnswer(userText)
      const reply = found
        ? found.answer
        : "I don't have a specific answer for that.\n\nTry asking about:\n  Creating policies or rules\n  CSV bulk evaluation\n  ALLOW / DENY / FLAG decisions\n  Results dashboard\n  User roles (Admin vs Analyst)\n\nOr rephrase your question."

      setMessages(prev => [...prev, { role: 'assistant', content: reply, ts: Date.now() }])
      setTyping(false)
      if (!open) setUnread(n => n + 1)
    }, 600 + Math.random() * 400)
  }

  const clearChat = () => setMessages([{
    role: 'assistant',
    content: 'Chat cleared. Ask me anything about PolicyEngine.',
    ts: Date.now(),
  }])

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  const showSuggestions = messages.length <= 2

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          style={{
            position: 'fixed', bottom: 24, right: 24, zIndex: 50,
            width: 52, height: 52, borderRadius: 16,
            background: '#4f6ef7', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 20px rgba(79,110,247,0.35)',
            transition: 'transform 0.15s, box-shadow 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.06)'; e.currentTarget.style.boxShadow = '0 6px 28px rgba(79,110,247,0.45)' }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)';    e.currentTarget.style.boxShadow = '0 4px 20px rgba(79,110,247,0.35)' }}
        >
          <MessageCircle size={22} color="#fff" />
          {unread > 0 && (
            <span style={{
              position: 'absolute', top: -6, right: -6,
              width: 20, height: 20, borderRadius: '50%',
              background: '#dc2626', color: '#fff',
              fontSize: 10, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '2px solid #f8f9fb',
            }}>
              {unread}
            </span>
          )}
        </button>
      )}

      {/* Chat window */}
      {open && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 50,
          width: 380, height: minimized ? 56 : 560,
          background: '#fff', border: '1px solid #e4e7ed',
          borderRadius: 18, display: 'flex', flexDirection: 'column',
          boxShadow: '0 8px 40px rgba(0,0,0,0.12)',
          overflow: 'hidden', transition: 'height 0.2s ease',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}>

          {/* Header */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '12px 14px', flexShrink: 0,
            borderBottom: minimized ? 'none' : '1px solid #f3f4f6',
            background: '#fff',
          }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Zap size={16} color="#4f6ef7" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>PolicyEngine Assistant</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 1 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#16a34a' }} />
                <span style={{ fontSize: 10, color: '#9ca3af' }}>Always online · Instant answers</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 2 }}>
              <button
                onClick={clearChat}
                title="Clear chat"
                style={{ width: 28, height: 28, borderRadius: 8, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', transition: 'all 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#fee2e2'; e.currentTarget.style.color = '#dc2626' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'none';    e.currentTarget.style.color = '#9ca3af' }}
              >
                <Trash2 size={13} />
              </button>
              <button
                onClick={() => setMinimized(m => !m)}
                style={{ width: 28, height: 28, borderRadius: 8, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', transition: 'all 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#f3f4f6'; e.currentTarget.style.color = '#374151' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'none';    e.currentTarget.style.color = '#9ca3af' }}
              >
                {minimized ? <Maximize2 size={13} /> : <Minimize2 size={13} />}
              </button>
              <button
                onClick={() => setOpen(false)}
                style={{ width: 28, height: 28, borderRadius: 8, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', transition: 'all 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#f3f4f6'; e.currentTarget.style.color = '#374151' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'none';    e.currentTarget.style.color = '#9ca3af' }}
              >
                <X size={13} />
              </button>
            </div>
          </div>

          {!minimized && (
            <>
              {/* Messages */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '14px 14px 8px', display: 'flex', flexDirection: 'column', gap: 12, background: '#fafafa' }}>
                {messages.map((msg, i) => <MessageBubble key={i} msg={msg} />)}
                {typing && (
                  <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: '#f3f4f6', border: '1px solid #e4e7ed', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Bot size={13} color="#4f6ef7" />
                    </div>
                    <div style={{ background: '#fff', border: '1px solid #e4e7ed', borderRadius: 14, borderTopLeftRadius: 4, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                      <TypingDots />
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              {/* Quick suggestions */}
              {showSuggestions && (
                <div style={{ padding: '8px 14px 4px', flexShrink: 0, background: '#fff', borderTop: '1px solid #f3f4f6' }}>
                  <p style={{ fontSize: 10, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 7px' }}>
                    Quick questions
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                    {SUGGESTIONS.map((s, i) => (
                      <button
                        key={i}
                        onClick={() => sendMessage(s)}
                        style={{
                          fontSize: 11, padding: '5px 10px', borderRadius: 8,
                          background: '#f3f4f6', border: '1px solid #e4e7ed',
                          color: '#6b7280', cursor: 'pointer', textAlign: 'left',
                          transition: 'all 0.15s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#eef2ff'; e.currentTarget.style.borderColor = '#c7d2fe'; e.currentTarget.style.color = '#4f6ef7' }}
                        onMouseLeave={e => { e.currentTarget.style.background = '#f3f4f6'; e.currentTarget.style.borderColor = '#e4e7ed'; e.currentTarget.style.color = '#6b7280' }}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Input */}
              <div style={{ padding: '10px 14px 14px', flexShrink: 0, background: '#fff', borderTop: '1px solid #f3f4f6' }}>
                <div style={{
                  display: 'flex', alignItems: 'flex-end', gap: 8,
                  background: '#f9fafb', border: '1px solid #e4e7ed',
                  borderRadius: 12, padding: '8px 10px 8px 14px',
                  transition: 'border-color 0.15s',
                }}
                  onFocusCapture={e => e.currentTarget.style.borderColor = '#a5b4fc'}
                  onBlurCapture={e  => e.currentTarget.style.borderColor = '#e4e7ed'}
                >
                  <textarea
                    ref={inputRef}
                    rows={1}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKey}
                    placeholder="Type your question…"
                    style={{
                      flex: 1, background: 'transparent', border: 'none', outline: 'none',
                      fontSize: 12, color: '#374151', resize: 'none', maxHeight: 72,
                      lineHeight: 1.55, fontFamily: 'system-ui, -apple-system, sans-serif',
                    }}
                  />
                  <button
                    onClick={() => sendMessage()}
                    disabled={!input.trim() || typing}
                    style={{
                      width: 30, height: 30, borderRadius: 9, border: 'none',
                      background: input.trim() && !typing ? '#4f6ef7' : '#f3f4f6',
                      cursor: input.trim() && !typing ? 'pointer' : 'not-allowed',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0, transition: 'all 0.15s',
                    }}
                  >
                    <Send size={13} color={input.trim() && !typing ? '#fff' : '#d1d5db'} />
                  </button>
                </div>
                <p style={{ fontSize: 10, color: '#d1d5db', textAlign: 'center', margin: '5px 0 0' }}>
                  Enter to send · Shift+Enter for new line
                </p>
              </div>
            </>
          )}
        </div>
      )}

      <style>{`
        @keyframes dotBounce {
          0%, 100% { transform: translateY(0);   opacity: 0.35 }
          50%       { transform: translateY(-4px); opacity: 1    }
        }
      `}</style>
    </>
  )
}