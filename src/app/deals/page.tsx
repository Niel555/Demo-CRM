'use client'

import { useState, useEffect } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import DealModal from '@/components/deals/DealModal'
import { createClient } from '@/lib/supabase/client'
import { Deal, DealStatus } from '@/types'
import { Search, Plus, TrendingUp, MapPin, User, Mail, Phone, Pencil } from 'lucide-react'

const columns: { status: DealStatus; label: string; color: string; bg: string }[] = [
  { status: 'lead', label: 'Lead', color: '#3b82f6', bg: 'rgba(59,130,246,0.08)' },
  { status: 'viewing', label: 'Besichtigung', color: '#f59e0b', bg: 'rgba(245,158,11,0.08)' },
  { status: 'offer', label: 'Angebot', color: '#a855f7', bg: 'rgba(168,85,247,0.08)' },
  { status: 'won', label: 'Gewonnen', color: '#22c55e', bg: 'rgba(34,197,94,0.08)' },
  { status: 'lost', label: 'Verloren', color: '#ef4444', bg: 'rgba(239,68,68,0.08)' },
]

function formatPrice(n: number) {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)
}

function DealCard({ deal, color, onClick }: { deal: Deal; color: string; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{
        backgroundColor: '#111111',
        border: '1px solid #1e1e1e',
        borderRadius: '8px',
        padding: '14px',
        cursor: 'pointer',
        transition: 'border-color 0.1s',
      }}
      onMouseEnter={e => ((e.currentTarget as HTMLElement).style.borderColor = '#2a2a2a')}
      onMouseLeave={e => ((e.currentTarget as HTMLElement).style.borderColor = '#1e1e1e')}
    >
      <div style={{ fontSize: '1rem', fontWeight: 700, color, marginBottom: '10px' }}>
        {formatPrice(deal.value)}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
        <User size={12} color="#555555" />
        <span style={{ color: '#dddddd', fontSize: '0.8125rem', fontWeight: 500 }}>{deal.contact.name}</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', marginBottom: '10px' }}>
        <MapPin size={12} color="#555555" style={{ marginTop: '2px', flexShrink: 0 }} />
        <span style={{ color: '#666666', fontSize: '0.75rem', lineHeight: 1.3 }}>{deal.property.title}</span>
      </div>

      <div
        style={{
          borderTop: '1px solid #1a1a1a',
          paddingTop: '10px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span style={{ color: '#555555', fontSize: '0.6875rem' }}>Provision</span>
        <span style={{ color: '#888888', fontSize: '0.75rem', fontWeight: 500 }}>{formatPrice(deal.commission)}</span>
      </div>
    </div>
  )
}

export default function DealsPage() {
  const [deals, setDeals] = useState<Deal[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [view, setView] = useState<'kanban' | 'list'>('kanban')
  const [selected, setSelected] = useState<Deal | null>(null)
  const [modal, setModal] = useState<{ open: boolean; deal: Deal | null }>({ open: false, deal: null })

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('deals')
      .select('*, contact:contacts(*), property:properties(*)')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setDeals((data ?? []) as Deal[])
        setLoading(false)
      })
  }, [])

  function openCreate() { setModal({ open: true, deal: null }) }
  function openEdit(d: Deal) { setModal({ open: true, deal: d }); setSelected(null) }

  function handleSaved(saved: Deal) {
    setDeals(prev => {
      const idx = prev.findIndex(d => d.id === saved.id)
      if (idx >= 0) { const next = [...prev]; next[idx] = saved; return next }
      return [saved, ...prev]
    })
    if (selected?.id === saved.id) setSelected(saved)
    setModal({ open: false, deal: null })
  }

  function handleDeleted(id: string) {
    setDeals(prev => prev.filter(d => d.id !== id))
    if (selected?.id === id) setSelected(null)
    setModal({ open: false, deal: null })
  }

  const filtered = search
    ? deals.filter(d =>
        d.contact.name.toLowerCase().includes(search.toLowerCase()) ||
        d.property.title.toLowerCase().includes(search.toLowerCase())
      )
    : deals

  const totalValue = deals.filter(d => d.status === 'won').reduce((s, d) => s + d.commission, 0)
  const pipelineValue = deals.filter(d => !['won', 'lost'].includes(d.status)).reduce((s, d) => s + d.value, 0)

  const selectedCol = selected ? columns.find(c => c.status === selected.status) : null

  return (
    <>
      <AppLayout
        title="Deals"
        subtitle={loading ? 'Wird geladen…' : `${deals.length} Deals im System`}
        actions={
          <div style={{ display: 'flex', gap: '8px' }}>
            <div style={{ display: 'flex', backgroundColor: '#111111', border: '1px solid #1e1e1e', borderRadius: '8px', padding: '3px', gap: '2px' }}>
              <button
                onClick={() => setView('kanban')}
                style={{
                  backgroundColor: view === 'kanban' ? '#1e1e1e' : 'transparent',
                  border: 'none',
                  borderRadius: '6px',
                  color: view === 'kanban' ? '#eeeeee' : '#666666',
                  cursor: 'pointer',
                  fontSize: '0.8125rem',
                  padding: '5px 12px',
                }}
              >
                Kanban
              </button>
              <button
                onClick={() => setView('list')}
                style={{
                  backgroundColor: view === 'list' ? '#1e1e1e' : 'transparent',
                  border: 'none',
                  borderRadius: '6px',
                  color: view === 'list' ? '#eeeeee' : '#666666',
                  cursor: 'pointer',
                  fontSize: '0.8125rem',
                  padding: '5px 12px',
                }}
              >
                Liste
              </button>
            </div>
            <button
              onClick={openCreate}
              style={{
                backgroundColor: '#6366f1',
                border: 'none',
                borderRadius: '8px',
                color: 'white',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: 500,
                padding: '8px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Plus size={16} />
              Neuer Deal
            </button>
          </div>
        }
      >
        {/* Summary */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
          <div style={{ backgroundColor: '#111111', border: '1px solid #1e1e1e', borderRadius: '8px', padding: '12px 18px', display: 'flex', gap: '12px', alignItems: 'center' }}>
            <TrendingUp size={16} color="#22c55e" />
            <div>
              <div style={{ color: '#555555', fontSize: '0.75rem' }}>Provision erzielt</div>
              <div style={{ color: '#22c55e', fontSize: '1rem', fontWeight: 700 }}>{formatPrice(totalValue)}</div>
            </div>
          </div>
          <div style={{ backgroundColor: '#111111', border: '1px solid #1e1e1e', borderRadius: '8px', padding: '12px 18px', display: 'flex', gap: '12px', alignItems: 'center' }}>
            <TrendingUp size={16} color="#6366f1" />
            <div>
              <div style={{ color: '#555555', fontSize: '0.75rem' }}>Pipeline-Volumen</div>
              <div style={{ color: '#6366f1', fontSize: '1rem', fontWeight: 700 }}>{formatPrice(pipelineValue)}</div>
            </div>
          </div>

          <div style={{ position: 'relative', marginLeft: 'auto' }}>
            <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#555555' }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Kontakt oder Objekt suchen..."
              style={{
                backgroundColor: '#111111',
                border: '1px solid #242424',
                borderRadius: '8px',
                color: '#eeeeee',
                fontSize: '0.875rem',
                padding: '8px 12px 8px 32px',
                width: '260px',
                outline: 'none',
              }}
            />
          </div>
        </div>

        {loading && (
          <div style={{ padding: '80px', textAlign: 'center', color: '#444444', fontSize: '0.875rem' }}>
            Wird geladen…
          </div>
        )}

        {/* Kanban View */}
        {!loading && view === 'kanban' && (
          <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '8px' }}>
            {columns.map(col => {
              const colDeals = filtered.filter(d => d.status === col.status)
              const colValue = colDeals.reduce((s, d) => s + d.value, 0)
              return (
                <div key={col.status} style={{ minWidth: '240px', width: '240px', flexShrink: 0 }}>
                  <div
                    style={{
                      backgroundColor: col.bg,
                      borderRadius: '8px 8px 0 0',
                      padding: '10px 14px',
                      border: `1px solid ${col.color}22`,
                      borderBottom: 'none',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: col.color }} />
                      <span style={{ color: col.color, fontSize: '0.8125rem', fontWeight: 600 }}>{col.label}</span>
                      <span style={{
                        backgroundColor: `${col.color}22`,
                        color: col.color,
                        fontSize: '0.6875rem',
                        fontWeight: 600,
                        padding: '1px 6px',
                        borderRadius: '10px',
                      }}>
                        {colDeals.length}
                      </span>
                    </div>
                    {colValue > 0 && (
                      <span style={{ color: '#555555', fontSize: '0.6875rem' }}>{formatPrice(colValue)}</span>
                    )}
                  </div>

                  <div
                    style={{
                      backgroundColor: '#0e0e0e',
                      border: `1px solid ${col.color}22`,
                      borderTop: 'none',
                      borderRadius: '0 0 8px 8px',
                      padding: '8px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      minHeight: '200px',
                    }}
                  >
                    {colDeals.map(deal => (
                      <DealCard
                        key={deal.id}
                        deal={deal}
                        color={col.color}
                        onClick={() => setSelected(selected?.id === deal.id ? null : deal)}
                      />
                    ))}
                    {colDeals.length === 0 && (
                      <div style={{ padding: '24px 12px', textAlign: 'center', color: '#333333', fontSize: '0.8125rem' }}>
                        Keine Deals
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* List View */}
        {!loading && view === 'list' && (
          <div style={{ backgroundColor: '#111111', border: '1px solid #1e1e1e', borderRadius: '10px', overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1fr 1fr', padding: '12px 20px', borderBottom: '1px solid #1c1c1c' }}>
              {['Kontakt', 'Objekt', 'Wert', 'Status', 'Provision'].map(h => (
                <span key={h} style={{ color: '#555555', fontSize: '0.75rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {h}
                </span>
              ))}
            </div>
            {filtered.length === 0 && (
              <div style={{ padding: '48px', textAlign: 'center', color: '#444444', fontSize: '0.875rem' }}>
                Keine Deals gefunden
              </div>
            )}
            {filtered.map((deal, i) => {
              const col = columns.find(c => c.status === deal.status)!
              return (
                <div
                  key={deal.id}
                  onClick={() => setSelected(selected?.id === deal.id ? null : deal)}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 2fr 1fr 1fr 1fr',
                    padding: '14px 20px',
                    borderBottom: i < filtered.length - 1 ? '1px solid #161616' : 'none',
                    cursor: 'pointer',
                    backgroundColor: selected?.id === deal.id ? '#161616' : 'transparent',
                    transition: 'background-color 0.1s',
                  }}
                  onMouseEnter={e => { if (selected?.id !== deal.id) (e.currentTarget as HTMLElement).style.backgroundColor = '#141414' }}
                  onMouseLeave={e => { if (selected?.id !== deal.id) (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent' }}
                >
                  <div style={{ color: '#eeeeee', fontSize: '0.875rem', fontWeight: 500 }}>{deal.contact.name}</div>
                  <div style={{ color: '#888888', fontSize: '0.875rem', paddingRight: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {deal.property.title}
                  </div>
                  <div style={{ color: '#eeeeee', fontSize: '0.875rem', fontWeight: 600 }}>{formatPrice(deal.value)}</div>
                  <div>
                    <span style={{ backgroundColor: col.bg, color: col.color, fontSize: '0.75rem', fontWeight: 500, padding: '3px 8px', borderRadius: '4px' }}>
                      {col.label}
                    </span>
                  </div>
                  <div style={{ color: '#888888', fontSize: '0.875rem' }}>{formatPrice(deal.commission)}</div>
                </div>
              )
            })}
          </div>
        )}

        {/* Deal Detail Panel */}
        {selected && selectedCol && (
          <div
            style={{
              position: 'fixed',
              right: '24px',
              top: '80px',
              width: '300px',
              backgroundColor: '#111111',
              border: '1px solid #242424',
              borderRadius: '12px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
              zIndex: 50,
              maxHeight: 'calc(100vh - 120px)',
              overflowY: 'auto',
            }}
          >
            <div style={{ padding: '20px', borderBottom: '1px solid #1c1c1c', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ color: selectedCol.color, fontSize: '1.25rem', fontWeight: 700 }}>{formatPrice(selected.value)}</div>
                <span style={{
                  backgroundColor: selectedCol.bg,
                  color: selectedCol.color,
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  padding: '2px 8px',
                  borderRadius: '4px',
                  display: 'inline-block',
                  marginTop: '4px',
                }}>
                  {selectedCol.label}
                </span>
              </div>
              <button
                onClick={() => setSelected(null)}
                style={{ background: 'none', border: 'none', color: '#555555', cursor: 'pointer', fontSize: '1.25rem', lineHeight: 1 }}
              >
                ×
              </button>
            </div>

            {/* Contact Info */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #1c1c1c' }}>
              <div style={{ color: '#555555', fontSize: '0.6875rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>Kontakt</div>
              <div style={{ color: '#eeeeee', fontSize: '0.9375rem', fontWeight: 600, marginBottom: '8px' }}>{selected.contact.name}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Mail size={13} color="#555555" />
                  <span style={{ color: '#888888', fontSize: '0.8125rem' }}>{selected.contact.email}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Phone size={13} color="#555555" />
                  <span style={{ color: '#888888', fontSize: '0.8125rem' }}>{selected.contact.phone}</span>
                </div>
              </div>
            </div>

            {/* Property Info */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #1c1c1c' }}>
              <div style={{ color: '#555555', fontSize: '0.6875rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>Objekt</div>
              <div style={{ color: '#eeeeee', fontSize: '0.875rem', fontWeight: 600, marginBottom: '4px' }}>{selected.property.title}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                <MapPin size={12} color="#555555" />
                <span style={{ color: '#888888', fontSize: '0.8125rem' }}>{selected.property.address}, {selected.property.city}</span>
              </div>
              <div style={{ color: '#6366f1', fontSize: '0.9375rem', fontWeight: 700 }}>{formatPrice(selected.property.price)}</div>
            </div>

            {/* Commission */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #1c1c1c' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#555555', fontSize: '0.8125rem' }}>Provision</span>
                <span style={{ color: '#22c55e', fontSize: '0.9375rem', fontWeight: 700 }}>{formatPrice(selected.commission)}</span>
              </div>
            </div>

            {selected.notes && (
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #1c1c1c' }}>
                <div style={{ color: '#555555', fontSize: '0.6875rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>Notizen</div>
                <p style={{ color: '#888888', fontSize: '0.8125rem', lineHeight: 1.5, margin: 0 }}>{selected.notes}</p>
              </div>
            )}

            <div style={{ padding: '16px 20px' }}>
              <button
                onClick={() => openEdit(selected)}
                style={{
                  width: '100%',
                  backgroundColor: '#1a1a1a',
                  border: '1px solid #2a2a2a',
                  borderRadius: '8px',
                  color: '#cccccc',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  padding: '9px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '7px',
                }}
              >
                <Pencil size={14} />
                Bearbeiten
              </button>
            </div>
          </div>
        )}
      </AppLayout>

      {modal.open && (
        <DealModal
          deal={modal.deal}
          onClose={() => setModal({ open: false, deal: null })}
          onSaved={handleSaved}
          onDeleted={handleDeleted}
        />
      )}
    </>
  )
}
