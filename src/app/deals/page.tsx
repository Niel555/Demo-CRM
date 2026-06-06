'use client'

import { useState } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import { mockDeals } from '@/lib/mock-data'
import { Deal, DealStatus } from '@/types'
import { Search, Plus, TrendingUp, MapPin, User } from 'lucide-react'

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

function DealCard({ deal, color }: { deal: Deal; color: string }) {
  return (
    <div
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
      {/* Value */}
      <div style={{ fontSize: '1rem', fontWeight: 700, color, marginBottom: '10px' }}>
        {formatPrice(deal.value)}
      </div>

      {/* Contact */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
        <User size={12} color="#555555" />
        <span style={{ color: '#dddddd', fontSize: '0.8125rem', fontWeight: 500 }}>{deal.contact.name}</span>
      </div>

      {/* Property */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', marginBottom: '10px' }}>
        <MapPin size={12} color="#555555" style={{ marginTop: '2px', flexShrink: 0 }} />
        <span style={{ color: '#666666', fontSize: '0.75rem', lineHeight: 1.3 }}>{deal.property.title}</span>
      </div>

      {/* Commission */}
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
  const [search, setSearch] = useState('')
  const [view, setView] = useState<'kanban' | 'list'>('kanban')

  const filtered = search
    ? mockDeals.filter(d =>
        d.contact.name.toLowerCase().includes(search.toLowerCase()) ||
        d.property.title.toLowerCase().includes(search.toLowerCase())
      )
    : mockDeals

  const totalValue = mockDeals.filter(d => d.status === 'won').reduce((s, d) => s + d.commission, 0)
  const pipelineValue = mockDeals.filter(d => !['won', 'lost'].includes(d.status)).reduce((s, d) => s + d.value, 0)

  return (
    <AppLayout
      title="Deals"
      subtitle={`${mockDeals.length} Deals im System`}
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

        {/* Search */}
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

      {/* Kanban View */}
      {view === 'kanban' && (
        <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '8px' }}>
          {columns.map(col => {
            const colDeals = filtered.filter(d => d.status === col.status)
            const colValue = colDeals.reduce((s, d) => s + d.value, 0)
            return (
              <div
                key={col.status}
                style={{ minWidth: '240px', width: '240px', flexShrink: 0 }}
              >
                {/* Column Header */}
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
                    <span
                      style={{
                        backgroundColor: `${col.color}22`,
                        color: col.color,
                        fontSize: '0.6875rem',
                        fontWeight: 600,
                        padding: '1px 6px',
                        borderRadius: '10px',
                      }}
                    >
                      {colDeals.length}
                    </span>
                  </div>
                  {colValue > 0 && (
                    <span style={{ color: '#555555', fontSize: '0.6875rem' }}>{formatPrice(colValue)}</span>
                  )}
                </div>

                {/* Column Cards */}
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
                    <DealCard key={deal.id} deal={deal} color={col.color} />
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
      {view === 'list' && (
        <div style={{ backgroundColor: '#111111', border: '1px solid #1e1e1e', borderRadius: '10px', overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1fr 1fr', padding: '12px 20px', borderBottom: '1px solid #1c1c1c' }}>
            {['Kontakt', 'Objekt', 'Wert', 'Status', 'Provision'].map(h => (
              <span key={h} style={{ color: '#555555', fontSize: '0.75rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {h}
              </span>
            ))}
          </div>
          {filtered.map((deal, i) => {
            const col = columns.find(c => c.status === deal.status)!
            return (
              <div
                key={deal.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 2fr 1fr 1fr 1fr',
                  padding: '14px 20px',
                  borderBottom: i < filtered.length - 1 ? '1px solid #161616' : 'none',
                  transition: 'background-color 0.1s',
                }}
                onMouseEnter={e => ((e.currentTarget as HTMLElement).style.backgroundColor = '#141414')}
                onMouseLeave={e => ((e.currentTarget as HTMLElement).style.backgroundColor = 'transparent')}
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
    </AppLayout>
  )
}
