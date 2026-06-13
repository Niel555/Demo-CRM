'use client'

import { useState, useEffect } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import PropertyModal from '@/components/properties/PropertyModal'
import { createClient } from '@/lib/supabase/client'
import { Property, PropertyStatus, PropertyType, DealStatus, ViewingStatus } from '@/types'
import { Search, Plus, MapPin, Maximize2, DoorOpen, Building2, Home, Landmark, TreePine, Pencil, TrendingUp, Calendar } from 'lucide-react'

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

const dealStatusLabel: Record<DealStatus, string> = {
  lead: 'Lead',
  viewing: 'Besichtigung',
  offer: 'Angebot',
  won: 'Gewonnen',
  lost: 'Verloren',
}

const dealStatusColor: Record<DealStatus, string> = {
  lead: '#3b82f6',
  viewing: '#f59e0b',
  offer: '#a855f7',
  won: '#22c55e',
  lost: '#ef4444',
}

const viewingStatusLabel: Record<ViewingStatus, string> = {
  scheduled: 'Geplant',
  completed: 'Abgeschlossen',
  cancelled: 'Abgesagt',
}

type PropertyDeal = {
  id: string
  status: DealStatus
  value: number
  commission: number
  contact: { id: string; name: string } | null
}

type PropertyViewing = {
  id: string
  date: string
  time: string
  status: ViewingStatus
  contact: { id: string; name: string } | null
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
  const [selected, setSelected] = useState<Property | null>(null)
  const [modal, setModal] = useState<{ open: boolean; property: Property | null }>({ open: false, property: null })
  const [relDeals, setRelDeals] = useState<PropertyDeal[]>([])
  const [relViewings, setRelViewings] = useState<PropertyViewing[]>([])
  const [relLoading, setRelLoading] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.from('properties').select('*').order('created_at', { ascending: false }).then(({ data }) => {
      setProperties((data ?? []) as Property[])
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    if (!selected) { setRelDeals([]); setRelViewings([]); return }
    setRelLoading(true)
    const supabase = createClient()
    Promise.all([
      supabase
        .from('deals')
        .select('id, status, value, commission, contact:contacts(id, name)')
        .eq('property_id', selected.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('viewings')
        .select('id, date, time, status, contact:contacts(id, name)')
        .eq('property_id', selected.id)
        .order('date', { ascending: false }),
    ]).then(([d, v]) => {
      setRelDeals((d.data ?? []) as unknown as PropertyDeal[])
      setRelViewings((v.data ?? []) as unknown as PropertyViewing[])
      setRelLoading(false)
    })
  }, [selected?.id])

  function openCreate() { setModal({ open: true, property: null }) }
  function openEdit(p: Property) { setModal({ open: true, property: p }) }

  function handleSaved(saved: Property) {
    setProperties(prev => {
      const idx = prev.findIndex(p => p.id === saved.id)
      if (idx >= 0) { const next = [...prev]; next[idx] = saved; return next }
      return [saved, ...prev]
    })
    if (selected?.id === saved.id) setSelected(saved)
    setModal({ open: false, property: null })
  }

  function handleDeleted(id: string) {
    setProperties(prev => prev.filter(p => p.id !== id))
    if (selected?.id === id) setSelected(null)
    setModal({ open: false, property: null })
  }

  const filtered = properties.filter(p => {
    const matchStatus = statusFilter === 'all' || p.status === statusFilter
    const matchSearch = !search ||
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.address.toLowerCase().includes(search.toLowerCase()) ||
      p.city.toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchSearch
  })

  return (
    <>
      <AppLayout
        title="Objekte"
        subtitle={loading ? 'Wird geladen…' : `${properties.length} Immobilien im Portfolio`}
        actions={
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

        {loading && (
          <div style={{ padding: '80px', textAlign: 'center', color: '#444444', fontSize: '0.875rem' }}>
            Wird geladen…
          </div>
        )}

        {!loading && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
            {filtered.map(property => {
              const sc = statusColor[property.status]
              const TypeIcon = typeIcon[property.type]
              const isSelected = selected?.id === property.id
              return (
                <div
                  key={property.id}
                  onClick={() => setSelected(isSelected ? null : property)}
                  style={{
                    backgroundColor: '#111111',
                    border: `1px solid ${isSelected ? '#6366f1' : '#1e1e1e'}`,
                    borderRadius: '10px',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    transition: 'border-color 0.15s, transform 0.15s',
                  }}
                  onMouseEnter={e => {
                    if (!isSelected) (e.currentTarget as HTMLElement).style.borderColor = '#333333'
                    ;(e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'
                  }}
                  onMouseLeave={e => {
                    if (!isSelected) (e.currentTarget as HTMLElement).style.borderColor = '#1e1e1e'
                    ;(e.currentTarget as HTMLElement).style.transform = 'translateY(0)'
                  }}
                >
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
                      <span style={{
                        backgroundColor: sc.bg,
                        border: `1px solid ${sc.text}33`,
                        color: sc.text,
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        padding: '4px 10px',
                        borderRadius: '20px',
                      }}>
                        {statusLabel[property.status]}
                      </span>
                    </div>
                    <div style={{ position: 'absolute', top: '12px', left: '12px' }}>
                      <span style={{
                        backgroundColor: 'rgba(0,0,0,0.6)',
                        color: '#999999',
                        fontSize: '0.6875rem',
                        padding: '3px 8px',
                        borderRadius: '4px',
                      }}>
                        {typeLabel[property.type]}
                      </span>
                    </div>
                  </div>

                  <div style={{ padding: '16px' }}>
                    <h3 style={{ margin: '0 0 6px', color: '#eeeeee', fontSize: '0.9375rem', fontWeight: 600, lineHeight: 1.3 }}>
                      {property.title}
                    </h3>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
                      <MapPin size={12} color="#555555" />
                      <span style={{ color: '#666666', fontSize: '0.8125rem' }}>{property.address}, {property.city}</span>
                    </div>

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

        {/* Detail Panel */}
        {selected && (
          <div
            style={{
              position: 'fixed',
              right: '24px',
              top: '80px',
              width: '320px',
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
              <div style={{ flex: 1, minWidth: 0, paddingRight: '12px' }}>
                <h3 style={{ margin: '0 0 4px', color: '#eeeeee', fontSize: '0.9375rem', fontWeight: 600, lineHeight: 1.3 }}>{selected.title}</h3>
                <span style={{
                  backgroundColor: statusColor[selected.status].bg,
                  color: statusColor[selected.status].text,
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  padding: '2px 8px',
                  borderRadius: '4px',
                  display: 'inline-block',
                }}>
                  {statusLabel[selected.status]}
                </span>
              </div>
              <button
                onClick={() => setSelected(null)}
                style={{ background: 'none', border: 'none', color: '#555555', cursor: 'pointer', fontSize: '1.25rem', lineHeight: 1, flexShrink: 0 }}
              >
                ×
              </button>
            </div>

            <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '10px', borderBottom: '1px solid #1c1c1c' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MapPin size={13} color="#555555" />
                <span style={{ color: '#aaaaaa', fontSize: '0.875rem' }}>{selected.address}, {selected.city}</span>
              </div>
              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Maximize2 size={13} color="#555555" />
                  <span style={{ color: '#aaaaaa', fontSize: '0.875rem' }}>{selected.size} m²</span>
                </div>
                {selected.rooms > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <DoorOpen size={13} color="#555555" />
                    <span style={{ color: '#aaaaaa', fontSize: '0.875rem' }}>{selected.rooms} Zimmer</span>
                  </div>
                )}
              </div>
              <div style={{ color: '#6366f1', fontSize: '1.125rem', fontWeight: 700 }}>{formatPrice(selected.price)}</div>
              {selected.description && (
                <p style={{ color: '#777777', fontSize: '0.8125rem', lineHeight: 1.5, margin: 0 }}>{selected.description}</p>
              )}
            </div>

            {/* Linked Deals */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #1c1c1c' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                <TrendingUp size={13} color="#555555" />
                <span style={{ color: '#666666', fontSize: '0.75rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Deals ({relDeals.length})
                </span>
              </div>
              {relLoading ? (
                <div style={{ color: '#444444', fontSize: '0.8125rem' }}>Laden…</div>
              ) : relDeals.length === 0 ? (
                <div style={{ color: '#444444', fontSize: '0.8125rem' }}>Keine Deals</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {relDeals.map(d => (
                    <div key={d.id} style={{ backgroundColor: '#181818', borderRadius: '6px', padding: '8px 10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: '#cccccc', fontSize: '0.8125rem' }}>{d.contact?.name ?? '—'}</span>
                        <span style={{ color: dealStatusColor[d.status], fontSize: '0.75rem', fontWeight: 600 }}>
                          {dealStatusLabel[d.status]}
                        </span>
                      </div>
                      <div style={{ color: '#6366f1', fontSize: '0.8125rem', fontWeight: 600, marginTop: '2px' }}>{formatPrice(d.value)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Linked Viewings */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #1c1c1c' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                <Calendar size={13} color="#555555" />
                <span style={{ color: '#666666', fontSize: '0.75rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Besichtigungen ({relViewings.length})
                </span>
              </div>
              {relLoading ? (
                <div style={{ color: '#444444', fontSize: '0.8125rem' }}>Laden…</div>
              ) : relViewings.length === 0 ? (
                <div style={{ color: '#444444', fontSize: '0.8125rem' }}>Keine Besichtigungen</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {relViewings.map(v => (
                    <div key={v.id} style={{ backgroundColor: '#181818', borderRadius: '6px', padding: '8px 10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: '#cccccc', fontSize: '0.8125rem' }}>{v.contact?.name ?? '—'}</span>
                        <span style={{ color: '#555555', fontSize: '0.75rem' }}>{viewingStatusLabel[v.status]}</span>
                      </div>
                      <div style={{ color: '#f59e0b', fontSize: '0.75rem', marginTop: '2px' }}>
                        {new Date(v.date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })} · {v.time.slice(0, 5)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

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
        <PropertyModal
          property={modal.property}
          onClose={() => setModal({ open: false, property: null })}
          onSaved={handleSaved}
          onDeleted={handleDeleted}
        />
      )}
    </>
  )
}
