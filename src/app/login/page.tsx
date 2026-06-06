'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Building2, Loader2, Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()

    try {
      if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        router.push('/dashboard')
        router.refresh()
      } else {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        setError('')
        setMode('signin')
        alert('Account erstellt! Bitte bestätige deine E-Mail und melde dich an.')
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten'
      if (message.includes('Invalid login credentials')) {
        setError('Ungültige E-Mail oder Passwort.')
      } else if (message.includes('Email not confirmed')) {
        setError('Bitte bestätige zuerst deine E-Mail-Adresse.')
      } else {
        setError(message)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{ backgroundColor: '#080808', minHeight: '100vh' }}
      className="flex flex-col items-center justify-center px-4"
    >
      {/* Logo */}
      <div className="flex flex-col items-center mb-10">
        <div
          style={{ backgroundColor: '#6366f1', borderRadius: '12px' }}
          className="w-12 h-12 flex items-center justify-center mb-4"
        >
          <Building2 size={24} color="white" />
        </div>
        <h1 style={{ color: '#eeeeee', fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>
          Vieregge Immobilien
        </h1>
        <p style={{ color: '#888888', fontSize: '0.875rem', marginTop: '4px' }}>CRM-System</p>
      </div>

      {/* Card */}
      <div
        style={{
          backgroundColor: '#111111',
          border: '1px solid #242424',
          borderRadius: '12px',
          padding: '32px',
          width: '100%',
          maxWidth: '400px',
        }}
      >
        <h2 style={{ color: '#eeeeee', fontSize: '1.125rem', fontWeight: 600, margin: '0 0 24px' }}>
          {mode === 'signin' ? 'Anmelden' : 'Account erstellen'}
        </h2>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ color: '#888888', fontSize: '0.8125rem', fontWeight: 500, display: 'block', marginBottom: '6px' }}>
              E-Mail-Adresse
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="name@example.com"
              style={{
                backgroundColor: '#181818',
                border: '1px solid #242424',
                borderRadius: '8px',
                color: '#eeeeee',
                fontSize: '0.875rem',
                padding: '10px 12px',
                width: '100%',
                outline: 'none',
                transition: 'border-color 0.15s',
              }}
              onFocus={e => (e.target.style.borderColor = '#6366f1')}
              onBlur={e => (e.target.style.borderColor = '#242424')}
            />
          </div>

          <div>
            <label style={{ color: '#888888', fontSize: '0.8125rem', fontWeight: 500, display: 'block', marginBottom: '6px' }}>
              Passwort
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                style={{
                  backgroundColor: '#181818',
                  border: '1px solid #242424',
                  borderRadius: '8px',
                  color: '#eeeeee',
                  fontSize: '0.875rem',
                  padding: '10px 40px 10px 12px',
                  width: '100%',
                  outline: 'none',
                  transition: 'border-color 0.15s',
                }}
                onFocus={e => (e.target.style.borderColor = '#6366f1')}
                onBlur={e => (e.target.style.borderColor = '#242424')}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#555555',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <div
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '8px',
                color: '#ef4444',
                fontSize: '0.8125rem',
                padding: '10px 12px',
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              backgroundColor: '#6366f1',
              border: 'none',
              borderRadius: '8px',
              color: 'white',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '0.875rem',
              fontWeight: 600,
              opacity: loading ? 0.7 : 1,
              padding: '11px',
              marginTop: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'background-color 0.15s',
            }}
            onMouseEnter={e => !loading && ((e.target as HTMLElement).style.backgroundColor = '#4f46e5')}
            onMouseLeave={e => !loading && ((e.target as HTMLElement).style.backgroundColor = '#6366f1')}
          >
            {loading && <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />}
            {mode === 'signin' ? 'Anmelden' : 'Account erstellen'}
          </button>
        </form>

        <div style={{ marginTop: '20px', textAlign: 'center', borderTop: '1px solid #1c1c1c', paddingTop: '20px' }}>
          <span style={{ color: '#555555', fontSize: '0.8125rem' }}>
            {mode === 'signin' ? 'Noch kein Account? ' : 'Bereits registriert? '}
          </span>
          <button
            onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError('') }}
            style={{ background: 'none', border: 'none', color: '#6366f1', cursor: 'pointer', fontSize: '0.8125rem', fontWeight: 500 }}
          >
            {mode === 'signin' ? 'Jetzt registrieren' : 'Anmelden'}
          </button>
        </div>
      </div>

      <p style={{ color: '#333333', fontSize: '0.75rem', marginTop: '24px', textAlign: 'center' }}>
        © 2025 Vieregge Immobilien. Alle Rechte vorbehalten.
      </p>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
