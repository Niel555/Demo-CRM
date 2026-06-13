'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Deal, DealStatus, Contact, Property } from '@/types'
import { X } from 'lucide-react'

interface Props {
  deal: Deal | null
  onClose: () => void
  onSaved: (deal: Deal) => void
  onDeleted: (id: string) => void
}

type FormState = {
  contact_id: string
  property_id: string
  status: DealStatus
  value: string
  commission: string
  notes: string
}

const emptyForm: FormState = {
  contact_id: '',
  property_id: '',
  status: 'lead',
  value: '',
  commission: '',
  notes: '',
}

function toForm(d: Deal): FormState {
  return {
    contact_id: d.contact.id,
    property_id: d.property.id,
    status: d.status,
    value: String(d.value),
    commission: String(d.commission),
    notes: d.notes ?? '',
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

export default function DealModal({ deal, onClose, onSaved, onDeleted }: Props) {
  const isEdit = deal !== null
  const [form, setForm] = useState<FormState>(deal ? toForm(deal) : emptyForm)
  const [contacts, setContacts] = useState<Contact[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    Promise.all([
      supabase.from('contacts').select('*').order('name'),
      supabase.from('properties').select('*').order('title'),
    ]).then(([c, p]) => {
      setContacts((c.data ?? []) as Contact[])
      setProperties((p.data ?? []) as Property[])
    })
  }, [])

  function set(key: keyof FormState) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm(prev => ({ ...prev, [key]: e.target.value }))
  }

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
      status: form.status,
      value: Number(form.value),
      commission: Number(form.commission),
      notes: form.notes.trim() || null,
    }

    let dealId: string
    if (isEdit && deal) {
      const { error: err } = await supabase
        .from('deals')
        .update(payload)
        .eq('id', deal.id)
      if (err) { setSaving(false); setError(err.message); return }
      dealId = deal.id
    } else {
      const { data: { user } } = await supabase.auth.getUser()
      const { data, error: err } = await supabase
        .from('deals')
        .insert({ ...payload, user_id: user?.id })
        .select('id')
        .single()
      if (err) { setSaving(false); setError(err.message); return }
      dealId = (data as { id: string }).id
    }

    const { data: fullDeal, error: fetchErr } = await supabase
      .from('deals')
      .select('*, contact:contacts(*), property:properties(*)')
      .eq('id', dealId)
      .single()
    setSaving(false)
    if (fetchErr) { setError(fetchErr.message); return }
    onSaved(fullDeal as Deal)
  }

  async function handleDelete() {
    if (!deal) return
    setDeleting(true)
    const supabase = createClient()
    const { error: err } = await supabase.from('deals').delete().eq('id', deal.id)
    setDeleting(false)
    if (err) { setError(err.message); return }
    onDeleted(deal.id)
  }

  function formatPrice(n: number) {
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)
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
            {isEdit ? 'Deal bearbeiten' : 'Neuer Deal'}
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
                  <option key={p.id} value={p.id}>
                    {p.title} – {p.city} ({formatPrice(p.price)})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={labelStyle}>Status *</label>
              <select value={form.status} onChange={set('status')} style={inputStyle}>
                <option value="lead">Lead</option>
                <option value="viewing">Besichtigung</option>
                <option value="offer">Angebot</option>
                <option value="won">Gewonnen</option>
                <option value="lost">Verloren</option>
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={labelStyle}>Dealwert (EUR) *</label>
                <input
                  type="number"
                  value={form.value}
                  onChange={set('value')}
                  placeholder="350000"
                  min="0"
                  step="1000"
                  required
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Provision (EUR) *</label>
                <input
                  type="number"
                  value={form.commission}
                  onChange={set('commission')}
                  placeholder="10500"
                  min="0"
                  step="100"
                  required
                  style={inputStyle}
                />
              </div>
            </div>

            <div>
              <label style={labelStyle}>Notizen</label>
              <textarea
                value={form.notes}
                onChange={set('notes')}
                placeholder="Weitere Informationen zum Deal…"
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
