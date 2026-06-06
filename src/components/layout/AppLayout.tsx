import Sidebar from './Sidebar'

interface AppLayoutProps {
  children: React.ReactNode
  title: string
  subtitle?: string
  actions?: React.ReactNode
}

export default function AppLayout({ children, title, subtitle, actions }: AppLayoutProps) {
  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#080808', overflow: 'hidden' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <header
          style={{
            borderBottom: '1px solid #1c1c1c',
            padding: '16px 28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#080808',
            flexShrink: 0,
          }}
        >
          <div>
            <h1 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600, color: '#eeeeee' }}>{title}</h1>
            {subtitle && <p style={{ margin: '2px 0 0', fontSize: '0.8125rem', color: '#666666' }}>{subtitle}</p>}
          </div>
          {actions && <div style={{ display: 'flex', gap: '8px' }}>{actions}</div>}
        </header>

        {/* Content */}
        <main style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
          {children}
        </main>
      </div>
    </div>
  )
}
