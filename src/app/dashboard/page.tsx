import AppLayout from '@/components/layout/AppLayout'
import { createClient } from '@/lib/supabase/server'
import { Contact, Deal, Property, Viewing } from '@/types'
import { TrendingUp, Users, Building2, CalendarDays, Euro, ArrowRight } from 'lucide-react'
import Link from 'next/link'

function formatPrice(n: number) {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const dealStatusLabel: Record<string, string> = {
  lead: 'Lead',
  viewing: 'Besichtigung',
  offer: 'Angebot',
  won: 'Gewonnen',
  lost: 'Verloren',
}

const dealStatusColor: Record<string, { bg: string; text: string }> = {
  lead: { bg: 'rgba(59,130,246,0.12)', text: '#3b82f6' },
  viewing: { bg: 'rgba(245,158,11,0.12)', text: '#f59e0b' },
  offer: { bg: 'rgba(168,85,247,0.12)', text: '#a855f7' },
  won: { bg: 'rgba(34,197,94,0.12)', text: '#22c55e' },
  lost: { bg: 'rgba(239,68,68,0.12)', text: '#ef4444' },
}

export default async function DashboardPage() {
  const supabase = await createClient()

  const [
    { data: contactsData },
    { data: dealsData },
    { data: propertiesData },
    { data: viewingsData },
  ] = await Promise.all([
    supabase.from('contacts').select('*'),
    supabase.from('deals').select('*, contact:contacts(*), property:properties(*)'),
    supabase.from('properties').select('*'),
    supabase.from('viewings').select('*, contact:contacts(*), property:properties(*)'),
  ])

  const contacts = (contactsData ?? []) as Contact[]
  const deals = (dealsData ?? []) as Deal[]
  const properties = (propertiesData ?? []) as Property[]
  const viewings = (viewingsData ?? []) as Viewing[]

  const openDeals = deals.filter(d => !['won', 'lost'].includes(d.status))
  const wonDeals = deals.filter(d => d.status === 'won')
  const totalRevenue = wonDeals.reduce((sum, d) => sum + d.commission, 0)
  const upcomingViewings = viewings.filter(v => v.status === 'scheduled')
  const availableProperties = properties.filter(p => p.status === 'available')

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const newContactsThisMonth = contacts.filter(c => c.created_at >= startOfMonth).length

  const kpis = [
    {
      label: 'Offene Deals',
      value: openDeals.length,
      icon: TrendingUp,
      color: '#6366f1',
      bg: 'rgba(99,102,241,0.1)',
      sub: `${wonDeals.length} gewonnen`,
    },
    {
      label: 'Aktive Kontakte',
      value: contacts.filter(c => c.status === 'active').length,
      icon: Users,
      color: '#3b82f6',
      bg: 'rgba(59,130,246,0.1)',
      sub: `${contacts.length} gesamt`,
    },
    {
      label: 'Verfügbare Objekte',
      value: availableProperties.length,
      icon: Building2,
      color: '#22c55e',
      bg: 'rgba(34,197,94,0.1)',
      sub: `${properties.length} gesamt`,
    },
    {
      label: 'Neue Kontakte',
      value: newContactsThisMonth,
      icon: CalendarDays,
      color: '#f59e0b',
      bg: 'rgba(245,158,11,0.1)',
      sub: 'diesen Monat',
    },
  ]

  const recentDeals = [...deals].sort((a, b) =>
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  ).slice(0, 5)

  const nextViewings = viewings
    .filter(v => v.status === 'scheduled')
    .sort((a, b) => new Date(a.date + 'T' + a.time).getTime() - new Date(b.date + 'T' + b.time).getTime())
    .slice(0, 4)

  return (
    <AppLayout
      title="Dashboard"
      subtitle={`Willkommen zurück — ${new Date().toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}`}
    >
      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
        {kpis.map(kpi => (
          <div
            key={kpi.label}
            style={{
              backgroundColor: '#111111',
              border: '1px solid #1e1e1e',
              borderRadius: '10px',
              padding: '18px 20px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ color: '#888888', fontSize: '0.8125rem' }}>{kpi.label}</span>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  backgroundColor: kpi.bg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <kpi.icon size={16} color={kpi.color} />
              </div>
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#eeeeee', lineHeight: 1 }}>{kpi.value}</div>
            <div style={{ color: '#555555', fontSize: '0.75rem', marginTop: '6px' }}>{kpi.sub}</div>
          </div>
        ))}
      </div>

      {/* Revenue Card */}
      <div
        style={{
          backgroundColor: '#111111',
          border: '1px solid #1e1e1e',
          borderRadius: '10px',
          padding: '18px 20px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundImage: 'linear-gradient(135deg, rgba(99,102,241,0.06) 0%, transparent 60%)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '10px',
              backgroundColor: 'rgba(168,85,247,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Euro size={20} color="#a855f7" />
          </div>
          <div>
            <div style={{ color: '#888888', fontSize: '0.8125rem' }}>Provision gesamt (YTD)</div>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: '#eeeeee', lineHeight: 1.2 }}>
              {formatPrice(totalRevenue)}
            </div>
          </div>
        </div>
        <Link
          href="/analytics"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            color: '#6366f1',
            textDecoration: 'none',
            fontSize: '0.8125rem',
            fontWeight: 500,
          }}
        >
          Analytics ansehen <ArrowRight size={14} />
        </Link>
      </div>

      {/* Two Column Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        {/* Recent Deals */}
        <div style={{ backgroundColor: '#111111', border: '1px solid #1e1e1e', borderRadius: '10px', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #1c1c1c', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 600, color: '#eeeeee' }}>Aktuelle Deals</h3>
            <Link href="/deals" style={{ color: '#6366f1', textDecoration: 'none', fontSize: '0.8125rem' }}>
              Alle ansehen
            </Link>
          </div>
          <div>
            {recentDeals.length === 0 && (
              <div style={{ padding: '32px 20px', textAlign: 'center', color: '#444444', fontSize: '0.875rem' }}>
                Keine Deals vorhanden
              </div>
            )}
            {recentDeals.map((deal, i) => {
              const sc = dealStatusColor[deal.status]
              return (
                <div
                  key={deal.id}
                  style={{
                    padding: '14px 20px',
                    borderBottom: i < recentDeals.length - 1 ? '1px solid #161616' : 'none',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: '#dddddd', fontSize: '0.875rem', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {deal.contact.name}
                    </div>
                    <div style={{ color: '#555555', fontSize: '0.75rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {deal.property.title}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px', flexShrink: 0 }}>
                    <span style={{
                      backgroundColor: sc.bg,
                      color: sc.text,
                      fontSize: '0.6875rem',
                      fontWeight: 500,
                      padding: '2px 8px',
                      borderRadius: '4px',
                    }}>
                      {dealStatusLabel[deal.status]}
                    </span>
                    <span style={{ color: '#555555', fontSize: '0.6875rem' }}>{formatDate(deal.created_at)}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Upcoming Viewings */}
        <div style={{ backgroundColor: '#111111', border: '1px solid #1e1e1e', borderRadius: '10px', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #1c1c1c', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 600, color: '#eeeeee' }}>Nächste Besichtigungen</h3>
            <Link href="/viewings" style={{ color: '#6366f1', textDecoration: 'none', fontSize: '0.8125rem' }}>
              Alle ansehen
            </Link>
          </div>
          <div>
            {nextViewings.map((v, i) => (
              <div
                key={v.id}
                style={{
                  padding: '14px 20px',
                  borderBottom: i < nextViewings.length - 1 ? '1px solid #161616' : 'none',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: '#dddddd', fontSize: '0.875rem', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {v.contact.name}
                  </div>
                  <div style={{ color: '#555555', fontSize: '0.75rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {v.property.title}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px', flexShrink: 0 }}>
                  <span style={{ color: '#f59e0b', fontSize: '0.8125rem', fontWeight: 600 }}>{v.time}</span>
                  <span style={{ color: '#555555', fontSize: '0.6875rem' }}>
                    {new Date(v.date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}
            {nextViewings.length === 0 && (
              <div style={{ padding: '32px 20px', textAlign: 'center', color: '#444444', fontSize: '0.875rem' }}>
                Keine Besichtigungen geplant
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
