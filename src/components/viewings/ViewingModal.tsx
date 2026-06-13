'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Viewing, ViewingStatus, Contact, Property, Deal } from '@/types'
import { X } from 'lucide-react'

interface Props {
  viewing: Viewing | null
  onClose: () => void
  onSaved: (viewing: Viewing) => void
  onDeleted: (id: string) => void
}

type FormState = {
  contact_id: string
  property_id: string
  deal_id: string
  date: string
  time: string
  status: ViewingStatus
  notes: string
}

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

const emptyForm: FormState = {
  contact_id: '',
  property_id: '',
  deal_id: '',
  date: todayStr(),
  time: '10:00',
  status: 'scheduled',
  notes: '',
}

function toForm(v: Viewing): FormState {
  return {
    contact_id: v.contact.id,
    property_id: v.property.id,
    deal_id: v.deal?.id ?? '',
    date: v.date,
    time: v.time.slice(0, 5),
    status: v.status,
    notes: v.notes ?? '',
  }
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  backgroundColor: '#181818',
  border: '1px solid #2a2a2a',
  borderRadius: '8px',
  color: '#eeeeee',
  fontSize: '0.875rem',
  padding: '9px 12px',
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  color: '#666666',
  fontSize: '0.75rem',
  fontWeight: 500,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  marginBottom: '6px',
}

