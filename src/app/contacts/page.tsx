'use client'

import { useState, useEffect } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import ContactModal from '@/components/contacts/ContactModal'
import { createClient } from '@/lib/supabase/client'
import { Contact, ContactType, ContactStatus, DealStatus, ViewingStatus } from '@/types'
import { Search, Plus, Mail, Phone, UserCheck, UserX, User, Pencil, TrendingUp, Calendar } from 'lucide-react'

const typeLabel: Record<ContactType, string> = {
  buyer: 'Käufer',
  seller: 'Verkäufer',
  prospect: 'Interessent',
}

const typeColor: Record<ContactType, { bg: string; text: string }> = {
  buyer: { bg: 'rgba(59,130,246,0.12)', text: '#3b82f6' },
  seller: { bg: 'rgba(34,197,94,0.12)', text: '#22c55e' },
  prospect: { bg: 'rgba(168,85,247,0.12)', text: '#a855f7' },
}

const statusColor: Record<ContactStatus, { bg: string; text: string }> = {
  active: { bg: 'rgba(34,197,94,0.1)', text: '#22c55e' },
  inactive: { bg: 'rgba(245,158,11,0.1)', text: '#f59e0b' },
  closed: { bg: 'rgba(100,100,100,0.1)', text: '#777777' },
}

const statusLabel: Record<ContactStatus, string> = {
  active: 'Aktiv',
  inactive: 'Inaktiv',
  closed: 'Abgeschlossen',
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

type ContactDeal = {
  id: string
  status: DealStatus
  value: number
  property: { id: string; title: string; city: string } | null
}

type ContactViewing = {
  id: string
  date: string
  time: string
  status: ViewingStatus
  property: { id: string; title: string } | null
}

function formatBudget(n?: number | null) {
  if (!n) return '—'
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)
}

