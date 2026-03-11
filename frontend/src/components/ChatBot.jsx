import { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send, Bot, User, Minimize2, Maximize2, Trash2, Zap, ChevronDown } from 'lucide-react'

// ─── Pre-built Q&A Knowledge Base ───────────────────────────
const QA = [
  // POLICIES
  {
    keywords: ['create policy', 'new policy', 'add policy', 'make policy', 'how policy'],
    question: 'How do I create a policy?',
    answer: `To create a Policy:\n\n1. Go to "Policies" in the sidebar\n2. Click "New Policy" button (top right)\n3. Fill in:\n   • Name: e.g. "Loan Eligibility Policy"\n   • Description: what this policy does\n   • Category: Financial / Security / Compliance etc.\n   • Tags: e.g. loan, bank\n   • Status: Draft or Active\n4. Click "Create Policy"\n\n✅ Your policy is now created! Next step is to add Rules to it.`
  },
  {
    keywords: ['edit policy', 'update policy', 'change policy', 'delete policy', 'remove policy'],
    question: 'How to edit or delete a policy?',
    answer: `To Edit a Policy:\n• Go to Policies page\n• Hover over the policy card\n• Click the ✏️ edit icon\n• Update fields and save\n• Version number auto-increments\n\nTo Delete a Policy:\n• Hover over the policy card\n• Click the 🗑️ trash icon\n• Policy will be removed\n\n⚠️ Deleting a policy also removes all its rules!`
  },
  {
    keywords: ['policy status', 'draft', 'active', 'archived', 'status'],
    question: 'What are policy statuses?',
    answer: `Policy has 3 statuses:\n\n🔵 Draft — Policy is being built, not yet in use\n🟢 Active — Policy is live and can be evaluated\n⚫ Archived — Policy is retired, kept for history\n\nBest practice:\n• Start as Draft → build your rules\n• Change to Active when ready\n• Archive old policies instead of deleting`
  },

  // RULES
  {
    keywords: ['create rule', 'add rule', 'new rule', 'make rule', 'how rule', 'build rule'],
    question: 'How do I create a rule?',
    answer: `To create a Rule:\n\n1. Go to Policies → click on your policy\n2. Click "Add Rule" button\n3. Fill in:\n   • Name: e.g. "Age Check"\n   • Priority: 1 = runs first\n   • Logic: AND (all conditions must pass) or OR (any one)\n   • Conditions: field + operator + value\n   • Action: allow / deny / flag\n4. Click "Create Rule"\n\nExample condition:\n• Field: age\n• Operator: greater_than\n• Value: 18\n• Action: allow`
  },
  {
    keywords: ['operator', 'operators', 'equals', 'greater', 'less', 'contains', 'condition type'],
    question: 'What operators can I use?',
    answer: `Available Operators (10 total):\n\n📌 Text:\n• equals — exact match\n• not_equals — must not match\n• contains — includes text\n• not_contains — excludes text\n• in — value in list (comma separated)\n• not_in — value not in list\n\n📌 Numbers:\n• greater_than — value > number\n• less_than — value < number\n\n📌 Empty check:\n• is_null — field is empty\n• is_not_null — field has value\n\nExample: age greater_than 18`
  },
  {
    keywords: ['and or', 'logic', 'and logic', 'or logic', 'all conditions', 'any condition'],
    question: 'What is AND / OR logic in rules?',
    answer: `Rule Logic decides how conditions are combined:\n\n🔵 AND Logic:\n• ALL conditions must be true\n• Example: age > 18 AND salary > 30000\n• Both must pass for rule to trigger\n\n🟡 OR Logic:\n• ANY ONE condition must be true\n• Example: age > 18 OR experience > 2\n• If either passes, rule triggers\n\nTip: Use AND for strict rules, OR for flexible ones`
  },
  {
    keywords: ['priority', 'rule order', 'which rule first', 'rule priority'],
    question: 'How does rule priority work?',
    answer: `Rule Priority controls the evaluation order:\n\n• Priority 1 = runs FIRST\n• Priority 2 = runs SECOND\n• Priority 3 = runs THIRD\n\nAll rules still run, but priority decides the order.\n\nFinal decision is based on all matched actions:\n🔴 DENY beats everything\n🟡 FLAG beats ALLOW\n🟢 ALLOW is the default\n\nTip: Put your most important/strict rules at Priority 1`
  },
  {
    keywords: ['action', 'allow', 'deny', 'flag', 'notify', 'transform', 'rule action'],
    question: 'What actions can a rule trigger?',
    answer: `Rule Actions (what happens when rule matches):\n\n🟢 allow — Applicant is approved/eligible\n🔴 deny — Applicant is rejected\n🟡 flag — Send for manual review\n🔔 notify — Send notification\n🔄 transform — Transform the data\n\nDecision Priority:\nDENY > FLAG > ALLOW\n\nMeaning: If ANY rule says deny, final result is DENY even if other rules say allow.`
  },

  // EVALUATION
  {
    keywords: ['bulk evaluate', 'csv evaluate', 'upload csv', 'bulk upload', 'evaluate file', 'multiple rows'],
    question: 'How does Bulk Evaluate (CSV) work?',
    answer: `Bulk Evaluate lets you test many rows at once:\n\n1. Go to "Bulk Evaluate" in sidebar\n2. Click "Download Sample" to see the CSV format\n3. Select your Policy\n4. Upload your CSV file (drag & drop)\n5. Click "Run All Rows"\n6. See results for every row in the table\n7. Click "Download Results" to save as CSV\n\nCSV Format:\n• First row = headers (field names)\n• Other rows = data\n• Headers must match your rule field names\n\nExample CSV:\nage,credit_score,employment_status\n25,750,employed\n16,400,unemployed`
  },
  {
    keywords: ['csv format', 'csv file', 'how csv', 'csv structure', 'prepare csv'],
    question: 'How should I prepare my CSV file?',
    answer: `CSV File Format Rules:\n\n✅ Correct format:\nage,credit_score,employment_status\n25,750,employed\n30,350,unemployed\n\n📌 Rules:\n• First row = column headers\n• Headers must EXACTLY match field names in your rules\n• One row = one evaluation\n• Values separated by commas\n• Save as .csv format\n\n⚠️ Common mistakes:\n• Wrong field names (case sensitive)\n• Extra spaces in headers\n• Missing values (leave blank if null)\n\nTip: Download Sample CSV from the page to see the correct format`
  },
  {
    keywords: ['result', 'results page', 'evaluation result', 'see results', 'check result'],
    question: 'How do I read the Results page?',
    answer: `The Results page has 2 tabs:\n\n📊 Dashboard Tab:\n• Stat cards: Total, Eligible, Not Eligible, Under Review\n• Pie Chart: visual decision breakdown\n• Bar Chart: results per policy\n• ✅ Eligible List: ranked by most rules passed\n• ❌ Not Eligible List: all denied\n• 🚩 Under Review: all flagged\n\n📋 All Results Tab:\n• Full table of every evaluation\n• Search, filter by policy or decision\n• Sort by date or rules matched\n• Click any row to expand — see full input data + rule breakdown\n\nRanking: #1 = best candidate (most rules passed)`
  },

  // DECISIONS
  {
    keywords: ['allow deny flag', 'decision', 'eligible', 'not eligible', 'under review', 'what is allow', 'what is deny', 'what is flag'],
    question: 'What do ALLOW, DENY, FLAG mean?',
    answer: `The 3 Decision Types:\n\n🟢 ALLOW = Eligible\n• Applicant passed all required rules\n• No deny or flag rules triggered\n• Best outcome\n\n🔴 DENY = Not Eligible\n• At least one deny rule triggered\n• Applicant is rejected\n• DENY has highest priority\n\n🟡 FLAG = Under Review\n• A flag rule triggered (but no deny)\n• Needs manual human review\n• Middle priority\n\nPriority Order:\nDENY (highest) → FLAG → ALLOW (lowest)\n\nSo if 5 rules say ALLOW and 1 says DENY → final decision is DENY`
  },
  {
    keywords: ['why deny', 'why rejected', 'reason deny', 'why not eligible'],
    question: 'Why is someone getting DENIED?',
    answer: `If someone is getting DENY, check these:\n\n1. Go to Results page → All Results tab\n2. Click the denied row to expand it\n3. Look at Rule Breakdown section\n4. Find the rule with ✗ red mark\n5. See which condition failed\n\nExample:\n✗ Bad Credit Check\n  credit_score less_than 400\n  → got: 350 (FAILED — 350 < 400, rule matched = DENY)\n\nFix options:\n• Adjust the rule value\n• Change action from deny to flag\n• Check if input data is correct`
  },

  // AUDIT LOGS
  {
    keywords: ['audit log', 'logs', 'audit', 'history', 'who did', 'track changes'],
    question: 'What are Audit Logs?',
    answer: `Audit Logs track every action in the system:\n\n📋 Actions logged:\n• CREATE — new policy/rule created\n• UPDATE — policy/rule edited\n• DELETE — policy/rule deleted\n• EVALUATE — evaluation was run\n\n📋 Each log shows:\n• Action type\n• What was changed\n• Who did it (username)\n• When (timestamp)\n• Details\n\nGo to "Audit Logs" in sidebar to view.\nFilter by: Policies / Rules / Evaluations / Users`
  },

  // ROLES
  {
    keywords: ['admin role', 'analyst role', 'roles', 'difference admin analyst', 'user role', 'who can'],
    question: 'What is the difference between Admin and Analyst?',
    answer: `Two User Roles:\n\n👑 Admin:\n✅ Create / Edit / Delete Policies\n✅ Create / Edit / Delete Rules\n✅ Run Evaluations\n✅ View Results & Dashboard\n✅ View Audit Logs\n→ Full system control\n\n📊 Analyst:\n✅ View all Policies\n✅ View all Rules\n✅ Run Bulk Evaluations\n✅ View Results & Dashboard\n❌ Cannot create/edit/delete policies or rules\n→ Use system but not configure it\n\nChoose role during registration.`
  },

  // DASHBOARD
  {
    keywords: ['dashboard', 'home page', 'main page', 'overview', 'stats'],
    question: 'What does the Dashboard show?',
    answer: `The Dashboard shows a full overview:\n\n📊 Stat Cards:\n• Total Policies count\n• Total Evaluations run\n• Allow / Deny / Flag counts\n• Average execution time (ms)\n\n🥧 Pie Chart:\n• Visual split of Allow vs Deny vs Flag\n\n📋 Recent Evaluations:\n• Last 5 evaluations with decisions\n\n🛡️ Policies Grid:\n• All your policies at a glance\n• Click any policy to manage its rules\n\nDashboard auto-refreshes when new data is added.`
  },

  // TECHNICAL
  {
    keywords: ['mongodb', 'database', 'where data saved', 'data storage'],
    question: 'Where is data stored?',
    answer: `Data is stored in MongoDB with these collections:\n\n🗄️ users — login info, roles, passwords (encrypted)\n🗄️ policies — policy name, category, status, version\n🗄️ rules — conditions, actions, logic, priority\n🗄️ evaluations — input data, results, decisions\n🗄️ audit_logs — every action with actor + timestamp\n\nYou can view data in:\n• MongoDB Atlas dashboard (cloud)\n• MongoDB Compass (desktop app)\n• Connect using your MONGO_URL from .env file`
  },
  {
    keywords: ['how start', 'run project', 'start project', 'setup', 'install'],
    question: 'How to start the project?',
    answer: `To run PolicyEngine locally:\n\n🖥️ Terminal 1 — Backend:\ncd backend\npython -m uvicorn main:app --reload --port 8000\n\n🖥️ Terminal 2 — Frontend:\ncd frontend\nnpm install\nnpm run dev\n\n🌐 Open Browser:\nhttp://localhost:5173\n\n📋 Requirements:\n• Python 3.10+\n• Node.js 18+\n• MongoDB Atlas URL in backend/.env\n\nFirst time? Run: pip install -r requirements.txt`
  },
  {
    keywords: ['version', 'policy version', 'versioning', 'v1 v2'],
    question: 'How does policy versioning work?',
    answer: `Policy Versioning is automatic:\n\n• Every policy starts at v1\n• Each time you edit/update a policy → version increases\n• v1 → v2 → v3 automatically\n• Version number shown as "v2" badge on policy card\n\nThis helps track:\n• When policy was changed\n• How many times it was updated\n• Compare old vs new configurations\n\nNote: Version history is tracked in Audit Logs`
  },
  {
    keywords: ['execution time', 'speed', 'ms', 'milliseconds', 'how fast', 'performance'],
    question: 'What is execution time?',
    answer: `Execution Time is how fast the rule engine evaluated:\n\n⏱️ Shown in milliseconds (ms)\n• 1ms = very fast\n• 10ms = fast\n• 100ms+ = many rules or complex conditions\n\nYou can see it:\n• In Bulk Evaluate results table\n• In Results page (All Results tab)\n• In Dashboard stat card (Average)\n\nThe Python Rule Engine is very fast — typically 1-5ms per evaluation even with many rules.`
  },

  // GREETINGS
  {
    keywords: ['hello', 'hi', 'hey', 'good morning', 'good evening', 'namaste', 'hii'],
    question: 'Hello!',
    answer: `Hello! 👋 Welcome to PolicyEngine Assistant!\n\nI can help you with:\n• 🛡️ Creating and managing Policies\n• 📋 Building Rules with conditions\n• 📊 Bulk CSV Evaluation\n• 📈 Reading Results & Dashboard\n• 🔍 Understanding decisions (Allow/Deny/Flag)\n• 🔐 User roles (Admin vs Analyst)\n\nWhat do you need help with today?`
  },
  {
    keywords: ['thank', 'thanks', 'thank you', 'helpful', 'great', 'perfect', 'nice'],
    question: 'Thank you!',
    answer: `You're welcome! 😊\n\nIf you have more questions about PolicyEngine, feel free to ask anytime.\n\nQuick tips to remember:\n✅ DENY > FLAG > ALLOW priority\n✅ CSV headers must match rule field names\n✅ Priority 1 = first rule to run\n✅ Check Results → expand row to see why someone was denied\n\nHappy evaluating! 🚀`
  },
  {
    keywords: ['help', 'what can you do', 'what do you know', 'support', 'assist'],
    question: 'What can you help with?',
    answer: `I'm the PolicyEngine Assistant! Here's what I can help with:\n\n🛡️ Policies — create, edit, delete, status, versioning\n📋 Rules — conditions, operators, AND/OR logic, priority, actions\n📊 Bulk Evaluate — CSV format, upload, run, download results\n📈 Results Page — dashboard tab, eligible list, charts\n✅ Decisions — Allow, Deny, Flag explained\n🔐 Roles — Admin vs Analyst differences\n📜 Audit Logs — tracking all changes\n⚙️ Setup — how to start the project\n\nJust type your question below! 👇`
  },
]

