import { navigate } from '../hooks/useRouter'

interface PublicLayoutProps {
  children: React.ReactNode
}

export function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <div className="flex h-full max-h-screen flex-col overflow-hidden bg-background">
      {/* Minimal top bar */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-border shrink-0">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-foreground hover:text-primary transition-colors"
        >
          <span className="text-base">⚒️</span>
          <span className="font-bold text-sm tracking-tight">Agent-Forge</span>
        </button>

        <button
          onClick={() => navigate('/app')}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          Dashboard →
        </button>
      </header>

      {/* Page content */}
      <main className="flex-1 overflow-hidden">
        {children}
      </main>
    </div>
  )
}