const filterOptions = [
  { label: 'Alle', value: 'all' },
  { label: 'Käufer', value: 'buyer' },
  { label: 'Verkäufer', value: 'seller' },
  { label: 'Interessenten', value: 'prospect' },
]

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [selected, setSelected] = useState<Contact | null>(null)
  const [modal, setModal] = useState<{ open: boolean; contact: Contact | null }>({ open: false, contact: null })
  const [relDeals, setRelDeals] = useState<ContactDeal[]>([])
  const [relViewings, setRelViewings] = useState<ContactViewing[]>([])
  const [relLoading, setRelLoading] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('contacts')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setContacts((data ?? []) as Contact[])
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
        .select('id, status, value, property:properties(id, title, city)')
        .eq('contact_id', selected.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('viewings')
        .select('id, date, time, status, property:properties(id, title)')
        .eq('contact_id', selected.id)
        .order('date', { ascending: false }),
    ]).then(([d, v]) => {
      setRelDeals((d.data ?? []) as unknown as ContactDeal[])
      setRelViewings((v.data ?? []) as unknown as ContactViewing[])
      setRelLoading(false)
    })
  }, [selected?.id])

  function openCreate() { setModal({ open: true, contact: null }) }
  function openEdit(contact: Contact) { setModal({ open: true, contact }) }

  function handleSaved(saved: Contact) {
    setContacts(prev => {
      const idx = prev.findIndex(c => c.id === saved.id)
      if (idx >= 0) { const next = [...prev]; next[idx] = saved; return next }
      return [saved, ...prev]
    })
    if (selected?.id === saved.id) setSelected(saved)
    setModal({ open: false, contact: null })
  }

  function handleDeleted(id: string) {
    setContacts(prev => prev.filter(c => c.id !== id))
    if (selected?.id === id) setSelected(null)
    setModal({ open: false, contact: null })
  }

  const filtered = contacts.filter(c => {
    const matchType = typeFilter === 'all' || c.type === typeFilter
    const matchSearch =
      !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search)
    return matchType && matchSearch
  })

  return (
    <>
      <AppLayout
        title="Kontakte"
        subtitle={loading ? 'Wird geladen…' : `${contacts.length} Kontakte insgesamt`}
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
            Neuer Kontakt
          </button>
        }
      >
        {/* Filters */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: '320px' }}>
            <Search
              size={15}
              style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#555555' }}
            />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Name, E-Mail oder Telefon suchen..."
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
                onClick={() => setTypeFilter(opt.value)}
                style={{
                  backgroundColor: typeFilter === opt.value ? '#1e1e1e' : 'transparent',
                  border: 'none',
                  borderRadius: '6px',
                  color: typeFilter === opt.value ? '#eeeeee' : '#666666',
                  cursor: 'pointer',
                  fontSize: '0.8125rem',
                  fontWeight: typeFilter === opt.value ? 500 : 400,
                  padding: '6px 12px',
                  transition: 'all 0.1s',
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div style={{ backgroundColor: '#111111', border: '1px solid #1e1e1e', borderRadius: '10px', overflow: 'hidden' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr',
              padding: '12px 20px',
              borderBottom: '1px solid #1c1c1c',
            }}
          >
            {['Name', 'Typ', 'Telefon', 'Budget', 'Status'].map(h => (
              <span key={h} style={{ color: '#555555', fontSize: '0.75rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {h}
              </span>
            ))}
          </div>

          {loading && (
            <div style={{ padding: '48px', textAlign: 'center', color: '#444444', fontSize: '0.875rem' }}>
              Wird geladen…
            </div>
          )}

          {!loading && filtered.map((contact, i) => {
            const tc = typeColor[contact.type]
            const sc = statusColor[contact.status]
            return (
              <div
                key={contact.id}
                onClick={() => setSelected(selected?.id === contact.id ? null : contact)}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr',
                  padding: '14px 20px',
                  borderBottom: i < filtered.length - 1 ? '1px solid #161616' : 'none',
                  cursor: 'pointer',
                  backgroundColor: selected?.id === contact.id ? '#161616' : 'transparent',
                  transition: 'background-color 0.1s',
                }}
                onMouseEnter={e => {
                  if (selected?.id !== contact.id)
                    (e.currentTarget as HTMLElement).style.backgroundColor = '#141414'
                }}
                onMouseLeave={e => {
                  if (selected?.id !== contact.id)
                    (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      backgroundColor: tc.bg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <User size={14} color={tc.text} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ color: '#eeeeee', fontSize: '0.875rem', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {contact.name}
                    </div>
                    <div style={{ color: '#555555', fontSize: '0.75rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {contact.email}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span style={{ backgroundColor: tc.bg, color: tc.text, fontSize: '0.75rem', fontWeight: 500, padding: '3px 8px', borderRadius: '4px' }}>
                    {typeLabel[contact.type]}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', color: '#888888', fontSize: '0.875rem' }}>
                  {contact.phone}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', color: '#888888', fontSize: '0.875rem' }}>
                  {formatBudget(contact.budget)}
                </div>

                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span style={{ backgroundColor: sc.bg, color: sc.text, fontSize: '0.75rem', fontWeight: 500, padding: '3px 8px', borderRadius: '4px' }}>
                    {statusLabel[contact.status]}
                  </span>
                </div>
              </div>
            )
          })}

          {!loading && filtered.length === 0 && (
            <div style={{ padding: '48px', textAlign: 'center', color: '#444444', fontSize: '0.875rem' }}>
              Keine Kontakte gefunden
            </div>
          )}
        </div>

        {/* Detail Panel */}
        {selected && (
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
            {/* Panel Header */}
            <div style={{ padding: '20px', borderBottom: '1px solid #1c1c1c', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ margin: 0, color: '#eeeeee', fontSize: '1rem', fontWeight: 600 }}>{selected.name}</h3>
                <span style={{
                  backgroundColor: typeColor[selected.type].bg,
                  color: typeColor[selected.type].text,
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  padding: '2px 8px',
                  borderRadius: '4px',
                  display: 'inline-block',
                  marginTop: '4px',
                }}>
                  {typeLabel[selected.type]}
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
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #1c1c1c', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Mail size={14} color="#555555" />
                <span style={{ color: '#aaaaaa', fontSize: '0.875rem' }}>{selected.email}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Phone size={14} color="#555555" />
                <span style={{ color: '#aaaaaa', fontSize: '0.875rem' }}>{selected.phone}</span>
              </div>
              {selected.budget && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <UserCheck size={14} color="#555555" />
                  <span style={{ color: '#aaaaaa', fontSize: '0.875rem' }}>Budget: {formatBudget(selected.budget)}</span>
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <UserX size={14} color="#555555" />
                <span style={{ color: '#aaaaaa', fontSize: '0.875rem' }}>Status: {statusLabel[selected.status]}</span>
              </div>
              {selected.notes && (
                <div style={{ marginTop: '4px' }}>
                  <div style={{ color: '#555555', fontSize: '0.75rem', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Notizen</div>
                  <p style={{ color: '#888888', fontSize: '0.8125rem', lineHeight: 1.5, margin: 0 }}>{selected.notes}</p>
                </div>
              )}
            </div>

            {/* Related Deals */}
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
                        <span style={{ color: '#cccccc', fontSize: '0.8125rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '140px' }}>
                          {d.property?.title ?? '—'}
                        </span>
                        <span style={{ color: dealStatusColor[d.status], fontSize: '0.75rem', fontWeight: 600, flexShrink: 0 }}>
                          {dealStatusLabel[d.status]}
                        </span>
                      </div>
                      <div style={{ color: '#6366f1', fontSize: '0.8125rem', fontWeight: 600, marginTop: '2px' }}>
                        {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(d.value)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Related Viewings */}
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
                        <span style={{ color: '#cccccc', fontSize: '0.8125rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '140px' }}>
                          {v.property?.title ?? '—'}
                        </span>
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

            {/* Edit Button */}
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
        <ContactModal
          contact={modal.contact}
          onClose={() => setModal({ open: false, contact: null })}
          onSaved={handleSaved}
          onDeleted={handleDeleted}
        />
      )}
    </>
  )
}
