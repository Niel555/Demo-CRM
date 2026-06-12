'use client'

import { useState, useEffect } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import { createClient } from '@/lib/supabase/client'
import { Property, PropertyStatus, PropertyType } from '@/types'
import { Search, Plus, MapPin, Maximize2, DoorOpen, Building2, Home, Landmark, TreePine } from 'lucide-react'

const statusLabel: Record<PropertyStatus, string> = {
  available: 'Verfügbar',
  reserved: 'Reserviert',
  sold: 'Verkauft',
}

const statusColor: Record<PropertyStatus, { bg: string; text: string; dot: string }> = {
  available: { bg: 'rgba(34,197,94,0.1)', text: '#22c55e', dot: '#22c55e' },
  reserved: { bg: 'rgba(245,158,11,0.1)', text: '#f59e0b', dot: '#f59e0b' },
  sold: { bg: 'rgba(100,100,100,0.1)', text: '#777777', dot: '#555555' },
}

const typeLabel: Record<PropertyType, string> = {
  apartment: 'Wohnung',
  house: 'Haus',
  commercial: 'Gewerbe',
  land: 'Grundstück',
}

const typeIcon: Record<PropertyType, React.ComponentType<{ size: number; color?: string }>> = {
  apartment: Building2,
  house: Home,
  commercial: Landmark,
  land: TreePine,
}

function formatPrice(n: number) {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)
}

const filterOptions = [
  { label: 'Alle', value: 'all' },
  { label: 'Verfügbar', value: 'available' },
  { label: 'Reserviert', value: 'reserved' },
  { label: 'Verkauft', value: 'sold' },
]

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  useEffect(() => {
    const supabase = createClient()
    supabase.from('properties').select('*').order('created_at', { ascending: false }).then(({ data }) => {
      setProperties((data ?? []) as Property[])
      setLoading(false)
    })
  }, [])

  const filtered = properties.filter(p => {
    const matchStatus = statusFilter === 'all' || p.status === statusFilter
    const matchSearch = !search ||
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.address.toLowerCase().includes(search.toLowerCase()) ||
      p.city.toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchSearch
  })

  return (
    <AppLayout
      title="Objekte"
      subtitle={loading ? 'Wird geladen…' : `${properties.length} Immobilien im Portfolio`}
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
          Neues Objekt
        </button>
      }
    >
      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '320px' }}>
          <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#555555' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Titel, Adresse oder Stadt..."
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

      {/* Stats row */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
        {(['available', 'reserved', 'sold'] as PropertyStatus[]).map(status => {
          const count = properties.filter(p => p.status === status).length
          const sc = statusColor[status]
          return (
            <div
              key={status}
              style={{
                backgroundColor: '#111111',
                border: '1px solid #1e1e1e',
                borderRadius: '8px',
                padding: '10px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: sc.dot }} />
              <span style={{ color: '#888888', fontSize: '0.8125rem' }}>{statusLabel[status]}:</span>
              <span style={{ color: '#eeeeee', fontSize: '0.9375rem', fontWeight: 600 }}>{count}</span>
            </div>
          )
        })}
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ padding: '80px', textAlign: 'center', color: '#444444', fontSize: '0.875rem' }}>
          Wird geladen…
        </div>
      )}

      {/* Cards Grid */}
      {!loading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
          {filtered.map(property => {
            const sc = statusColor[property.status]
            const TypeIcon = typeIcon[property.type]
            return (
              <div
                key={property.id}
                style={{
                  backgroundColor: '#111111',
                  border: '1px solid #1e1e1e',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  transition: 'border-color 0.15s, transform 0.15s',
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLElement
                  el.style.borderColor = '#333333'
                  el.style.transform = 'translateY(-2px)'
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLElement
                  el.style.borderColor = '#1e1e1e'
                  el.style.transform = 'translateY(0)'
                }}
              >
                {/* Image placeholder */}
                <div
                  style={{
                    height: '160px',
                    background: 'linear-gradient(135deg, #161616 0%, #1a1a1a 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                  }}
                >
                  <TypeIcon size={48} color="#2a2a2a" />
                  <div style={{ position: 'absolute', top: '12px', right: '12px' }}>
                    <span
                      style={{
                        backgroundColor: sc.bg,
                        border: `1px solid ${sc.text}33`,
                        color: sc.text,
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        padding: '4px 10px',
                        borderRadius: '20px',
                      }}
                    >
                      {statusLabel[property.status]}
                    </span>
                  </div>
                  <div style={{ position: 'absolute', top: '12px', left: '12px' }}>
                    <span
                      style={{
                        backgroundColor: 'rgba(0,0,0,0.6)',
                        color: '#999999',
                        fontSize: '0.6875rem',
                        padding: '3px 8px',
                        borderRadius: '4px',
                      }}
                    >
                      {typeLabel[property.type]}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div style={{ padding: '16px' }}>
                  <h3 style={{ margin: '0 0 6px', color: '#eeeeee', fontSize: '0.9375rem', fontWeight: 600, lineHeight: 1.3 }}>
                    {property.title}
                  </h3>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
                    <MapPin size={12} color="#555555" />
                    <span style={{ color: '#666666', fontSize: '0.8125rem' }}>{property.address}</span>
                  </div>

                  {/* Specs */}
                  <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Maximize2 size={12} color="#555555" />
                      <span style={{ color: '#888888', fontSize: '0.8125rem' }}>{property.size} m²</span>
                    </div>
                    {property.rooms > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <DoorOpen size={12} color="#555555" />
                        <span style={{ color: '#888888', fontSize: '0.8125rem' }}>{property.rooms} Zimmer</span>
                      </div>
                    )}
                  </div>

                  {/* Price */}
                  <div style={{ borderTop: '1px solid #1c1c1c', paddingTop: '12px' }}>
                    <span style={{ color: '#6366f1', fontSize: '1.125rem', fontWeight: 700 }}>
                      {formatPrice(property.price)}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}

          {filtered.length === 0 && (
            <div style={{ gridColumn: '1/-1', padding: '48px', textAlign: 'center', color: '#444444', fontSize: '0.875rem' }}>
              Keine Objekte gefunden
            </div>
          )}
        </div>
      )}
    </AppLayout>
  )
}
