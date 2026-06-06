'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  LayoutDashboard,
  Users,
  Building2,
  Handshake,
  CalendarDays,
  BarChart3,
  LogOut,
  ChevronRight,
} from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/contacts', label: 'Kontakte', icon: Users },
  { href: '/properties', label: 'Objekte', icon: Building2 },
  { href: '/deals', label: 'Deals', icon: Handshake },
  { href: '/viewings', label: 'Besichtigungen', icon: CalendarDays },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside
      style={{
        width: '220px',
        minWidth: '220px',
        backgroundColor: '#0e0e0e',
        borderRight: '1px solid #1c1c1c',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        position: 'sticky',
        top: 0,
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: '20px 16px 16px',
          borderBottom: '1px solid #1c1c1c',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              backgroundColor: '#6366f1',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Building2 size={16} color="white" />
          </div>
          <div>
            <div style={{ color: '#eeeeee', fontWeight: 700, fontSize: '0.875rem', lineHeight: 1.2 }}>
              Vieregge
            </div>
            <div style={{ color: '#555555', fontSize: '0.6875rem', lineHeight: 1.2 }}>Immobilien CRM</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '12px 8px', overflowY: 'auto' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link
                key={href}
                href={href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '8px 10px',
                  borderRadius: '7px',
                  textDecoration: 'none',
                  fontSize: '0.875rem',
                  fontWeight: active ? 500 : 400,
                  color: active ? '#eeeeee' : '#666666',
                  backgroundColor: active ? '#1e1e1e' : 'transparent',
                  transition: 'all 0.1s',
                }}
                onMouseEnter={e => {
                  if (!active) {
                    const el = e.currentTarget as HTMLElement
                    el.style.backgroundColor = '#161616'
                    el.style.color = '#cccccc'
                  }
                }}
                onMouseLeave={e => {
                  if (!active) {
                    const el = e.currentTarget as HTMLElement
                    el.style.backgroundColor = 'transparent'
                    el.style.color = '#666666'
                  }
                }}
              >
                <Icon size={16} style={{ flexShrink: 0 }} />
                <span>{label}</span>
                {active && (
                  <ChevronRight
                    size={14}
                    style={{ marginLeft: 'auto', color: '#6366f1' }}
                  />
                )}
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Footer */}
      <div style={{ padding: '12px 8px', borderTop: '1px solid #1c1c1c' }}>
        <button
          onClick={handleSignOut}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '8px 10px',
            borderRadius: '7px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            width: '100%',
            color: '#555555',
            fontSize: '0.875rem',
            transition: 'all 0.1s',
          }}
          onMouseEnter={e => {
            const el = e.currentTarget as HTMLElement
            el.style.backgroundColor = '#1a0f0f'
            el.style.color = '#ef4444'
          }}
          onMouseLeave={e => {
            const el = e.currentTarget as HTMLElement
            el.style.backgroundColor = 'transparent'
            el.style.color = '#555555'
          }}
        >
          <LogOut size={16} />
          <span>Abmelden</span>
        </button>
      </div>
    </aside>
  )
}
