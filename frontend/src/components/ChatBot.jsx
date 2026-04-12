import { useState, useRef, useEffect } from 'react'
import {
  Box, Fab, Paper, Typography, IconButton, TextField, InputAdornment,
  Chip, Badge, Avatar, Zoom, Slide, alpha,
} from '@mui/material'
import {
  Chat, Close, Send, SmartToy, Person, Minimize, OpenInFull,
  Delete, Bolt,
} from '@mui/icons-material'

// ─── Knowledge Base ──────────────────────────────────────────
const QA = [
  { keywords: ['create policy', 'new policy', 'add policy', 'make policy', 'how policy'], question: 'How do I create a policy?', answer: `To create a Policy:\n\n1. Go to "Policies" in the sidebar\n2. Click "New Policy" (top right)\n3. Fill in Name, Description, Category, Tags, Status\n4. Click "Create Policy"\n\nYour policy is now created. Next step is to add Rules to it.` },
  { keywords: ['edit policy', 'update policy', 'change policy', 'delete policy', 'remove policy'], question: 'How to edit or delete a policy?', answer: `To Edit:\n• Go to Policies page\n• Hover over the policy card\n• Click the edit icon\n• Update fields and save\n• Version number auto-increments\n\nTo Delete:\n• Hover over the policy card\n• Click the trash icon\n\nNote: Deleting a policy also removes all its rules.` },
  { keywords: ['policy status', 'draft', 'active', 'archived', 'status'], question: 'What are policy statuses?', answer: `Policy has 3 statuses:\n\nDraft — being built, not yet in use\nActive — live and can be evaluated\nArchived — retired, kept for history\n\nBest practice: Start as Draft, build rules, then switch to Active.` },
  { keywords: ['create rule', 'add rule', 'new rule', 'make rule', 'how rule', 'build rule'], question: 'How do I create a rule?', answer: `To create a Rule:\n\n1. Go to Policies and click on your policy\n2. Click "Add Rule"\n3. Fill in Name, Priority, Logic (AND/OR), Conditions, Action\n4. Click "Create Rule"\n\nExample condition:\n  Field: age\n  Operator: greater_than\n  Value: 18\n  Action: allow` },
  { keywords: ['operator', 'operators', 'equals', 'greater', 'less', 'contains', 'condition type'], question: 'What operators can I use?', answer: `10 Available Operators:\n\nText:\n  equals, not_equals, contains, not_contains, in, not_in\n\nNumbers:\n  greater_than, less_than\n\nEmpty check:\n  is_null, is_not_null\n\nExample: age greater_than 18` },
  { keywords: ['and or', 'logic', 'and logic', 'or logic', 'all conditions', 'any condition'], question: 'What is AND / OR logic?', answer: `AND Logic:\n  ALL conditions must be true\n  e.g. age > 18 AND salary > 30000\n\nOR Logic:\n  ANY ONE condition must be true\n  e.g. age > 18 OR experience > 2\n\nTip: Use AND for strict rules, OR for flexible ones.` },
  { keywords: ['priority', 'rule order', 'which rule first', 'rule priority'], question: 'How does rule priority work?', answer: `Priority controls evaluation order:\n  Priority 1 = runs first\n  Priority 2 = runs second\n\nAll rules still run. Final decision:\n  DENY beats everything\n  FLAG beats ALLOW\n  ALLOW is the default\n\nTip: Put your strictest rules at Priority 1.` },
  { keywords: ['action', 'allow', 'deny', 'flag', 'notify', 'transform', 'rule action'], question: 'What actions can a rule trigger?', answer: `Rule Actions:\n\n  allow — Applicant is approved\n  deny  — Applicant is rejected\n  flag  — Send for manual review\n  notify — Send a notification\n  transform — Transform the data\n\nDecision priority: DENY > FLAG > ALLOW\n\nIf any rule says DENY, the final result is DENY.` },
  { keywords: ['bulk evaluate', 'csv evaluate', 'upload csv', 'bulk upload', 'evaluate file', 'multiple rows'], question: 'How does Bulk Evaluate work?', answer: `1. Go to "Bulk Evaluate" in the sidebar\n2. Click "Download Sample" to see the CSV format\n3. Select your Policy\n4. Upload your CSV file (drag & drop)\n5. Click "Run All Rows"\n6. View results in the table\n7. Click "Download Results" to export\n\nCSV Format:\n  First row = headers (field names)\n  Other rows = data\n  Headers must match your rule field names` },
  { keywords: ['csv format', 'csv file', 'how csv', 'csv structure', 'prepare csv'], question: 'How should I prepare my CSV?', answer: `CSV Format Rules:\n\n  age,credit_score,employment_status\n  25,750,employed\n  30,350,unemployed\n\nRules:\n  First row = column headers\n  Headers must exactly match field names in rules\n  One row = one evaluation\n\nCommon mistakes:\n  Wrong field names (case sensitive)\n  Extra spaces in headers\n\nTip: Download Sample CSV from the page first.` },
  { keywords: ['result', 'results page', 'evaluation result', 'see results', 'check result'], question: 'How do I read the Results page?', answer: `Results page has 2 tabs:\n\nDashboard Tab:\n  Stats, pie chart, bar chart\n  Eligible list ranked by rules passed\n  Denied and flagged lists\n\nAll Results Tab:\n  Full table of every evaluation\n  Search, filter by policy or decision\n  Sort by date or rules matched\n  Click any row to expand and see rule breakdown` },
  { keywords: ['allow deny flag', 'decision', 'eligible', 'not eligible', 'under review', 'what is allow', 'what is deny', 'what is flag'], question: 'What do ALLOW, DENY, FLAG mean?', answer: `ALLOW = Eligible\n  Passed all required rules, no deny triggered\n\nDENY = Not Eligible\n  At least one deny rule triggered\n  DENY has highest priority\n\nFLAG = Under Review\n  A flag rule triggered (no deny)\n  Needs manual review\n\nPriority: DENY > FLAG > ALLOW\n\nIf 5 rules say ALLOW and 1 says DENY, final = DENY.` },
  { keywords: ['why deny', 'why rejected', 'reason deny', 'why not eligible'], question: 'Why is someone getting DENIED?', answer: `To debug a denial:\n\n1. Go to Results page, All Results tab\n2. Click the denied row to expand it\n3. Look at Rule Breakdown\n4. Find the rule with a red failed mark\n5. Check which condition failed\n\nFix options:\n  Adjust the rule value\n  Change action from deny to flag\n  Check if input data is correct` },
  { keywords: ['audit log', 'logs', 'audit', 'history', 'who did', 'track changes'], question: 'What are Audit Logs?', answer: `Audit Logs track every action:\n\nActions logged:\n  CREATE — new policy/rule created\n  UPDATE — policy/rule edited\n  DELETE — policy/rule deleted\n  EVALUATE — evaluation was run\n\nEach log shows: action, entity, who did it, when, details.\n\nGo to "Audit Logs" in the sidebar to view.\nFilter by: Policies, Rules, Evaluations, Users.` },
  { keywords: ['admin role', 'analyst role', 'roles', 'difference admin analyst', 'user role', 'who can'], question: 'Admin vs Analyst difference?', answer: `Admin:\n  Create / Edit / Delete Policies and Rules\n  Run Evaluations\n  View Results, Dashboard, Audit Logs\n  Full system control\n\nAnalyst:\n  View all Policies and Rules\n  Run Bulk Evaluations\n  View Results and Dashboard\n  Cannot create, edit, or delete policies or rules\n\nChoose role during registration.` },
  { keywords: ['dashboard', 'home page', 'main page', 'overview', 'stats'], question: 'What does the Dashboard show?', answer: `Dashboard shows a full overview:\n\n  Stat cards: Total Policies, Evaluations, Allow/Deny/Flag counts, Avg speed\n  Pie chart: visual decision breakdown\n  Recent evaluations: last 5 with decisions\n  Policies grid: all policies at a glance\n\nDashboard refreshes automatically when new data is added.` },
  { keywords: ['version', 'policy version', 'versioning', 'v1 v2'], question: 'How does policy versioning work?', answer: `Versioning is automatic:\n\n  Policy starts at v1\n  Each edit increments the version: v1, v2, v3...\n  Version shown as badge on the policy card\n\nHelps track when the policy was changed and how many times it was updated.\nVersion history is visible in Audit Logs.` },
  { keywords: ['execution time', 'speed', 'ms', 'milliseconds', 'how fast', 'performance'], question: 'What is execution time?', answer: `Execution time = how fast the rule engine ran (in ms).\n\n  1ms = very fast\n  10ms = fast\n  100ms+ = many rules or complex conditions\n\nVisible in:\n  Bulk Evaluate results table\n  Results page (All Results tab)\n  Dashboard stat card (average)\n\nTypically 1-5ms even with many rules.` },
  { keywords: ['hello', 'hi', 'hey', 'good morning', 'good evening', 'namaste', 'hii'], question: 'Hello!', answer: `Welcome to PolicyEngine Assistant!\n\nI can help you with:\n  Creating and managing Policies\n  Building Rules with conditions\n  Bulk CSV Evaluation\n  Reading Results and Dashboard\n  Understanding decisions (Allow / Deny / Flag)\n  User roles (Admin vs Analyst)\n\nWhat do you need help with?` },
  { keywords: ['thank', 'thanks', 'thank you', 'helpful', 'great', 'perfect', 'nice'], question: 'Thanks!', answer: `You're welcome!\n\nQuick reminders:\n  DENY > FLAG > ALLOW priority\n  CSV headers must match rule field names\n  Priority 1 = first rule to run\n  Expand a result row to see why someone was denied\n\nHappy evaluating!` },
  { keywords: ['help', 'what can you do', 'what do you know', 'support', 'assist'], question: 'What can you help with?', answer: `PolicyEngine Assistant — topics I can help with:\n\n  Policies — create, edit, delete, status, versioning\n  Rules — conditions, operators, AND/OR logic, priority, actions\n  Bulk Evaluate — CSV format, upload, run, download results\n  Results Page — dashboard tab, eligible list, charts\n  Decisions — Allow, Deny, Flag explained\n  Roles — Admin vs Analyst differences\n  Audit Logs — tracking all changes\n\nJust type your question below.` },
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

function TypingDots() {
  return (
    <Box sx={{ display: 'flex', gap: 0.5, px: 1.75, py: 1.25 }}>
      {[0, 1, 2].map(i => (
        <Box key={i} sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'primary.main', opacity: 0.5, animation: `dotBounce 0.9s ease-in-out ${i * 0.15}s infinite` }} />
      ))}
    </Box>
  )
}

