'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Property, PropertyType, PropertyStatus } from '@/types'
import { X } from 'lucide-react'

interface Props {
  property: Property | null
  onClose: () => void
  onSaved: (property: Property) => void
  onDeleted: (id: string) => void
}

type FormState = {
  title: string
  address: string
  city: string
  price: string
  size: string
  rooms: string
  type: PropertyType
  status: PropertyStatus
  description: string
}

const emptyForm: FormState = {
  title: '',
  address: '',
  city: '',
  price: '',
  size: '',
  rooms: '0',
  type: 'apartment',
  status: 'available',
  description: '',
}

function toForm(p: Property): FormState {
  return {
    title: p.title,
    address: p.address,
    city: p.city,
    price: String(p.price),
    size: String(p.size),
    rooms: String(p.rooms),
    type: p.type,
    status: p.status,
    description: p.description ?? '',
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

export default function PropertyModal({ property, onClose, onSaved, onDeleted }: Props) {
  const isEdit = property !== null
  const [form, setForm] = useState<FormState>(property ? toForm(property) : emptyForm)
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
      title: form.title.trim(),
      address: form.address.trim(),
      city: form.city.trim(),
      price: Number(form.price),
      size: Number(form.size),
      rooms: Number(form.rooms),
      type: form.type,
      status: form.status,
      description: form.description.trim() || null,
    }

    if (isEdit && property) {
      const { data, error: err } = await supabase
        .from('properties')
        .update(payload)
        .eq('id', property.id)
        .select()
        .single()
      setSaving(false)
      if (err) { setError(err.message); return }
      onSaved(data as Property)
    } else {
      const { data: { user } } = await supabase.auth.getUser()
      const { data, error: err } = await supabase
        .from('properties')
        .insert({ ...payload, user_id: user?.id })
        .select()
        .single()
      setSaving(false)
      if (err) { setError(err.message); return }
      onSaved(data as Property)
    }
  }

  async function handleDelete() {
    if (!property) return
    setDeleting(true)
    const supabase = createClient()
    const { error: err } = await supabase.from('properties').delete().eq('id', property.id)
    setDeleting(false)
    if (err) { setError(err.message); return }
    onDeleted(property.id)
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
          maxWidth: '520px',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 32px 96px rgba(0,0,0,0.7)',
        }}
      >
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #1c1c1c', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#eeeeee' }}>
            {isEdit ? 'Objekt bearbeiten' : 'Neues Objekt'}
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
              <label style={labelStyle}>Titel *</label>
              <input
                type="text"
                value={form.title}
                onChange={set('title')}
                placeholder="Moderne 3-Zimmer Wohnung"
                required
                style={inputStyle}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
              <div>
                <label style={labelStyle}>Adresse *</label>
                <input
                  type="text"
                  value={form.address}
                  onChange={set('address')}
                  placeholder="Musterstraße 123"
                  required
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Stadt *</label>
                <input
                  type="text"
                  value={form.city}
                  onChange={set('city')}
                  placeholder="Berlin"
                  required
                  style={inputStyle}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
              <div>
                <label style={labelStyle}>Preis (EUR) *</label>
                <input
                  type="number"
                  value={form.price}
                  onChange={set('price')}
                  placeholder="450000"
                  min="0"
                  step="1000"
                  required
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Größe (m²) *</label>
                <input
                  type="number"
                  value={form.size}
                  onChange={set('size')}
                  placeholder="85"
                  min="0"
                  step="0.5"
                  required
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Zimmer</label>
                <input
                  type="number"
                  value={form.rooms}
                  onChange={set('rooms')}
                  placeholder="3"
                  min="0"
                  step="1"
                  style={inputStyle}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={labelStyle}>Typ *</label>
                <select value={form.type} onChange={set('type')} style={inputStyle}>
                  <option value="apartment">Wohnung</option>
                  <option value="house">Haus</option>
                  <option value="commercial">Gewerbe</option>
                  <option value="land">Grundstück</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Status *</label>
                <select value={form.status} onChange={set('status')} style={inputStyle}>
                  <option value="available">Verfügbar</option>
                  <option value="reserved">Reserviert</option>
                  <option value="sold">Verkauft</option>
                </select>
              </div>
            </div>

            <div>
              <label style={labelStyle}>Beschreibung</label>
              <textarea
                value={form.description}
                onChange={set('description')}
                placeholder="Beschreibung des Objekts…"
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