export default function ViewingModal({ viewing, onClose, onSaved, onDeleted }: Props) {
  const isEdit = viewing !== null
  const [form, setForm] = useState<FormState>(viewing ? toForm(viewing) : emptyForm)
  const [contacts, setContacts] = useState<Contact[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [deals, setDeals] = useState<Deal[]>([])
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    Promise.all([
      supabase.from('contacts').select('*').order('name'),
      supabase.from('properties').select('*').order('title'),
      supabase.from('deals').select('*, contact:contacts(id, name), property:properties(id, title)').order('created_at', { ascending: false }),
    ]).then(([c, p, d]) => {
      setContacts((c.data ?? []) as Contact[])
      setProperties((p.data ?? []) as Property[])
      setDeals((d.data ?? []) as Deal[])
    })
  }, [])

  function set(key: keyof FormState) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm(prev => ({ ...prev, [key]: e.target.value }))
  }

  const filteredDeals = form.contact_id
    ? deals.filter(d => d.contact.id === form.contact_id)
    : deals

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.contact_id || !form.property_id) {
      setError('Kontakt und Objekt sind erforderlich')
      return
    }
    setError(null)
    setSaving(true)

    const supabase = createClient()
    const payload = {
      contact_id: form.contact_id,
      property_id: form.property_id,
      deal_id: form.deal_id || null,
      date: form.date,
      time: form.time,
      status: form.status,
      notes: form.notes.trim() || null,
    }

    let viewingId: string
    if (isEdit && viewing) {
      const { error: err } = await supabase
        .from('viewings')
        .update(payload)
        .eq('id', viewing.id)
      if (err) { setSaving(false); setError(err.message); return }
      viewingId = viewing.id
    } else {
      const { data: { user } } = await supabase.auth.getUser()
      const { data, error: err } = await supabase
        .from('viewings')
        .insert({ ...payload, user_id: user?.id })
        .select('id')
        .single()
      if (err) { setSaving(false); setError(err.message); return }
      viewingId = (data as { id: string }).id
    }

    const { data: fullViewing, error: fetchErr } = await supabase
      .from('viewings')
      .select('*, contact:contacts(*), property:properties(*), deal:deals(id, status)')
      .eq('id', viewingId)
      .single()
    setSaving(false)
    if (fetchErr) { setError(fetchErr.message); return }
    onSaved(fullViewing as Viewing)
  }

  async function handleDelete() {
    if (!viewing) return
    setDeleting(true)
    const supabase = createClient()
    const { error: err } = await supabase.from('viewings').delete().eq('id', viewing.id)
    setDeleting(false)
    if (err) { setError(err.message); return }
    onDeleted(viewing.id)
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 200,
        padding: '24px',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        style={{
          backgroundColor: '#111111',
          border: '1px solid #242424',
          borderRadius: '14px',
          width: '100%',
          maxWidth: '500px',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 32px 96px rgba(0,0,0,0.7)',
        }}
      >
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #1c1c1c', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#eeeeee' }}>
            {isEdit ? 'Besichtigung bearbeiten' : 'Neue Besichtigung'}
          </h2>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#555555', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {error && (
              <div style={{
                backgroundColor: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.25)',
                borderRadius: '8px',
                color: '#ef4444',
                fontSize: '0.875rem',
                padding: '10px 14px',
              }}>
                {error}
              </div>
            )}

            <div>
              <label style={labelStyle}>Kontakt *</label>
              <select value={form.contact_id} onChange={set('contact_id')} required style={inputStyle}>
                <option value="">— Kontakt wählen —</option>
                {contacts.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={labelStyle}>Objekt *</label>
              <select value={form.property_id} onChange={set('property_id')} required style={inputStyle}>
                <option value="">— Objekt wählen —</option>
                {properties.map(p => (
                  <option key={p.id} value={p.id}>{p.title} – {p.city}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={labelStyle}>Zugehöriger Deal (optional)</label>
              <select value={form.deal_id} onChange={set('deal_id')} style={inputStyle}>
                <option value="">— Kein Deal —</option>
                {filteredDeals.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.contact.name} → {d.property.title}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={labelStyle}>Datum *</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={set('date')}
                  required
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Uhrzeit *</label>
                <input
                  type="time"
                  value={form.time}
                  onChange={set('time')}
                  required
                  style={inputStyle}
                />
              </div>
            </div>

            <div>
              <label style={labelStyle}>Status *</label>
              <select value={form.status} onChange={set('status')} style={inputStyle}>
                <option value="scheduled">Geplant</option>
                <option value="completed">Abgeschlossen</option>
                <option value="cancelled">Abgesagt</option>
              </select>
            </div>

            <div>
              <label style={labelStyle}>Notizen</label>
              <textarea
                value={form.notes}
                onChange={set('notes')}
                placeholder="Weitere Informationen zur Besichtigung…"
                rows={3}
                style={{ ...inputStyle, resize: 'vertical' }}
              />
            </div>
          </div>

          <div style={{ padding: '16px 24px', borderTop: '1px solid #1c1c1c', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ minHeight: '36px', display: 'flex', alignItems: 'center' }}>
              {isEdit && !confirmDelete && (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  style={{
                    background: 'none',
                    border: '1px solid rgba(239,68,68,0.3)',
                    borderRadius: '8px',
                    color: '#ef4444',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    padding: '7px 14px',
                  }}
                >
                  Löschen
                </button>
              )}
              {isEdit && confirmDelete && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: '#777777', fontSize: '0.8125rem' }}>Wirklich löschen?</span>
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={deleting}
                    style={{
                      backgroundColor: '#ef4444',
                      border: 'none',
                      borderRadius: '8px',
                      color: 'white',
                      cursor: deleting ? 'not-allowed' : 'pointer',
                      fontSize: '0.8125rem',
                      fontWeight: 600,
                      opacity: deleting ? 0.6 : 1,
                      padding: '6px 12px',
                    }}
                  >
                    {deleting ? '…' : 'Ja, löschen'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    style={{
                      background: 'none',
                      border: '1px solid #2a2a2a',
                      borderRadius: '8px',
                      color: '#777777',
                      cursor: 'pointer',
                      fontSize: '0.8125rem',
                      padding: '6px 12px',
                    }}
                  >
                    Nein
                  </button>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  background: 'none',
                  border: '1px solid #2a2a2a',
                  borderRadius: '8px',
                  color: '#777777',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  padding: '8px 16px',
                }}
              >
                Abbrechen
              </button>
              <button
                type="submit"
                disabled={saving}
                style={{
                  backgroundColor: '#6366f1',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  opacity: saving ? 0.7 : 1,
                  padding: '8px 20px',
                }}
              >
                {saving ? 'Speichern…' : isEdit ? 'Speichern' : 'Erstellen'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