function MessageBubble({ msg }) {
  const isUser = msg.role === 'user'
  return (
    <Box sx={{ display: 'flex', gap: 1.25, flexDirection: isUser ? 'row-reverse' : 'row', alignItems: 'flex-start' }}>
      <Avatar sx={{
        width: 28, height: 28, mt: 0.25,
        bgcolor: isUser ? 'primary.main' : 'action.hover',
        border: isUser ? 'none' : '1px solid',
        borderColor: 'divider',
      }}>
        {isUser ? <Person sx={{ fontSize: 14, color: '#fff' }} /> : <SmartToy sx={{ fontSize: 14, color: 'primary.main' }} />}
      </Avatar>
      <Paper sx={{
        maxWidth: '78%',
        bgcolor: isUser ? 'primary.main' : 'background.paper',
        border: isUser ? 'none' : '1px solid',
        borderColor: 'divider',
        borderRadius: 3.5,
        borderTopRightRadius: isUser ? 1 : 14,
        borderTopLeftRadius: isUser ? 14 : 1,
        px: 1.75, py: 1.25,
        boxShadow: 1,
      }}>
        {msg.content.split('\n').map((line, i) => (
          <Typography key={i} sx={{ mt: i > 0 ? 0.25 : 0, fontSize: 12, lineHeight: 1.6, color: isUser ? '#fff' : 'text.primary' }}>
            {line || '\u00A0'}
          </Typography>
        ))}
        <Typography sx={{ fontSize: 10, mt: 0.625, color: isUser ? 'rgba(255,255,255,0.5)' : 'text.disabled', textAlign: isUser ? 'right' : 'left' }}>
          {new Date(msg.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Typography>
      </Paper>
    </Box>
  )
}

export default function ChatBot() {
  const [open, setOpen] = useState(false)
  const [minimized, setMinimized] = useState(false)
  const [messages, setMessages] = useState([{
    role: 'assistant',
    content: 'Welcome to PolicyEngine Assistant.\n\nI have pre-built answers for all common questions. Ask me anything about policies, rules, evaluations, CSV upload, or results.',
    ts: Date.now(),
  }])
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const [unread, setUnread] = useState(0)

  const bottomRef = useRef()
  const inputRef = useRef()

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
        <Zoom in>
          <Fab
            onClick={() => setOpen(true)}
            color="primary"
            sx={{ position: 'fixed', bottom: 24, right: 24, zIndex: 1400, width: 54, height: 54 }}
          >
            <Badge badgeContent={unread} color="error" sx={{ '& .MuiBadge-badge': { fontSize: 10, minWidth: 18, height: 18, border: '2px solid #fff' } }}>
              <Chat sx={{ fontSize: 22 }} />
            </Badge>
          </Fab>
        </Zoom>
      )}

      {/* Chat window */}
      {open && (
        <Slide direction="up" in={open}>
          <Paper sx={{
            position: 'fixed', bottom: 24, right: 24, zIndex: 1400,
            width: { xs: 'calc(100% - 48px)', sm: 380 },
            height: minimized ? 56 : { xs: 460, sm: 560 },
            display: 'flex', flexDirection: 'column',
            boxShadow: 5, overflow: 'hidden', transition: 'height 0.2s ease',
            border: '1px solid', borderColor: 'divider',
          }}>
            {/* Header */}
            <Box sx={{
              display: 'flex', alignItems: 'center', gap: 1.25,
              px: 1.75, py: 1.5, flexShrink: 0,
              borderBottom: minimized ? 'none' : '1px solid',
              borderColor: 'divider',
            }}>
              <Avatar sx={{ width: 34, height: 34, bgcolor: alpha('#4f6ef7', 0.1) }}>
                <Bolt sx={{ fontSize: 16, color: 'primary.main' }} />
              </Avatar>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{ fontSize: 13, fontWeight: 700 }}>PolicyEngine Assistant</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.625, mt: 0.125 }}>
                  <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'success.main' }} />
                  <Typography variant="caption">Always online · Instant answers</Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', gap: 0.25 }}>
                <IconButton size="small" onClick={clearChat}
                  sx={{ '&:hover': { bgcolor: 'error.light', color: 'error.main' } }}>
                  <Delete sx={{ fontSize: 15 }} />
                </IconButton>
                <IconButton size="small" onClick={() => setMinimized(m => !m)}
                  sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                  {minimized ? <OpenInFull sx={{ fontSize: 15 }} /> : <Minimize sx={{ fontSize: 15 }} />}
                </IconButton>
                <IconButton size="small" onClick={() => setOpen(false)}
                  sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                  <Close sx={{ fontSize: 15 }} />
                </IconButton>
              </Box>
            </Box>

            {!minimized && (
              <>
                {/* Messages */}
                <Box sx={{ flex: 1, overflowY: 'auto', p: 1.75, display: 'flex', flexDirection: 'column', gap: 1.5, bgcolor: '#fafafa' }}>
                  {messages.map((msg, i) => <MessageBubble key={i} msg={msg} />)}
                  {typing && (
                    <Box sx={{ display: 'flex', gap: 1.25, alignItems: 'flex-start' }}>
                      <Avatar sx={{ width: 28, height: 28, bgcolor: 'action.hover', border: '1px solid', borderColor: 'divider' }}>
                        <SmartToy sx={{ fontSize: 14, color: 'primary.main' }} />
                      </Avatar>
                      <Paper sx={{ borderRadius: 3.5, borderTopLeftRadius: 1, boxShadow: 1, border: '1px solid', borderColor: 'divider' }}>
                        <TypingDots />
                      </Paper>
                    </Box>
                  )}
                  <div ref={bottomRef} />
                </Box>

                {/* Quick suggestions */}
                {showSuggestions && (
                  <Box sx={{ px: 1.75, pt: 1, pb: 0.5, flexShrink: 0, borderTop: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="overline" sx={{ display: 'block', mb: 0.75, color: 'text.disabled' }}>Quick questions</Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.625 }}>
                      {SUGGESTIONS.map((s, i) => (
                        <Chip key={i} label={s} size="small" onClick={() => sendMessage(s)}
                          sx={{ fontSize: 11, cursor: 'pointer', bgcolor: 'action.hover', border: '1px solid', borderColor: 'divider', '&:hover': { bgcolor: alpha('#4f6ef7', 0.08), borderColor: alpha('#4f6ef7', 0.3), color: 'primary.main' } }} />
                      ))}
                    </Box>
                  </Box>
                )}

                {/* Input */}
                <Box sx={{ px: 1.75, pt: 1.25, pb: 1.75, flexShrink: 0, borderTop: '1px solid', borderColor: 'divider' }}>
                  <TextField
                    inputRef={inputRef} rows={1} value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKey}
                    placeholder="Type your question…"
                    fullWidth size="small"
                    sx={{ '& .MuiOutlinedInput-root': { bgcolor: '#f9fafb', borderRadius: 3 } }}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={() => sendMessage()} disabled={!input.trim() || typing} size="small"
                            sx={{
                              bgcolor: input.trim() && !typing ? 'primary.main' : 'action.hover',
                              color: input.trim() && !typing ? '#fff' : 'text.disabled',
                              width: 30, height: 30, borderRadius: 2.25,
                              '&:hover': { bgcolor: input.trim() && !typing ? 'primary.dark' : 'action.hover' },
                            }}>
                            <Send sx={{ fontSize: 14 }} />
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                  <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', mt: 0.625, color: 'text.disabled' }}>
                    Enter to send · Shift+Enter for new line
                  </Typography>
                </Box>
              </>
            )}
          </Paper>
        </Slide>
      )}
    </>
  )
}