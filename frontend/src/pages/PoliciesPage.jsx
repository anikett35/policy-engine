import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getPolicies, createPolicy, deletePolicy } from '../api/endpoints'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Plus, Trash2, ChevronRight, Shield, Tag, X, Search, Filter, FolderOpen } from 'lucide-react'

const CATEGORIES = ['Compliance','Security','Data Governance','Access Control','Financial','Other']

const CAT_STYLE = {
  'Compliance':       { bg:'rgba(99,102,241,0.1)',  text:'#a5b4fc', icon:'🔒' },
  'Security':         { bg:'rgba(239,68,68,0.1)',   text:'#f87171', icon:'🛡️' },
  'Data Governance':  { bg:'rgba(6,182,212,0.1)',   text:'#67e8f9', icon:'🗄️' },
  'Access Control':   { bg:'rgba(245,158,11,0.1)',  text:'#fbbf24', icon:'🔑' },
  'Financial':        { bg:'rgba(16,185,129,0.1)',  text:'#34d399', icon:'💰' },
  'Other':            { bg:'rgba(100,116,139,0.1)', text:'#94a3b8', icon:'📋' },
}

export default function PoliciesPage() {
  const qc = useQueryClient()
  const { data: policies = [], isLoading } = useQuery({ queryKey: ['policies'], queryFn: getPolicies })
  const [showForm, setShowForm] = useState(false)
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('')
  const [form, setForm] = useState({ name:'', description:'', category:'Compliance', tags:'', status:'draft' })

  const createMut = useMutation({
    mutationFn: createPolicy,
    onSuccess: () => { qc.invalidateQueries(['policies']); setShowForm(false); setForm({ name:'', description:'', category:'Compliance', tags:'', status:'draft' }); toast.success('Policy created!') }
  })
  const deleteMut = useMutation({
    mutationFn: deletePolicy,
    onSuccess: () => { qc.invalidateQueries(['policies']); toast.success('Policy deleted') }
  })

  const filtered = policies.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.description?.toLowerCase().includes(search.toLowerCase())
    const matchCat = catFilter ? p.category === catFilter : true
    return matchSearch && matchCat
  })

  const handleSubmit = e => {
    e.preventDefault()
    createMut.mutate({ ...form, tags: form.tags.split(',').map(t => t.trim()).filter(Boolean) })
  }

  return (
    <div className="p-7 space-y-6 animate-fade-up">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Policies</h1>
          <p className="text-slate-500 text-sm mt-0.5">{policies.length} policies · {policies.filter(p=>p.status==='active').length} active</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(true)}>
          <Plus size={15} /> New Policy
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600" />
          <input className="input pl-9" placeholder="Search policies..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input w-48" value={catFilter} onChange={e => setCatFilter(e.target.value)}>
          <option value="">All Categories</option>
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="relative rounded-2xl p-6 animate-fade-up"
          style={{ background:'linear-gradient(135deg,rgba(79,110,247,0.06),rgba(108,61,232,0.04))', border:'1px solid rgba(79,110,247,0.2)' }}>
          <div className="absolute top-0 left-8 right-8 h-px" style={{ background:'linear-gradient(90deg,transparent,rgba(79,110,247,0.5),transparent)' }} />
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-white">Create New Policy</h3>
            <button onClick={() => setShowForm(false)} className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/10 transition-all">
              <X size={14} />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Policy Name</label>
                <input className="input" placeholder="e.g. Loan Eligibility Policy" value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Category</label>
                <select className="input" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Description</label>
              <textarea className="input min-h-[72px] resize-none" placeholder="What does this policy do?"
                value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Tags (comma separated)</label>
                <input className="input" placeholder="loan, bank, kyc" value={form.tags}
                  onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Status</label>
                <select className="input" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={createMut.isPending} className="btn-primary">
                {createMut.isPending ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Creating...</> : <><Plus size={14} /> Create Policy</>}
              </button>
              <button type="button" className="btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="card h-36 animate-shimmer" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 stagger">
          {filtered.map(p => {
            const cat = CAT_STYLE[p.category] || CAT_STYLE['Other']
            return (
              <div key={p.id} className="group relative rounded-2xl p-5 cursor-pointer transition-all duration-200 animate-fade-up"
                style={{ background:'linear-gradient(135deg,rgba(12,20,40,0.9),rgba(8,14,28,0.95))', border:'1px solid rgba(255,255,255,0.05)' }}
                onMouseEnter={e => e.currentTarget.style.borderColor='rgba(79,110,247,0.25)'}
                onMouseLeave={e => e.currentTarget.style.borderColor='rgba(255,255,255,0.05)'}>

                {/* Top bar colored line */}
                <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl transition-all duration-200"
                  style={{ background:`linear-gradient(90deg,transparent,${cat.text},transparent)`, opacity:0.4 }} />

                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                      style={{ background: cat.bg }}>
                      {cat.icon}
                    </div>
                    <div>
                      <div className="font-bold text-white text-sm group-hover:text-indigo-200 transition-colors">{p.name}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={"badge badge-" + p.status}>{p.status}</span>
                        <span className="text-[10px] text-slate-600 font-mono">v{p.version}</span>
                      </div>
                    </div>
                  </div>
                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={e => { e.stopPropagation(); deleteMut.mutate(p.id) }}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all">
                      <Trash2 size={13} />
                    </button>
                    <Link to={`/policies/${p.id}`}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-600 hover:text-indigo-400 hover:bg-indigo-500/10 transition-all">
                      <ChevronRight size={13} />
                    </Link>
                  </div>
                </div>

                <p className="text-xs text-slate-500 line-clamp-2 mb-3 leading-relaxed">{p.description}</p>

                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap gap-1">
                    {p.tags?.slice(0,3).map(t => (
                      <span key={t} className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium"
                        style={{ background:'rgba(255,255,255,0.05)', color:'#64748b', border:'1px solid rgba(255,255,255,0.06)' }}>
                        <Tag size={8} />{t}
                      </span>
                    ))}
                  </div>
                  <span className="text-[10px] px-2 py-1 rounded-lg font-medium" style={{ background: cat.bg, color: cat.text }}>
                    {p.category}
                  </span>
                </div>
              </div>
            )
          })}

          {filtered.length === 0 && (
            <div className="col-span-2 text-center py-20 text-slate-600">
              <FolderOpen size={48} className="mx-auto mb-4 opacity-20" />
              <p className="font-semibold text-slate-500">No policies found</p>
              <p className="text-sm mt-1">Create your first policy to get started</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}