'use client'

import { useState, useEffect } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import { createClient } from '@/lib/supabase/client'
import { Contact, Deal, Property } from '@/types'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'

function formatCurrency(value: number) {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value)
}

const FUNNEL_COLORS = ['#3b82f6', '#f59e0b', '#a855f7', '#22c55e', '#ef4444']
const PIE_COLORS = ['#22c55e', '#f59e0b', '#555555']

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ backgroundColor: '#181818', border: '1px solid #2a2a2a', borderRadius: '8px', padding: '10px 14px' }}>
      <p style={{ color: '#888888', fontSize: '0.75rem', margin: '0 0 6px' }}>{label}</p>
      {payload.map((entry: { name: string; value: number; color: string }, i: number) => (
        <p key={i} style={{ margin: '2px 0', fontSize: '0.875rem', fontWeight: 600, color: entry.color }}>
          {entry.name === 'umsatz' ? formatCurrency(entry.value) : entry.value}
        </p>
      ))}
    </div>
  )
}

export default function AnalyticsPage() {
  const [deals, setDeals] = useState<Deal[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    Promise.all([
      supabase.from('deals').select('*, contact:contacts(*), property:properties(*)'),
      supabase.from('contacts').select('*'),
      supabase.from('properties').select('*'),
    ]).then(([d, c, p]) => {
      setDeals((d.data ?? []) as Deal[])
      setContacts((c.data ?? []) as Contact[])
      setProperties((p.data ?? []) as Property[])
      setLoading(false)
    })
  }, [])

  const wonDeals = deals.filter(d => d.status === 'won')
  const totalRevenue = wonDeals.reduce((s, d) => s + d.commission, 0)
  const conversionRate = deals.length ? Math.round((wonDeals.length / deals.length) * 100) : 0
  const avgDealValue = wonDeals.length ? Math.round(wonDeals.reduce((s, d) => s + d.value, 0) / wonDeals.length) : 0

  // Last 6 months revenue from won deals
  const now = new Date()
  const monthlyRevenue = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1)
    const monthDeals = wonDeals.filter(deal => {
      const dealDate = new Date(deal.created_at)
      return dealDate.getFullYear() === d.getFullYear() && dealDate.getMonth() === d.getMonth()
    })
    return {
      month: d.toLocaleDateString('de-DE', { month: 'short' }),
      umsatz: monthDeals.reduce((s, deal) => s + deal.commission, 0),
      deals: monthDeals.length,
    }
  })

  const dealFunnel = [
    { stage: 'Lead', count: deals.filter(d => d.status === 'lead').length },
    { stage: 'Besichtigung', count: deals.filter(d => d.status === 'viewing').length },
    { stage: 'Angebot', count: deals.filter(d => d.status === 'offer').length },
    { stage: 'Gewonnen', count: deals.filter(d => d.status === 'won').length },
    { stage: 'Verloren', count: deals.filter(d => d.status === 'lost').length },
  ]

  const topProperties = properties
    .map(p => ({
      name: p.title,
      deals: deals.filter(d => d.property.id === p.id).length,
    }))
    .sort((a, b) => b.deals - a.deals)
    .slice(0, 5)

  const maxDeals = Math.max(...topProperties.map(p => p.deals), 1)

  const propertyStatusData = [
    { name: 'Verfügbar', value: properties.filter(p => p.status === 'available').length },
    { name: 'Reserviert', value: properties.filter(p => p.status === 'reserved').length },
    { name: 'Verkauft', value: properties.filter(p => p.status === 'sold').length },
  ]

  return (
    <AppLayout
      title="Analytics"
      subtitle="Auswertungen und Kennzahlen für Vieregge Immobilien"
    >
      {/* Loading */}
      {loading && (
        <div style={{ padding: '80px', textAlign: 'center', color: '#444444', fontSize: '0.875rem' }}>
          Wird geladen…
        </div>
      )}

      {!loading && (
        <>
          {/* KPI Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
            {[
              { label: 'Gesamt-Provision', value: formatCurrency(totalRevenue), color: '#22c55e', sub: `${wonDeals.length} abgeschlossene Deals` },
              { label: 'Conversion Rate', value: `${conversionRate}%`, color: '#6366f1', sub: 'Lead zu Gewonnen' },
              { label: 'Ø Deal-Wert', value: formatCurrency(avgDealValue), color: '#f59e0b', sub: 'Durchschnittlicher Objektwert' },
              { label: 'Aktive Kontakte', value: contacts.filter(c => c.status === 'active').length.toString(), color: '#3b82f6', sub: `von ${contacts.length} gesamt` },
            ].map(kpi => (
              <div
                key={kpi.label}
                style={{
                  backgroundColor: '#111111',
                  border: '1px solid #1e1e1e',
                  borderRadius: '10px',
                  padding: '18px 20px',
                }}
              >
                <div style={{ color: '#666666', fontSize: '0.8125rem', marginBottom: '8px' }}>{kpi.label}</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: kpi.color, lineHeight: 1 }}>{kpi.value}</div>
                <div style={{ color: '#444444', fontSize: '0.75rem', marginTop: '6px' }}>{kpi.sub}</div>
              </div>
            ))}
          </div>

          {/* Charts Row 1 */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px', marginBottom: '16px' }}>
            {/* Monthly Revenue Bar Chart */}
            <div style={{ backgroundColor: '#111111', border: '1px solid #1e1e1e', borderRadius: '10px', padding: '20px' }}>
              <h3 style={{ margin: '0 0 20px', color: '#eeeeee', fontSize: '0.9375rem', fontWeight: 600 }}>
                Monatsweise Provision (EUR)
              </h3>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={monthlyRevenue} barSize={28}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1c1c1c" vertical={false} />
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#555555', fontSize: 12 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#555555', fontSize: 11 }}
                    tickFormatter={v => `${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                  <Bar dataKey="umsatz" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Property Status Pie */}
            <div style={{ backgroundColor: '#111111', border: '1px solid #1e1e1e', borderRadius: '10px', padding: '20px' }}>
              <h3 style={{ margin: '0 0 20px', color: '#eeeeee', fontSize: '0.9375rem', fontWeight: 600 }}>
                Objekte nach Status
              </h3>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={propertyStatusData}
                    cx="50%"
                    cy="45%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {propertyStatusData.map((_, index) => (
                      <Cell key={index} fill={PIE_COLORS[index]} />
                    ))}
                  </Pie>
                  <Legend
                    formatter={(value) => <span style={{ color: '#888888', fontSize: '0.8125rem' }}>{value}</span>}
                    iconSize={10}
                    iconType="circle"
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#181818', border: '1px solid #2a2a2a', borderRadius: '8px' }}
                    labelStyle={{ color: '#888888' }}
                    itemStyle={{ color: '#eeeeee' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Charts Row 2 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {/* Deal Funnel */}
            <div style={{ backgroundColor: '#111111', border: '1px solid #1e1e1e', borderRadius: '10px', padding: '20px' }}>
              <h3 style={{ margin: '0 0 20px', color: '#eeeeee', fontSize: '0.9375rem', fontWeight: 600 }}>
                Deal-Pipeline
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {dealFunnel.map((item, i) => {
                  const max = Math.max(...dealFunnel.map(d => d.count), 1)
                  const pct = (item.count / max) * 100
                  return (
                    <div key={item.stage}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ color: '#888888', fontSize: '0.8125rem' }}>{item.stage}</span>
                        <span style={{ color: '#eeeeee', fontSize: '0.8125rem', fontWeight: 600 }}>{item.count}</span>
                      </div>
                      <div style={{ backgroundColor: '#1a1a1a', borderRadius: '4px', height: '8px', overflow: 'hidden' }}>
                        <div
                          style={{
                            height: '100%',
                            width: `${pct}%`,
                            backgroundColor: FUNNEL_COLORS[i],
                            borderRadius: '4px',
                            transition: 'width 0.5s ease',
                          }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Top Properties */}
            <div style={{ backgroundColor: '#111111', border: '1px solid #1e1e1e', borderRadius: '10px', padding: '20px' }}>
              <h3 style={{ margin: '0 0 20px', color: '#eeeeee', fontSize: '0.9375rem', fontWeight: 600 }}>
                Beste Objekte (nach Deals)
              </h3>
              {topProperties.length === 0 && (
                <div style={{ color: '#444444', fontSize: '0.875rem', textAlign: 'center', padding: '32px 0' }}>
                  Keine Daten vorhanden
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {topProperties.map((prop, i) => (
                  <div key={prop.name} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '6px',
                        backgroundColor: i === 0 ? 'rgba(99,102,241,0.2)' : '#161616',
                        color: i === 0 ? '#6366f1' : '#555555',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {i + 1}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ color: '#cccccc', fontSize: '0.875rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {prop.name}
                      </div>
                      <div style={{ color: '#444444', fontSize: '0.75rem' }}>{prop.deals} Deals</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                      <div
                        style={{
                          width: `${(prop.deals / maxDeals) * 60}px`,
                          height: '4px',
                          backgroundColor: '#6366f1',
                          borderRadius: '2px',
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </AppLayout>
  )
}
