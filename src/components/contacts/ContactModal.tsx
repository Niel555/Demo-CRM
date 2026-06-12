'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Contact, ContactType, ContactStatus } from '@/types'
import { X } from 'lucide-react'

interface Props {
  contact: Contact | null
  onClose: () => void
  onSaved: (contact: Contact) => void
  onDeleted: (id: string) => void
}

type FormState = {
  name: string
  email: string
  phone: string
  type: ContactType
  status: ContactStatus
  budget: string
  notes: string
}

const emptyForm: FormState = {
  name: '',
  email: '',
  phone: '',
  type: 'buyer',
  status: 'active',
  budget: '',
  notes: '',
}

function toForm(c: Contact): FormState {
  return {
    name: c.name,
    email: c.email,
    phone: c.phone,
    type: c.type,
    status: c.status,
    budget: c.budget != null ? String(c.budget) : '',
    notes: c.notes ?? '',
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

export default function ContactModal({ contact, onClose, onSaved, onDeleted }: Props) {
  const isEdit = contact !== null
  const [form, setForm] = useState<FormState>(contact ? toForm(contact) : emptyForm)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function set(key: keyof FormState) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm(prev => ({ ...prev, [key]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSaving(true)

    const supabase = createClient()
    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      type: form.type,
      status: form.status,
      budget: form.budget.trim() ? Number(form.budget) : null,
      notes: form.notes.trim() || null,
    }

    if (isEdit && contact) {
      const { data, error: err } = await supabase
        .from('contacts')
        .update(payload)
        .eq('id', contact.id)
        .select()
        .single()
      setSaving(false)
      if (err) { setError(err.message); return }
      onSaved(data as Contact)
    } else {
      const { data: { user } } = await supabase.auth.getUser()
      const { data, error: err } = await supabase
        .from('contacts')
        .insert({ ...payload, user_id: user?.id })
        .select()
        .single()
      setSaving(false)
      if (err) { setError(err.message); return }
      onSaved(data as Contact)
    }
  }

  async function handleDelete() {
    if (!contact) return
    setDeleting(true)
    const supabase = createClient()
    const { error: err } = await supabase.from('contacts').delete().eq('id', contact.id)
    setDeleting(false)
    if (err) { setError(err.message); return }
    onDeleted(contact.id)
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
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #1c1c1c', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#eeeeee' }}>
            {isEdit ? 'Kontakt bearbeiten' : 'Neuer Kontakt'}
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

            {/* Name */}
            <div>
              <label style={labelStyle}>Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={set('name')}
                placeholder="Max Mustermann"
                required
                style={inputStyle}
              />
            </div>

            {/* E-Mail + Telefon */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={labelStyle}>E-Mail *</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={set('email')}
                  placeholder="max@beispiel.de"
                  required
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Telefon *</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={set('phone')}
                  placeholder="+49 170 1234567"
                  required
                  style={inputStyle}
                />
              </div>
            </div>

            {/* Typ + Status */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={labelStyle}>Typ *</label>
                <select value={form.type} onChange={set('type')} style={inputStyle}>
                  <option value="buyer">Käufer</option>
                  <option value="seller">Verkäufer</option>
                  <option value="prospect">Interessent</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Status *</label>
                <select value={form.status} onChange={set('status')} style={inputStyle}>
                  <option value="active">Aktiv</option>
                  <option value="inactive">Inaktiv</option>
                  <option value="closed">Abgeschlossen</option>
                </select>
              </div>
            </div>

            {/* Budget */}
            <div>
              <label style={labelStyle}>Budget (EUR)</label>
              <input
                type="number"
                value={form.budget}
                onChange={set('budget')}
                placeholder="500000"
                min="0"
                step="1000"
                style={inputStyle}
              />
            </div>

            {/* Notizen */}
            <div>
              <label style={labelStyle}>Notizen</label>
              <textarea
                value={form.notes}
                onChange={set('notes')}
                placeholder="Weitere Informationen…"
                rows={3}
                style={{ ...inputStyle, resize: 'vertical' }}
              />
            </div>
          </div>

          {/* Footer */}
          <div style={{ padding: '16px 24px', borderTop: '1px solid #1c1c1c', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {/* Delete */}
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

            {/* Abbrechen + Speichern */}
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
