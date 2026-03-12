import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getPolicies, createPolicy, deletePolicy } from '../api/endpoints'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  Plus, Trash2, ChevronRight, Shield, Tag, X, Search, FolderOpen,
  Lock, Database, Key, HeartPulse, DollarSign, FileText
} from 'lucide-react'

const CATEGORIES = ['Compliance', 'Security', 'Data Governance', 'Access Control', 'Financial', 'Other']

const CAT_META = {
  Compliance:        { bg: '#eef2ff', text: '#3730a3', border: '#c7d2fe', Icon: Lock        },
  Security:          { bg: '#fee2e2', text: '#991b1b', border: '#fca5a5', Icon: Shield      },
  'Data Governance': { bg: '#e0f2fe', text: '#075985', border: '#bae6fd', Icon: Database    },
  'Access Control':  { bg: '#fef9c3', text: '#854d0e', border: '#fde047', Icon: Key         },
  Financial:         { bg: '#dcfce7', text: '#166534', border: '#bbf7d0', Icon: DollarSign  },
  Other:             { bg: '#f3f4f6', text: '#374151', border: '#e4e7ed', Icon: FileText     },
}

export default function PoliciesPage() {
  const qc = useQueryClient()
  const { data: policies = [], isLoading } = useQuery({ queryKey: ['policies'], queryFn: getPolicies })

  const [showForm, setShowForm] = useState(false)
  const [search,   setSearch]   = useState('')
  const [catFilter, setCatFilter] = useState('')
  const [form, setForm] = useState({
    name: '', description: '', category: 'Compliance', tags: '', status: 'draft',
  })

  const createMut = useMutation({
    mutationFn: createPolicy,
    onSuccess: () => {
      qc.invalidateQueries(['policies'])
      setShowForm(false)
      setForm({ name: '', description: '', category: 'Compliance', tags: '', status: 'draft' })
      toast.success('Policy created!')
    },
    onError: () => toast.error('Failed to create policy.'),
  })

  const deleteMut = useMutation({
    mutationFn: deletePolicy,
    onSuccess: () => { qc.invalidateQueries(['policies']); toast.success('Policy deleted') },
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
    <div style={{ padding: 28, background: '#f8f9fb', minHeight: '100vh', fontFamily: 'system-ui, -apple-system, sans-serif' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827', margin: 0 }}>Policies</h1>
          <p style={{ color: '#6b7280', fontSize: 13, margin: '4px 0 0' }}>
            {policies.length} total · {policies.filter(p => p.status === 'active').length} active
          </p>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#4f6ef7', color: '#fff', border: 'none', borderRadius: 10, padding: '9px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
        >
          <Plus size={14} /> New Policy
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 18 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search policies…"
            style={{ width: '100%', paddingLeft: 36, padding: '9px 12px 9px 36px', background: '#fff', border: '1px solid #e4e7ed', borderRadius: 10, fontSize: 13, color: '#111827', outline: 'none', boxSizing: 'border-box' }}
          />
        </div>
        <select
          value={catFilter}
          onChange={e => setCatFilter(e.target.value)}
          style={{ padding: '9px 12px', background: '#fff', border: '1px solid #e4e7ed', borderRadius: 10, fontSize: 13, color: '#374151', outline: 'none', minWidth: 170 }}
        >
          <option value="">All Categories</option>
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
      </div>

      {/* Create form */}
      {showForm && (
        <div style={{ background: '#fff', border: '1px solid #c7d2fe', borderRadius: 14, padding: 22, marginBottom: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#111827', margin: 0 }}>Create New Policy</h3>
            <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', display: 'flex', alignItems: 'center' }}>
              <X size={16} />
            </button>
          </div>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Policy Name</label>
                <input
                  required
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Loan Eligibility Policy"
                  style={{ width: '100%', padding: '9px 12px', background: '#f9fafb', border: '1px solid #e4e7ed', borderRadius: 9, fontSize: 13, color: '#111827', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Category</label>
                <select
                  value={form.category}
                  onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  style={{ width: '100%', padding: '9px 12px', background: '#f9fafb', border: '1px solid #e4e7ed', borderRadius: 9, fontSize: 13, color: '#374151', outline: 'none', boxSizing: 'border-box' }}
                >
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Description</label>
              <textarea
                required
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="What does this policy do?"
                rows={3}
                style={{ width: '100%', padding: '9px 12px', background: '#f9fafb', border: '1px solid #e4e7ed', borderRadius: 9, fontSize: 13, color: '#111827', outline: 'none', resize: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 18 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Tags (comma separated)</label>
                <input
                  value={form.tags}
                  onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
                  placeholder="loan, bank, kyc"
                  style={{ width: '100%', padding: '9px 12px', background: '#f9fafb', border: '1px solid #e4e7ed', borderRadius: 9, fontSize: 13, color: '#111827', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Status</label>
                <select
                  value={form.status}
                  onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                  style={{ width: '100%', padding: '9px 12px', background: '#f9fafb', border: '1px solid #e4e7ed', borderRadius: 9, fontSize: 13, color: '#374151', outline: 'none', boxSizing: 'border-box' }}
                >
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="submit"
                disabled={createMut.isPending}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#4f6ef7', color: '#fff', border: 'none', borderRadius: 9, padding: '9px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: createMut.isPending ? 0.6 : 1 }}
              >
                {createMut.isPending
                  ? <><div style={{ width: 13, height: 13, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /> Creating…</>
                  : <><Plus size={13} /> Create Policy</>}
              </button>
              <button type="button" onClick={() => setShowForm(false)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'transparent', color: '#6b7280', border: '1px solid #e4e7ed', borderRadius: 9, padding: '9px 16px', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Policy grid */}
      {isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} style={{ background: '#fff', border: '1px solid #e4e7ed', borderRadius: 14, height: 140, animation: 'shimmer 1.5s infinite' }} />
          ))}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          {filtered.map(p => {
            const cat = CAT_META[p.category] || CAT_META.Other
            const CatIcon = cat.Icon
            return (
              <div
                key={p.id}
                style={{ background: '#fff', border: '1px solid #e4e7ed', borderRadius: 14, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.04)', position: 'relative', overflow: 'hidden', transition: 'box-shadow 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(79,110,247,0.1)'}
                onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)'}
              >
                {/* Top accent */}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: cat.bg, borderRadius: '14px 14px 0 0' }} />

                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 38, height: 38, borderRadius: 10, background: cat.bg, border: `1px solid ${cat.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <CatIcon size={17} color={cat.text} />
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{p.name}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                        <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: p.status === 'active' ? '#dcfce7' : '#f3f4f6', color: p.status === 'active' ? '#166534' : '#6b7280' }}>
                          {p.status}
                        </span>
                        <span style={{ fontSize: 10, color: '#9ca3af' }}>v{p.version}</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button
                      onClick={e => { e.stopPropagation(); if (window.confirm('Delete this policy?')) deleteMut.mutate(p.id) }}
                      style={{ width: 28, height: 28, borderRadius: 7, background: 'transparent', border: '1px solid #f3f4f6', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', transition: 'all 0.15s' }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#fee2e2'; e.currentTarget.style.color = '#dc2626'; e.currentTarget.style.borderColor = '#fca5a5' }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9ca3af'; e.currentTarget.style.borderColor = '#f3f4f6' }}
                    >
                      <Trash2 size={13} />
                    </button>
                    <Link
                      to={`/policies/${p.id}`}
                      style={{ width: 28, height: 28, borderRadius: 7, background: 'transparent', border: '1px solid #f3f4f6', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', textDecoration: 'none', transition: 'all 0.15s' }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#eef2ff'; e.currentTarget.style.color = '#4f6ef7'; e.currentTarget.style.borderColor = '#c7d2fe' }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9ca3af'; e.currentTarget.style.borderColor = '#f3f4f6' }}
                    >
                      <ChevronRight size={13} />
                    </Link>
                  </div>
                </div>

                <p style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.55, marginBottom: 12, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {p.description}
                </p>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {p.tags?.slice(0, 3).map(t => (
                      <span key={t} style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 10, background: '#f9fafb', color: '#9ca3af', padding: '2px 8px', borderRadius: 20, border: '1px solid #f3f4f6' }}>
                        <Tag size={8} /> {t}
                      </span>
                    ))}
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 600, background: cat.bg, color: cat.text, padding: '3px 9px', borderRadius: 20 }}>
                    {p.category}
                  </span>
                </div>
              </div>
            )
          })}

          {filtered.length === 0 && !isLoading && (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px 0', color: '#9ca3af' }}>
              <FolderOpen size={40} style={{ marginBottom: 12, opacity: 0.4 }} />
              <p style={{ fontWeight: 600, color: '#6b7280', fontSize: 14, margin: '0 0 4px' }}>No policies found</p>
              <p style={{ fontSize: 13, margin: 0 }}>Create your first policy to get started</p>
            </div>
          )}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}