'use client'

import { useState } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import { mockViewings } from '@/lib/mock-data'
import { ViewingStatus } from '@/types'
import { Search, Plus, Clock, Calendar, CheckCircle, XCircle, AlarmClock } from 'lucide-react'

const statusConfig: Record<ViewingStatus, { label: string; color: string; bg: string; icon: React.ComponentType<{ size: number; color: string }> }> = {
  scheduled: { label: 'Geplant', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', icon: AlarmClock },
  completed: { label: 'Abgeschlossen', color: '#22c55e', bg: 'rgba(34,197,94,0.1)', icon: CheckCircle },
  cancelled: { label: 'Abgesagt', color: '#ef4444', bg: 'rgba(239,68,68,0.1)', icon: XCircle },
}

const filterOptions = [
  { label: 'Alle', value: 'all' },
  { label: 'Geplant', value: 'scheduled' },
  { label: 'Abgeschlossen', value: 'completed' },
  { label: 'Abgesagt', value: 'cancelled' },
]

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 1)

  if (d.toDateString() === today.toDateString()) return 'Heute'
  if (d.toDateString() === tomorrow.toDateString()) return 'Morgen'
  return d.toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: 'short' })
}

export default function ViewingsPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const filtered = mockViewings.filter(v => {
    const matchStatus = statusFilter === 'all' || v.status === statusFilter
    const matchSearch = !search ||
      v.contact.name.toLowerCase().includes(search.toLowerCase()) ||
      v.property.title.toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchSearch
  })

  const sorted = [...filtered].sort((a, b) =>
    new Date(a.date + 'T' + a.time).getTime() - new Date(b.date + 'T' + b.time).getTime()
  )

  const scheduled = mockViewings.filter(v => v.status === 'scheduled').length
  const completed = mockViewings.filter(v => v.status === 'completed').length
  const cancelled = mockViewings.filter(v => v.status === 'cancelled').length

  return (
    <AppLayout
      title="Besichtigungen"
      subtitle={`${mockViewings.length} Termine insgesamt`}
      actions={
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
          Neue Besichtigung
        </button>
      }
    >
      {/* Stats */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
        {[
          { label: 'Geplant', value: scheduled, color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
          { label: 'Abgeschlossen', value: completed, color: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
          { label: 'Abgesagt', value: cancelled, color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
        ].map(s => (
          <div
            key={s.label}
            style={{
              backgroundColor: '#111111',
              border: '1px solid #1e1e1e',
              borderRadius: '8px',
              padding: '12px 18px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: s.bg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span style={{ fontSize: '1rem', fontWeight: 700, color: s.color }}>{s.value}</span>
            </div>
            <span style={{ color: '#777777', fontSize: '0.875rem' }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '320px' }}>
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
              width: '100%',
              outline: 'none',
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '4px', backgroundColor: '#111111', border: '1px solid #1e1e1e', borderRadius: '8px', padding: '4px' }}>
          {filterOptions.map(opt => (
            <button
              key={opt.value}
              onClick={() => setStatusFilter(opt.value)}
              style={{
                backgroundColor: statusFilter === opt.value ? '#1e1e1e' : 'transparent',
                border: 'none',
                borderRadius: '6px',
                color: statusFilter === opt.value ? '#eeeeee' : '#666666',
                cursor: 'pointer',
                fontSize: '0.8125rem',
                fontWeight: statusFilter === opt.value ? 500 : 400,
                padding: '6px 12px',
                transition: 'all 0.1s',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Viewings List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {sorted.map(viewing => {
          const sc = statusConfig[viewing.status]
          const StatusIcon = sc.icon
          return (
            <div
              key={viewing.id}
              style={{
                backgroundColor: '#111111',
                border: '1px solid #1e1e1e',
                borderRadius: '10px',
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '16px',
                cursor: 'pointer',
                transition: 'border-color 0.1s',
              }}
              onMouseEnter={e => ((e.currentTarget as HTMLElement).style.borderColor = '#2a2a2a')}
              onMouseLeave={e => ((e.currentTarget as HTMLElement).style.borderColor = '#1e1e1e')}
            >
              {/* Date Block */}
              <div
                style={{
                  backgroundColor: '#181818',
                  border: '1px solid #222222',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  textAlign: 'center',
                  minWidth: '72px',
                  flexShrink: 0,
                }}
              >
                <div style={{ color: '#6366f1', fontSize: '0.6875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {formatDate(viewing.date)}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginTop: '4px' }}>
                  <Clock size={11} color="#555555" />
                  <span style={{ color: '#f59e0b', fontSize: '0.875rem', fontWeight: 700 }}>{viewing.time}</span>
                </div>
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
                  <span style={{ color: '#eeeeee', fontSize: '0.9375rem', fontWeight: 600 }}>
                    {viewing.contact.name}
                  </span>
                  <span style={{ color: '#444444', fontSize: '0.875rem' }}>→</span>
                  <span style={{ color: '#888888', fontSize: '0.875rem' }}>{viewing.property.title}</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <Calendar size={12} color="#444444" />
                  <span style={{ color: '#555555', fontSize: '0.75rem' }}>
                    {new Date(viewing.date).toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                </div>

                {viewing.notes && (
                  <p style={{ color: '#555555', fontSize: '0.8125rem', margin: '6px 0 0', lineHeight: 1.4 }}>
                    {viewing.notes}
                  </p>
                )}
              </div>

              {/* Status */}
              <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div
                  style={{
                    backgroundColor: sc.bg,
                    border: `1px solid ${sc.color}33`,
                    borderRadius: '20px',
                    padding: '5px 10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <StatusIcon size={13} color={sc.color} />
                  <span style={{ color: sc.color, fontSize: '0.75rem', fontWeight: 600 }}>{sc.label}</span>
                </div>
              </div>
            </div>
          )
        })}

        {sorted.length === 0 && (
          <div style={{ padding: '48px', textAlign: 'center', color: '#444444', fontSize: '0.875rem', backgroundColor: '#111111', borderRadius: '10px', border: '1px solid #1e1e1e' }}>
            Keine Besichtigungen gefunden
          </div>
        )}
      </div>
    </AppLayout>
  )
}