// ─── Fuzzy match function ───────────────────────────────────
function findAnswer(input) {
  const q = input.toLowerCase().trim()
  for (const item of QA) {
    if (item.keywords.some(k => q.includes(k))) return item
  }
  // partial word match fallback
  for (const item of QA) {
    if (item.keywords.some(k => k.split(' ').some(word => word.length > 3 && q.includes(word)))) return item
  }
  return null
}

// ─── Suggestions shown on open ──────────────────────────────
const SUGGESTIONS = [
  'How do I create a policy?',
  'How to add rules with conditions?',
  'How does bulk CSV evaluation work?',
  'What is ALLOW, DENY, FLAG?',
  'What operators can I use?',
  'Admin vs Analyst difference?',
]

// ─── Components ─────────────────────────────────────────────
function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-4 py-3">
      {[0, 1, 2].map(i => (
        <div key={i} className="w-2 h-2 bg-primary-400 rounded-full animate-bounce"
          style={{ animationDelay: i * 0.15 + 's' }} />
      ))}
    </div>
  )
}

function MessageBubble({ msg }) {
  const isUser = msg.role === 'user'
  return (
    <div className={"flex gap-2.5 " + (isUser ? 'flex-row-reverse' : 'flex-row')}>
      <div className={"w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 " +
        (isUser ? 'bg-primary-500' : 'bg-[#1e293b] border border-[#2d3f55]')}>
        {isUser
          ? <User size={13} className="text-white" />
          : <Bot size={13} className="text-primary-400" />}
      </div>
      <div className={"max-w-[80%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed " +
        (isUser
          ? 'bg-primary-500 text-white rounded-tr-sm'
          : 'bg-[#1e293b] text-slate-200 rounded-tl-sm border border-[#2d3f55]')}>
        {msg.content.split('\n').map((line, i) => (
          <p key={i} className={i > 0 ? 'mt-1' : ''}>{line}</p>
        ))}
        <div className={"text-[10px] mt-1 " + (isUser ? 'text-primary-200 text-right' : 'text-slate-500')}>
          {new Date(msg.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  )
}

// ─── Main ChatBot ────────────────────────────────────────────
export default function ChatBot() {
  const [open, setOpen] = useState(false)
  const [minimized, setMinimized] = useState(false)
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hi! 👋 I'm your PolicyEngine Assistant.\n\nI have pre-built answers for all common questions. Ask me anything about policies, rules, evaluations, CSV upload, or results!",
      ts: Date.now()
    }
  ])
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

    const userMsg = { role: 'user', content: userText, ts: Date.now() }
    setMessages(prev => [...prev, userMsg])
    setTyping(true)

    // Simulate typing delay 0.6-1s
    setTimeout(() => {
      const found = findAnswer(userText)
      const reply = found
        ? found.answer
        : "I don't have a specific answer for that.\n\nTry asking about:\n• Creating policies or rules\n• CSV bulk evaluation\n• ALLOW / DENY / FLAG decisions\n• Results dashboard\n• User roles (Admin vs Analyst)\n\nOr rephrase your question! 😊"

      setMessages(prev => [...prev, { role: 'assistant', content: reply, ts: Date.now() }])
      setTyping(false)
      if (!open) setUnread(n => n + 1)
    }, 600 + Math.random() * 400)
  }

  const clearChat = () => {
    setMessages([{
      role: 'assistant',
      content: "Chat cleared! Ask me anything about PolicyEngine. 😊",
      ts: Date.now()
    }])
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  const showSuggestions = messages.length <= 2

  return (
    <>
      {/* Floating Button */}
      {!open && (
        <button onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-primary-500 hover:bg-primary-600 rounded-2xl shadow-2xl shadow-primary-500/40 flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95">
          <MessageCircle size={24} className="text-white" />
          {unread > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center">
              {unread}
            </span>
          )}
          <span className="absolute inset-0 rounded-2xl ring-2 ring-primary-400 animate-ping opacity-25" />
        </button>
      )}

      {/* Chat Window */}
      {open && (
        <div className={"fixed bottom-6 right-6 z-50 flex flex-col bg-[#0a1120] border border-[#1e293b] rounded-2xl shadow-2xl shadow-black/60 transition-all duration-200 " +
          (minimized ? 'w-80 h-14' : 'w-96 h-[580px]')}>

          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-[#1e293b] bg-[#0d1526] rounded-t-2xl flex-shrink-0">
            <div className="w-8 h-8 bg-primary-500/20 rounded-xl flex items-center justify-center">
              <Zap size={16} className="text-primary-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-white">PolicyEngine Assistant</div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                <span className="text-[11px] text-slate-400">Always Online · Instant Answers</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={clearChat} title="Clear chat"
                className="w-7 h-7 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 flex items-center justify-center transition-colors">
                <Trash2 size={12} />
              </button>
              <button onClick={() => setMinimized(m => !m)}
                className="w-7 h-7 rounded-lg text-slate-500 hover:text-white hover:bg-[#1e293b] flex items-center justify-center transition-colors">
                {minimized ? <Maximize2 size={12} /> : <Minimize2 size={12} />}
              </button>
              <button onClick={() => setOpen(false)}
                className="w-7 h-7 rounded-lg text-slate-500 hover:text-white hover:bg-[#1e293b] flex items-center justify-center transition-colors">
                <X size={12} />
              </button>
            </div>
          </div>

          {!minimized && (
            <>
              {/* Messages area */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                {messages.map((msg, i) => <MessageBubble key={i} msg={msg} />)}
                {typing && (
                  <div className="flex gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-[#1e293b] border border-[#2d3f55] flex items-center justify-center flex-shrink-0">
                      <Bot size={13} className="text-primary-400" />
                    </div>
                    <div className="bg-[#1e293b] border border-[#2d3f55] rounded-2xl rounded-tl-sm">
                      <TypingDots />
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              {/* Quick suggestions */}
              {showSuggestions && (
                <div className="px-4 pb-3 flex-shrink-0">
                  <div className="text-[10px] text-slate-600 uppercase tracking-wider mb-2 font-medium">Quick Questions</div>
                  <div className="flex flex-wrap gap-1.5">
                    {SUGGESTIONS.map((s, i) => (
                      <button key={i} onClick={() => sendMessage(s)}
                        className="text-[11px] bg-[#1e293b] hover:bg-primary-500/20 text-slate-400 hover:text-primary-400 border border-[#2d3f55] hover:border-primary-500/40 px-2.5 py-1.5 rounded-lg transition-all text-left">
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Input */}
              <div className="px-4 pb-4 flex-shrink-0">
                <div className="flex items-end gap-2 bg-[#1e293b] border border-[#2d3f55] rounded-xl px-3 py-2 focus-within:border-primary-500/50 transition-colors">
                  <textarea
                    ref={inputRef}
                    rows={1}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKey}
                    placeholder="Type your question..."
                    className="flex-1 bg-transparent text-xs text-slate-200 placeholder-slate-600 resize-none outline-none max-h-20 leading-relaxed"
                    style={{ scrollbarWidth: 'none' }}
                  />
                  <button onClick={() => sendMessage()}
                    disabled={!input.trim() || typing}
                    className="w-7 h-7 bg-primary-500 hover:bg-primary-600 disabled:bg-[#2d3f55] disabled:cursor-not-allowed rounded-lg flex items-center justify-center transition-all flex-shrink-0">
                    <Send size={12} className={input.trim() && !typing ? 'text-white' : 'text-slate-500'} />
                  </button>
                </div>
                <div className="text-[10px] text-slate-600 text-center mt-1.5">Enter to send · Shift+Enter for new line</div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  )
}